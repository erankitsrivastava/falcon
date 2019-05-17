// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-extended';
import { GraphQLResolveInfo } from 'graphql';
import Extension from './Extension';
import ApiDataSource from './ApiDataSource';
import { FetchUrlResult } from '../types';

class CustomExtension extends Extension {
  getFetchUrlPriority(url: string): number {
    return 0;
  }

  async fetchUrl(obj: object, args: any, context: any, info: GraphQLResolveInfo): Promise<FetchUrlResult> {
    return Promise.resolve({ id: 1, type: 'post', path: 'foo' });
  }
}

class CustomApiDataSource extends ApiDataSource {}

describe('Extension', () => {
  let ext: CustomExtension;

  beforeEach(() => {
    ext = new CustomExtension({
      config: {},
      extensionContainer: {}
    });
  });

  it('Should create an instance of Extension', async () => {
    expect(ext.config).toEqual({});
    expect(ext.name).toBe('CustomExtension');
  });

  it('Should properly bind GQL types to the API Provider instance', async () => {
    const typeDefs = `
    extend type Query {
      foo: Number
      missingResolver: Int
    }
    extend type Mutation {
      bar: Number
    }
    `;
    ext.config.api = 'api';

    const { resolvers } = await ext.getGraphQLConfig(typeDefs);
    expect(Object.keys(resolvers)).toEqual(['Query', 'Mutation']);
    expect(Object.keys(resolvers.Query)).toEqual(['foo', 'missingResolver']);
    expect(Object.keys(resolvers.Mutation)).toEqual(['bar']);

    const api: CustomApiDataSource = new CustomApiDataSource({});
    api.foo = jest.fn(() => 'foo');
    api.bar = jest.fn(() => 'bar');
    api.initialize({ context: {} });
    const context = {
      dataSources: {
        api
      }
    };

    const resultFoo: string = await resolvers.Query.foo({}, {}, context);
    expect(resultFoo).toBe('foo');
    const resultBar: string = await resolvers.Mutation.bar({}, {}, context);
    expect(resultBar).toBe('bar');

    try {
      await resolvers.Query.missingResolver({}, {}, context);
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.message).toBe('CustomExtension: api.missingResolver() resolver method is not defined!');
    }
  });

  it('Should not fail if "typeDefs" won\'t be passed to getGraphQLConfig() method', async () => {
    const gqlConfig = await ext.getGraphQLConfig();
    expect(gqlConfig.resolvers).toBeEmpty();
  });
});
