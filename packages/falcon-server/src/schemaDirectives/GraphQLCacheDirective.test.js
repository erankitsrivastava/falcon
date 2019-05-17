const { Cache, InMemoryLRUCache } = require('@deity/falcon-server-env');
const { graphql } = require('graphql');
const { makeExecutableSchema, addResolveFunctionsToSchema } = require('graphql-tools');
const GraphQLCacheDirective = require('./GraphQLCacheDirective');

const directiveDefinition = `directive @cache(ttl: Int, idPath: [String]) on FIELD_DEFINITION`;

const config = {
  cache: {
    resolvers: {
      enabled: true
    }
  }
};

const runQuery = async (schema, query, context) =>
  graphql({
    schema,
    source: query,
    contextValue: context
  });

const buildSchema = (typeDefs, resolvers) =>
  makeExecutableSchema({
    typeDefs,
    resolvers,
    schemaDirectives: {
      cache: GraphQLCacheDirective
    }
  });

const run = async (typeDefs, resolvers, query, context) => runQuery(buildSchema(typeDefs, resolvers), query, context);

describe('@cache directive', () => {
  let cacheProvider;
  let cache;

  beforeEach(() => {
    cacheProvider = new InMemoryLRUCache();
    cache = new Cache(cacheProvider);
  });

  it('Should properly resolve value and return a cached value for further calls', async () => {
    let callCount = 0;
    const typeDefs = `
      ${directiveDefinition}
      type Query {
        foo: Foo @cache
      }
      type Foo {
        name: String
      }
    `;

    const resolvers = {
      Query: {
        foo: () => {
          callCount++;
          return {
            name: 'foo'
          };
        }
      }
    };
    const query = `query { foo { name } }`;
    const expected = { foo: { name: 'foo' } };

    const { data } = await run(typeDefs, resolvers, query, { cache, config });
    expect(data).toEqual(expected);
    const { data: data2 } = await run(typeDefs, resolvers, query, { cache, config });
    expect(callCount).toBe(1);
    expect(data2).toEqual(expected);
  });

  it('Should throw an error while trying to cache a scalar type', async () => {
    const typeDefs = `
      ${directiveDefinition}
      type Query {
        foo: String @cache
      }
    `;

    const query = `query { foo }`;
    const { data, errors } = await run(typeDefs, {}, query, { cache, config });
    expect(data).toEqual({ foo: null });
    expect(errors[0].message).toBe('Caching for "String" scalar type is not supported yet');
  });

  it('Should be able to handle dynamically added resolvers', async () => {
    const typeDefs = `
      ${directiveDefinition}
      type Query {
        foo: Foo @cache
      }
      type Foo {
        name: String
      }
    `;
    const resolvers = {
      Query: {
        foo: () => ({
          name: 'foo'
        })
      }
    };
    const schema = buildSchema(typeDefs, resolvers);
    addResolveFunctionsToSchema({
      schema,
      resolvers: {
        Query: {
          foo: () => ({
            name: 'bar'
          })
        }
      }
    });

    const query = `query { foo { name } }`;

    const { data } = await runQuery(schema, query, { cache, config });
    expect(data).toEqual({ foo: { name: 'bar' } });
  });

  it('Should handle falsy and disabled cache properly', async () => {
    const cacheSetSpy = jest.spyOn(cache, 'set');
    const typeDefs = `
      ${directiveDefinition}
      type Query {
        foo: Foo @cache
      }
      type Foo {
        id: ID!
        name: String
      }
    `;
    const typeDefsNonCached = `
      ${directiveDefinition}
      type Query {
        foo: Foo @cache(ttl: 0)
      }
      type Foo {
        id: ID!
        name: String
      }
    `;
    const resolvers = {
      Query: {
        foo: () => ({
          id: '1',
          name: 'foo2'
        })
      }
    };
    const query = `query {
      foo {
        id
        name
      }
    }`;
    const expected = {
      foo: {
        id: '1',
        name: 'foo2'
      }
    };

    const { data } = await run(typeDefsNonCached, resolvers, query, { cache, config });
    expect(data).toEqual(expected);
    expect(cacheSetSpy).not.toHaveBeenCalled();
    const { data: data2 } = await run(typeDefs, resolvers, query, { cache });
    expect(data2).toEqual(expected);
    expect(cacheSetSpy).not.toHaveBeenCalled();
  });

  describe('cache by tags', () => {
    it('Should properly extract tags for object type', async () => {
      const cacheSetSpy = jest.spyOn(cache, 'set');
      const typeDefs = `
        ${directiveDefinition}
        type Query {
          foo: Foo @cache
        }
        type Foo {
          id: ID!
          name: String
        }
      `;

      const resolvers = {
        Query: {
          foo: () => ({
            id: 1,
            name: 'foo'
          })
        }
      };
      const query = `query { foo { id name } }`;
      const expected = { foo: { id: '1', name: 'foo' } };

      const { data } = await run(typeDefs, resolvers, query, { cache, config });
      expect(data).toEqual(expected);
      expect(cacheSetSpy).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
        tags: ['Foo', 'Foo:1'],
        ttl: 600
      });
    });

    it('Should be able to extract tags from a preprocessed value (for Cache component)', async () => {
      const cacheSetSpy = jest.spyOn(cache, 'set');
      const customTtl = 100;
      const typeDefs = `
        ${directiveDefinition}
        type Query {
          foo: Foo @cache
        }
        type Foo {
          id: ID!
          name: String
        }
      `;
      const resolvers = {
        Query: {
          foo: () => ({
            value: {
              id: '1',
              name: 'foo'
            },
            options: {
              ttl: customTtl
            }
          })
        }
      };
      const query = `query {
        foo {
          id
          name
        }
      }`;
      const expected = {
        foo: {
          id: '1',
          name: 'foo'
        }
      };

      const { data } = await run(typeDefs, resolvers, query, { cache, config });
      expect(data).toEqual(expected);
      expect(cacheSetSpy).toHaveBeenCalledWith(expect.anything(), expected.foo, {
        tags: ['Foo', 'Foo:1'],
        ttl: customTtl
      });
    });

    it('Should be able to extract tags for the nested item list', async () => {
      const cacheSetSpy = jest.spyOn(cache, 'set');
      const typeDefs = `
        ${directiveDefinition}
        type Query {
          foo: Foo
        }
        type Foo {
          id: ID!
          name: String
          list: [Bar]! @cache(ttl: 1, idPath: ["$parent"])
          barList: BarList @cache(ttl: 1, idPath: ["$parent", "items"])
        }
        type Bar {
          id: ID!
          name: String
        }
        type BarList {
          items: [Bar]
        }
      `;

      const barList = [
        {
          id: '1',
          name: 'bar1'
        },
        {
          id: '2',
          name: 'bar2'
        }
      ];
      const resolvers = {
        Query: {
          foo: () => ({
            id: 1,
            name: 'foo',
            list: barList,
            barList: {
              items: barList
            }
          })
        }
      };
      const query = `query {
        foo {
          id
          name
          list {
            id
            name
          }
          barList {
            items {
              id
              name
            }
          }
        }
      }`;
      const expected = {
        foo: {
          id: '1',
          name: 'foo',
          list: barList,
          barList: {
            items: barList
          }
        }
      };

      const { data } = await run(typeDefs, resolvers, query, { cache, config });
      expect(data).toEqual(expected);
      expect(cacheSetSpy).toHaveBeenCalledWith(
        expect.anything(),
        { items: barList },
        {
          tags: ['BarList', 'Foo:1', 'Bar', 'Bar:1', 'Bar:2'],
          ttl: 60
        }
      );
      expect(cacheSetSpy).toHaveBeenCalledWith(expect.anything(), barList, {
        tags: ['Bar', 'Bar:1', 'Bar:2', 'Foo:1'],
        ttl: 60
      });
    });
  });
});
