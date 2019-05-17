const Koa = require('koa');
const Router = require('koa-router');
const session = require('koa-session');
const body = require('koa-body');
const cors = require('@koa/cors');
const get = require('lodash/get');
const capitalize = require('lodash/capitalize');
const trim = require('lodash/trim');
const { ApolloServer } = require('apollo-server-koa');
const Logger = require('@deity/falcon-logger');
const ApiContainer = require('./containers/ApiContainer');
const ExtensionContainer = require('./containers/ExtensionContainer');
const EndpointContainer = require('./containers/EndpointContainer');
const { EventEmitter2 } = require('eventemitter2');
const { resolve: resolvePath } = require('path');
const { readFileSync } = require('fs');
const { codes } = require('@deity/falcon-errors');
const { Events, Cache, InMemoryLRUCache } = require('@deity/falcon-server-env');
const GraphQLJSON = require('graphql-type-json');
const DynamicRouteResolver = require('./resolvers/DynamicRouteResolver');
const GraphQLCacheDirective = require('./schemaDirectives/GraphQLCacheDirective');

const BaseSchema = readFileSync(resolvePath(__dirname, './schema.graphql'), 'utf8');

class FalconServer {
  constructor(config) {
    this.loggableErrorCodes = [codes.INTERNAL_SERVER_ERROR, codes.GRAPHQL_PARSE_FAILED];
    this.config = config;
    this.server = null;
    this.backendConfig = {};
    const { maxListeners = 20, verboseEvents = false } = this.config;
    if (config.logLevel) {
      Logger.setLogLevel(config.logLevel);
    }

    this.eventEmitter = new EventEmitter2({
      maxListeners,
      wildcard: true,
      verboseMemoryLeak: false
    });

    this.eventEmitter.on(Events.ERROR, async error => {
      const stacktrace = get(error, 'extensions.exception.stacktrace', []);
      let { message } = error;
      if (stacktrace.length > 0) {
        message = stacktrace[0];
        if (stacktrace[1]) {
          message += ` ${trim(stacktrace[1])}`;
        }
      }
      Logger.error(`FalconServer: ${message}`, error);
    });

    if (verboseEvents) {
      this.eventEmitter.onAny(event => {
        Logger.debug(`Triggering "${event}" event...`);
      });
    }
  }

  async initialize() {
    await this.eventEmitter.emitAsync(Events.BEFORE_INITIALIZED, this);
    await this.initializeServerApp();
    await this.initializeContainers();
    await this.initializeApolloServer();
    await this.registerEndpoints();
    await this.eventEmitter.emitAsync(Events.AFTER_INITIALIZED, this);
  }

  async getApolloServerConfig() {
    const cache = new Cache(this.getCacheProvider());
    const dynamicRouteResolver = new DynamicRouteResolver(this.extensionContainer);

    const apolloServerConfig = await this.extensionContainer.createGraphQLConfig({
      schemas: [BaseSchema],
      dataSources: () => {
        Logger.debug('FalconServer: Instantiating GraphQL DataSources');
        const dataSources = {};
        this.apiContainer.dataSources.forEach((value, key) => {
          dataSources[key] = value(apolloServerConfig);
        });
        return dataSources;
      },
      schemaDirectives: {
        cache: GraphQLCacheDirective
      },
      formatError: error => this.formatGraphqlError(error),
      // inject session and headers into GraphQL context
      context: ({ ctx }) => ({
        cache,
        config: this.config,
        headers: ctx.req.headers,
        session: ctx.req.session
      }),
      cache,
      resolvers: {
        Query: {
          url: async (...params) => dynamicRouteResolver.fetchUrl(...params),
          backendConfig: async (...params) => this.fetchBackendConfig(...params)
        },
        Mutation: {
          setLocale: (...params) => this.setLocale(...params)
        },
        BackendConfig: {
          activeLocale: (_, __, { session: _session }) => _session.locale
        },
        JSON: GraphQLJSON
      },
      tracing: this.config.debug,
      playground: this.config.debug && {
        settings: {
          'request.credentials': 'include' // include to keep the session between requests
        }
      }
    });

    /* eslint-disable no-underscore-dangle */
    // Removing "placeholder" (_) fields from the Type definitions
    delete apolloServerConfig.schema._subscriptionType._fields._;

    // If there were no other fields defined for Type by any other extension
    // - we need to remove it completely in order to comply with GraphQL specification
    if (!Object.keys(apolloServerConfig.schema._subscriptionType._fields).length) {
      apolloServerConfig.schema._subscriptionType = undefined;
      delete apolloServerConfig.schema._typeMap.Subscription;
    }
    /* eslint-enable no-underscore-dangle */

    return apolloServerConfig;
  }

  /**
   * @private
   */
  async initializeServerApp() {
    await this.eventEmitter.emitAsync(Events.BEFORE_WEB_SERVER_CREATED, this.config);
    this.app = new Koa();
    // Set signed cookie keys (https://koajs.com/#app-keys-)
    this.app.keys = this.config.session.keys;

    this.router = new Router();

    this.app.use(body());
    this.app.use(
      cors({
        credentials: true
      })
    );
    // todo: implement backend session store e.g. https://www.npmjs.com/package/koa-redis-session
    this.app.use(session((this.config.session && this.config.session.options) || {}, this.app));

    this.app.use((ctx, next) => {
      // copy session to native Node's req object because GraphQL execution context doesn't have access to Koa's
      // context, see https://github.com/apollographql/apollo-server/issues/1551
      ctx.req.session = ctx.session;
      return next();
    });
    this.app.use(async (ctx, next) => {
      await this.eventEmitter.emitAsync(Events.BEFORE_WEB_SERVER_REQUEST, ctx);
      await next();
      await this.eventEmitter.emitAsync(Events.AFTER_WEB_SERVER_REQUEST, ctx);
    });

    await this.eventEmitter.emitAsync(Events.AFTER_WEB_SERVER_CREATED, this.app);
  }

