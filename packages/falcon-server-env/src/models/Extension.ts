import { GraphQLResolveInfo, GraphQLSchema, GraphQLObjectType } from 'graphql';
import { makeExecutableSchema } from 'graphql-tools';
import { EventEmitter2 } from 'eventemitter2';
import * as Logger from '@deity/falcon-logger';
import ApiDataSource from './ApiDataSource';
import {
  ApiUrlPriority,
  ConfigurableConstructorParams,
  ExtensionContainer,
  FetchUrlParams,
  FetchUrlResult,
  GraphQLContext
} from '../types';

export type ConfigurableContainerConstructorParams = ConfigurableConstructorParams & {
  extensionContainer: ExtensionContainer;
};

export type GraphQLConfig = {
  schema: Array<string>;
  resolvers: GraphQLResolverMap;
};

export interface ExtensionConfig {
  api?: string;
}

export interface RootFieldTypes {
  [name: string]: Array<string>;
}

export type GraphQLFieldResolver = (obj: any, args: any, context: GraphQLContext, info: GraphQLResolveInfo) => any;

export type GraphQLResolverMap = {
  [name: string]: {
    [name: string]: GraphQLFieldResolver;
  };
};

export default abstract class Extension {
  public config: ExtensionConfig;
  public name: string;
  public api?: ApiDataSource;

  protected extensionContainer: ExtensionContainer;
  protected eventEmitter: EventEmitter2;

  /**
   * @param {ConfigurableContainerConstructorParams} params Constructor params
   * @param {object} params.config Extension config object
   * @param {string} params.name Extension short-name
   * @param {ExtensionContainer} params.extensionContainer ExtensionContainer instance
   * @param {EventEmitter2} params.eventEmitter EventEmitter2 instance
   */
  constructor(params: ConfigurableContainerConstructorParams) {
    const { config = {}, name, extensionContainer, eventEmitter } = params;
    this.name = name || this.constructor.name;
    this.config = config as ExtensionConfig;
    this.extensionContainer = extensionContainer;
    this.eventEmitter = eventEmitter;
  }

  /**
   * GraphQL configuration getter
   * @param {string|Array<string>} typeDefs Extension's GQL schema type definitions
   * @return {object} GraphQL configuration object
   */
  async getGraphQLConfig(typeDefs: string | Array<string> = ''): Promise<GraphQLConfig> {
    if (!typeDefs) {
      Logger.warn(`${this.name}: typeDefs is empty! Make sure you call "super.getGraphQLConfig(typeDefs)" properly`);
    }
    const rootTypes: RootFieldTypes = this.getRootTypeFields(typeDefs);
    const resolvers: GraphQLResolverMap = {};

    Object.keys(rootTypes).forEach((typeName: string) => {
      resolvers[typeName] = {};
      rootTypes[typeName].forEach((fieldName: string) => {
        Logger.debug(
          `${this.name}: binding "${typeName}.${fieldName} => ${
            this.config.api
          }.${fieldName}(obj, args, context, info)" resolver`
        );
        resolvers[typeName][fieldName] = async (
          obj: any,
          args: any,
          context: GraphQLContext,
          info: GraphQLResolveInfo
        ) => {
          if (typeof (this.getApi(context) as any)[fieldName] !== 'function') {
            throw new Error(`${this.name}: ${this.config.api}.${fieldName}() resolver method is not defined!`);
          }
          return (this.getApi(context) as any)[fieldName](obj, args, context, info);
        };
      });
    });

    return {
      schema: Array.isArray(typeDefs) ? typeDefs : [typeDefs],
      resolvers
    };
  }

  /**
   * Gets API instance from DataSource by assigned API name
   * @param {GraphQLContext} context GraphQL Resolver context object
   * @return {ApiDataSource<GraphQLContext> | null} API DataSource instance if found
   */
  getApi(context: GraphQLContext): ApiDataSource<GraphQLContext> | null {
    const { dataSources } = context;
    return (this.config.api && dataSources[this.config.api]) || null;
  }

  /**
   * Returns a session object from the assigned API Provider
   * @param {GraphQLContext} context GraphQL Resolver context object
   * @return {object} Session object
   */
  getApiSession(context: GraphQLContext): any {
    return this.getApi(context)!.session;
  }

  /**
   * Should be implemented if extension wants to deliver content for dynamic urls. It should return priority value for passed url.
   * @param {GraphQLContext} context GraphQL Resolver context object
   * @param {string} path - url for which the priority should be returned
   * @return {number|null} Priority index or ApiUrlPriority.OFF (if "dynamic URL" is not supported)
   */
  getFetchUrlPriority(context: GraphQLContext, path: string): number | null {
    const apiDataSource: ApiDataSource<GraphQLContext> | null = this.getApi(context);
    return apiDataSource && apiDataSource.getFetchUrlPriority && apiDataSource.fetchUrl
      ? apiDataSource.getFetchUrlPriority(path)
      : ApiUrlPriority.OFF;
  }

  async fetchUrl(obj: object, args: FetchUrlParams, context: any, info: GraphQLResolveInfo): Promise<FetchUrlResult> {
    return this.getApi(context)!.fetchUrl!(obj, args, context, info);
  }

  fetchApiBackendConfig(
    obj: object,
    args: object,
    context: any,
    info: GraphQLResolveInfo
  ): Promise<object | undefined> {
    const apiDataSource: ApiDataSource<GraphQLContext> | null = this.getApi(context);

    return apiDataSource && apiDataSource.fetchBackendConfig
      ? apiDataSource.fetchBackendConfig(obj, args, context, info)
      : Promise.resolve(undefined);
  }

  /**
   * Returns a map of fields by GQL type name
   * @param {string|Array<string>} typeDefs Extension GQL schema type definitions
   * @return {RootFieldTypes} Map of GQL type-fields
   */
  protected getRootTypeFields(typeDefs: string | Array<string>): RootFieldTypes {
    const result: RootFieldTypes = {};
    if (!typeDefs) {
      return result;
    }
    try {
      const executableSchema: GraphQLSchema = makeExecutableSchema({
        typeDefs: [
          Array.isArray(typeDefs)
            ? typeDefs.join('\n')
            : typeDefs
                // Removing "extend type X" to avoid "X type missing" errors
                .replace(/extend\s+type/gm, 'type')
                // Removing directives
                .replace(/@(\w+)\(.*\)/gm, '')
                .replace(/@(\w+)/gm, '')
                // Removing type references from the base schema types
                .replace(/:\s*(\w+)/gm, ': Int')
                .replace(/\[\s*(\w+)\s*]/gm, '[Int]')
        ],
        resolverValidationOptions: {
          requireResolversForResolveType: false
        }
      });

      [executableSchema.getQueryType(), executableSchema.getMutationType()].forEach(
        (type: GraphQLObjectType | undefined | null) => {
          if (!type) {
            return;
          }
          const typeName: string = (type as GraphQLObjectType).name;
          Object.keys((type as GraphQLObjectType).getFields()).forEach((field: string) => {
            if (!(typeName in result)) {
              result[typeName] = [];
            }
            result[typeName].push(field as string);
          });
        }
      );
    } catch (error) {
      error.message = `${this.name}: Failed to get root type fields - ${error.message}`;
      throw error;
    }

    return result;
  }
}
