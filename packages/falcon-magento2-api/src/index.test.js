global.__SERVER__ = true; // eslint-disable-line no-underscore-dangle

const { Cache, InMemoryLRUCache } = require('@deity/falcon-server-env');
const { codes } = require('@deity/falcon-errors');
const { BaseSchema } = require('@deity/falcon-server');
const { Schema } = require('@deity/falcon-shop-extension');
const { makeExecutableSchema } = require('graphql-tools');
const { EventEmitter2 } = require('eventemitter2');
const nock = require('nock');
const Magento2Api = require('./index');
const magentoResponses = require('./__mocks__/apiResponses');

const URL = 'http://example.com';
const ee = new EventEmitter2();
const apiConfig = {
  config: {
    host: 'example.com',
    protocol: 'http'
  },
  name: 'api-magento2',
  eventEmitter: ee,
  gqlServerConfig: {
    schema: makeExecutableSchema({
      typeDefs: [BaseSchema, Schema],
      resolvers: {
        PlaceOrderResult: {
          // passing empty type resolver to avoid warnings on the console
          __resolveType: () => ''
        }
      }
    })
  }
};
const createMagentoUrl = path => `/rest/default/V1${path}`;

describe('Magento2Api', () => {
  let api;
  let cache;

  beforeEach(() => {
    cache = new Cache(new InMemoryLRUCache());
    api = new Magento2Api(apiConfig);
    api.initialize({ context: {}, cache });
  });

  beforeAll(async () => {
    nock(URL)
      .persist(true)
      .post(createMagentoUrl('/integration/admin/token'))
      .reply(200, magentoResponses.adminToken);

    nock(URL)
      .persist(true)
      .get(createMagentoUrl('/store/storeConfigs'))
      .reply(200, [
        {
          locale: 'en-US',
          extension_attributes: {},
          code: 'default'
        }
      ]);

    nock(URL)
      .persist(true)
      .get(createMagentoUrl('/store/storeViews'))
      .reply(200, [
        {
          website_id: 1,
          code: 'default',
          store_group_id: 'bar',
          extension_attributes: {
            is_active: true
          }
        }
      ]);

    nock(URL)
      .persist(true)
      .get(createMagentoUrl('/store/storeGroups'))
      .reply(200, [
        {
          id: 'bar',
          website_id: 'oof'
        }
      ]);

    nock(URL)
      .persist(true)
      .get(createMagentoUrl('/store/websites'))
      .reply(200, [
        {
          id: 'oof'
        }
      ]);
  });

  afterAll(() => {
    nock.restore();
  });

  it('Should correctly fetch admin token', async () => {
    const result = await api.getAdminToken();
    expect(result).toEqual(magentoResponses.adminToken);
  });

  it('Should correctly fetch category data', async () => {
    nock(URL)
      .get(uri => /\/categories\/20/.test(uri)) // regexp as query params might be there
      .reply(200, magentoResponses.category.data);

    api.session.storeCode = '';
    const result = await api.category({}, { id: 20 });
    expect(result.id).toEqual(magentoResponses.category.data.id);
  });

  it('Should correctly handle request error without token', async () => {
    nock(URL)
      .get(uri => uri.indexOf(createMagentoUrl('/products') > 0))
      .reply(401, {
        message: 'Consumer is not authorized to access %resources',
        parameters: {
          resources: 'Magento_Catalog::categories'
        }
      });

    try {
      await api.products({}, {});
    } catch (error) {
      expect(error.extensions.code).toBe(codes.UNAUTHENTICATED);
      expect(error.message).toBe('Consumer is not authorized to access Magento_Catalog::categories');
      expect(error.extensions.response.status).toBe(401);
    }
  });

  it('Should correctly convert paths returned by Magento2 to urls', () => {
    expect(api.convertPathToUrl('test')).toBe('/test.html');
    // null should not not be converted
    expect(api.convertPathToUrl(null)).toBe(null);
  });

  it('Should not call signIn() after account creation if autoSignIn flag was set to false', async () => {
    // mock signIn resolver - just return promise that resolves to true
    api.signIn = jest.fn(() => Promise.resolve(true));

    nock(URL)
      .post(createMagentoUrl('/customers'))
      .reply(200, magentoResponses.user.signUpSuccess);

    nock(URL)
      .post(createMagentoUrl('/guest-carts'))
      .reply(200, {});

    const resp = await api.signUp(
      {},
      {
        input: { firstname: 'Test', lastname: 'Test', email: 'test@test.com', password: 'Deity123', autoSignIn: false }
      }
    );

    expect(api.signIn).toHaveBeenCalledTimes(0);
    expect(resp).toBe(true);
  });

  it('Should call signIn() with proper params after successful account creation (if autoSignIn flag was set to true)', async () => {
    // mock signIn resolver - just return promise that resolves to true
    api.signIn = jest.fn(() => Promise.resolve(true));

    nock(URL)
      .post(createMagentoUrl('/customers'))
      .reply(200, magentoResponses.user.signUpSuccess);

    nock(URL)
      .post(createMagentoUrl('/guest-carts'))
      .reply(200, {});

    const resp = await api.signUp(
      {},
      { input: { firstname: 'Test', lastname: 'Test', email: 'test@test.com', password: 'Deity123', autoSignIn: true } }
    );

    expect(api.signIn).toHaveBeenCalledTimes(1);
    expect(api.signIn).toHaveBeenCalledWith({}, { input: { email: 'test@test.com', password: 'Deity123' } });
    expect(resp).toBe(true);
  });

  describe('createSearchParams()', () => {
    it('Should properly create payload for magento', () => {
      const input = {
        filters: [
          {
            conditionType: 'eq',
            field: 'price',
            value: '10'
          }
        ],
        sort: {
          field: 'price',
          direction: 'asc'
        },
        pagination: {
          perPage: 10,
          page: 2
        }
      };
      const expectedOutput = {
        searchCriteria: {
          pageSize: 10,
          currentPage: 2,
          sortOrders: [{ field: 'price', direction: 'asc' }],
          filterGroups: [
            {
              filters: [
                {
                  condition_type: 'eq',
                  field: 'price',
                  value: '10'
                }
              ]
            }
          ]
        }
      };
      expect(api.createSearchParams(input)).toEqual(expectedOutput);
    });

    it('Should properly handle case when there is no pagination parameter passed', () => {
      const input = {
        sort: {
          field: 'price',
          direction: 'asc'
        }
      };
      const expectedOutput = {
        searchCriteria: {
          pageSize: api.perPage,
          currentPage: 0,
          sortOrders: [{ field: 'price', direction: 'asc' }]
        }
      };
      expect(api.createSearchParams(input)).toEqual(expectedOutput);
    });
  });

  it('breadcrumbs resolver should call proper endpoint with proper url without leading slash', async () => {
    nock(URL)
      .get(createMagentoUrl('/falcon/breadcrumbs?url=sample-product.html'))
      .reply(200, []);

    const resp = await api.breadcrumbs({}, { path: '/sample-product.html' });

    expect(resp).toEqual([]);
  });

  it('categoryProducts() should correctly fetch category products', async () => {
    nock(URL)
      .get(createMagentoUrl('/falcon/categories/1/products'))
      .query(() => true)
      .reply(200, magentoResponses.categoryProducts);

    const response = await api.categoryProducts({ id: 1 }, {});

    expect(response.items).toHaveLength(5);
    expect(response.aggregations).toHaveLength(3);
    expect(response.pagination).toBeObject; // eslint-disable-line
  });

  it('categoryProducts() should always return pagination data', async () => {
    nock(URL)
      .persist(true)
      .get(createMagentoUrl('/falcon/categories/1/products'))
      .query(() => true)
      .reply(200, magentoResponses.categoryProducts);

    // this is usually passed via config but api instance is already created
    // and we just want it to use a different value
    api.perPage = 3;
    let response = await api.categoryProducts({ id: 1 }, {});
    expect(response.pagination.totalPages).toEqual(4);

    // check if pagination will be computed correctly when perPage in config changes
    api.perPage = 5;
    response = await api.categoryProducts({ id: 1 }, {});
    expect(response.pagination.totalPages).toEqual(3);
  });

  it('processAggregations() should properly parse aggregations data from Magento', () => {
    const expectedOutput = [
      {
        field: 'price',
        title: 'Price',
        buckets: [
          {
            title: '$10.00 - $19.99',
            value: '10-20',
            count: 3
          },
          {
            title: '$20.00 - $29.99',
            value: '20-30',
            count: 8
          }
        ]
      },
      {
        field: 'color',
        title: 'Color',
        buckets: [
          {
            title: 'Black',
            value: '49',
            count: 1
          },
          {
            title: 'Blue',
            value: '50',
            count: 6
          },
          {
            title: 'Gray',
            value: '52',
            count: 3
          }
        ]
      },
      {
        field: 'material',
        title: 'Material',
        buckets: [
          {
            title: 'Cotton',
            value: '33',
            count: 1
          },
          {
            title: 'Polyester',
            value: '38',
            count: 10
          },
          {
            title: 'Organic Cotton',
            value: '154',
            count: 6
          }
        ]
      }
    ];

    expect(api.processAggregations(magentoResponses.categoryProducts.filters)).toEqual(expectedOutput);
  });

  it('categoryChildren() should fetch category data for each children of the passed category', async () => {
    // magento sends children as array joined with comma
    const category = { children: '12,13' };
    nock(URL)
      .get(createMagentoUrl('/categories/12'))
      .reply(200, {
        id: 12
      });

    nock(URL)
      .get(createMagentoUrl('/categories/13'))
      .reply(200, {
        id: 13
      });

    const result = await api.categoryChildren(category);
    // compare only ids - these should be the same
    expect(result.map(item => ({ id: item.id }))).toEqual([{ id: 12 }, { id: 13 }]);
  });

  describe('fetchUrl()', () => {
    it('Should call /urls endpoint with proper params', async () => {
      nock(URL)
        .get(createMagentoUrl('/falcon/urls/?url=test.html'))
        .reply(200, {
          entity_type: 'PRODUCT',
          entity_id: 1,
          canonical_url: '/test.html'
        });

      const response = await api.fetchUrl({}, { path: 'test.html' });

      expect(response.id).toEqual(1);
    });

    it('Should correctly parse entity types', async () => {
      nock(URL)
        .get(createMagentoUrl('/falcon/urls/?url=test-product.html'))
        .reply(200, {
          entity_type: 'PRODUCT',
          entity_id: 1,
          canonical_url: '/test-product.html'
        });

      nock(URL)
        .get(createMagentoUrl('/falcon/urls/?url=test-category.html'))
        .reply(200, {
          entity_type: 'CATEGORY',
          entity_id: 2,
          canonical_url: '/test-category.html'
        });

      nock(URL)
        .get(createMagentoUrl('/falcon/urls/?url=test-page.html'))
        .reply(200, {
          entity_type: 'CMS-PAGE',
          entity_id: 3,
          canonical_url: '/test-page.html'
        });

      const [product, category, page] = await Promise.all([
        api.fetchUrl({}, { path: 'test-product.html' }),
        api.fetchUrl({}, { path: 'test-category.html' }),
        api.fetchUrl({}, { path: 'test-page.html' })
      ]);

      expect(product.type).toEqual('shop-product');
      expect(category.type).toEqual('shop-category');
      expect(page.type).toEqual('shop-page');
    });
  });

  describe('filters', () => {
    const applyFilter = (value, operator) => api.addSearchFilter({}, 'field', value, operator);

    // eslint-disable-next-line
    const magentoFilter = (value, condition_type) => ({
      condition_type,
      value,
      field: 'field'
    });

    it('should correctly format "eq" filter with one item in value array', () => {
      expect(applyFilter(['10'], 'eq').filterGroups[0].filters).toEqual([magentoFilter('10', 'eq')]);
    });

    it('should correctly format "eq" filter with multiple items in value array', () => {
      expect(applyFilter(['10', '20'], 'eq').filterGroups[0].filters).toEqual([
        magentoFilter('10', 'eq'),
        magentoFilter('20', 'eq')
      ]);
    });

    it('should correctly format "neq" filter with one item in value array', () => {
      expect(applyFilter(['10'], 'neq').filterGroups[0].filters).toEqual([magentoFilter('10', 'neq')]);
    });

    it('should correctly format "neq" filter with multiple items in value array', () => {
      expect(applyFilter(['10', '20'], 'neq').filterGroups).toEqual([
        {
          filters: [magentoFilter('10', 'neq')]
        },
        {
          filters: [magentoFilter('20', 'neq')]
        }
      ]);
    });

    it('should correctly format "lt" filter', () => {
      expect(applyFilter(['10'], 'lt').filterGroups[0].filters).toEqual([magentoFilter('10', 'lt')]);
    });

    it('should correctly format "gt" filter', () => {
      expect(applyFilter(['10'], 'gt').filterGroups[0].filters).toEqual([magentoFilter('10', 'gt')]);
    });

    it('should correctly format "lte" filter', () => {
      expect(applyFilter(['10'], 'lte').filterGroups[0].filters).toEqual([magentoFilter('10', 'lteq')]);
    });

    it('should correctly format "gte" filter', () => {
      expect(applyFilter(['10'], 'gte').filterGroups[0].filters).toEqual([magentoFilter('10', 'gteq')]);
    });

    it('should correctly format "in" filter', () => {
      expect(applyFilter(['10', '20', '30'], 'in').filterGroups[0].filters).toEqual([magentoFilter('10,20,30', 'in')]);
    });

    it('should correctly format "nin" filter', () => {
      expect(applyFilter(['10', '20', '30'], 'nin').filterGroups[0].filters).toEqual([
        magentoFilter('10,20,30', 'nin')
      ]);
    });
  });
});