  /**
   * @private
   */
  async initializeContainers() {
    await this.eventEmitter.emitAsync(Events.BEFORE_API_CONTAINER_CREATED, this.config.apis);
    /** @type {ApiContainer} */
    this.apiContainer = new ApiContainer(this.eventEmitter);
    await this.apiContainer.registerApis(this.config.apis);
    await this.eventEmitter.emitAsync(Events.AFTER_API_CONTAINER_CREATED, this.apiContainer);

    await this.eventEmitter.emitAsync(Events.BEFORE_EXTENSION_CONTAINER_CREATED, this.config.extensions);
    /** @type {ExtensionContainer} */
    this.extensionContainer = new ExtensionContainer(this.eventEmitter);
    await this.extensionContainer.registerExtensions(this.config.extensions, this.apiContainer.dataSources);
    await this.eventEmitter.emitAsync(Events.AFTER_EXTENSION_CONTAINER_CREATED, this.extensionContainer);

    this.endpointContainer = new EndpointContainer(this.eventEmitter);
    await this.endpointContainer.registerEndpoints(this.config.endpoints);
  }

  /**
   * @private
   */
  async initializeApolloServer() {
    const apolloServerConfig = await this.getApolloServerConfig();

    await this.eventEmitter.emitAsync(Events.BEFORE_APOLLO_SERVER_CREATED, apolloServerConfig);
    this.server = new ApolloServer(apolloServerConfig);
    await this.eventEmitter.emitAsync(Events.AFTER_APOLLO_SERVER_CREATED, this.server);

    this.server.applyMiddleware({ app: this.app });
  }

  /**
   * Create instance of cache backend based on configuration ("cache" key from config)
   * @private
   * @return {KeyValueCache} instance of cache backend
   */
  getCacheProvider() {
    const { type, options = {} } = this.config.cache || {};
    const packageName = type ? `apollo-server-cache-${type}` : null;
    try {
      // eslint-disable-next-line import/no-dynamic-require
      const CacheBackend = packageName ? require(packageName)[`${capitalize(type)}Cache`] : InMemoryLRUCache;
      return new CacheBackend(options);
    } catch (ex) {
      Logger.error(
        `FalconServer: Cannot initialize cache backend using "${packageName}" package, GraphQL server will operate without cache`
      );
    }
  }

  /**
   * Registers API Provider endpoints
   * @private
   */
  async registerEndpoints() {
    const endpoints = [];
    await this.eventEmitter.emitAsync(Events.BEFORE_ENDPOINTS_REGISTERED, this.endpointContainer.entries);
    this.endpointContainer.entries.forEach(({ methods, path: routerPath, handler }) => {
      (Array.isArray(methods) ? methods : [methods]).forEach(method => {
        Logger.debug(`FalconServer: registering endpoint ${method.toUpperCase()}: "${routerPath}"`);
        this.router[method.toLowerCase()](routerPath, handler);
        if (endpoints.indexOf(routerPath) < 0) {
          endpoints.push(routerPath);
        }
      });
    });
    this.router.get('/config', ctx => {
      ctx.body = { endpoints };
    });

    this.app.use(this.router.routes()).use(this.router.allowedMethods());
    await this.eventEmitter.emitAsync(Events.AFTER_ENDPOINTS_REGISTERED, this.router);
  }

  async setLocale(_, args, context, info) {
    context.session.locale = args.locale;
    return this.fetchBackendConfig(_, args, context, info);
  }

  async fetchBackendConfig(_, args, context, info) {
    return this.extensionContainer.fetchBackendConfig(_, args, context, info);
  }

  formatGraphqlError(error) {
    let { code = codes.INTERNAL_SERVER_ERROR } = error.extensions || {};

    if (get(error, 'extensions.response.status') === 404) {
      code = codes.NOT_FOUND;
    }

    if (this.loggableErrorCodes.includes(code)) {
      setImmediate(async () => {
        await this.eventEmitter.emitAsync(Events.ERROR, error);
      });
    }

    return {
      ...error,
      extensions: {
        code
      }
    };
  }

  start() {
    const handleStartupError = err => {
      this.eventEmitter.emitAsync(Events.ERROR, err).then(() => {
        Logger.error('FalconServer: Initialization error - cannot start the server');
        Logger.error(err.stack);
        process.exit(2);
      });
    };

    Logger.info('Starting Falcon Server');

    this.initialize()
      .then(() => this.eventEmitter.emitAsync(Events.BEFORE_STARTED, this))
      .then(
        () =>
          new Promise(resolve => {
            this.app.listen({ port: this.config.port }, () => {
              Logger.info(`🚀 Server ready at http://localhost:${this.config.port}`);
              Logger.info(
                `🌍 GraphQL endpoint ready at http://localhost:${this.config.port}${this.server.graphqlPath}`
              );
              resolve();
            });
          }, handleStartupError)
      )
      .then(() => this.eventEmitter.emitAsync(Events.AFTER_STARTED, this))
      .catch(handleStartupError);
  }
}

module.exports = FalconServer;
module.exports.Events = Events;
module.exports.BaseSchema = BaseSchema;
