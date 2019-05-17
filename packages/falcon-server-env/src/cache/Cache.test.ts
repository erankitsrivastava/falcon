import { KeyValueCache } from 'apollo-server-caching';
import Cache from './Cache';

describe('Cache', () => {
  let provider: KeyValueCache;
  let cache: Cache;

  beforeEach(() => {
    provider = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn()
    } as KeyValueCache;
    cache = new Cache(provider);
  });

  it('Should properly pass arguments to "set" method', async () => {
    await cache.set('key', 'value');
    expect(provider.set).toBeCalledWith('key', 'value', undefined);
    (provider.set as jest.Mock).mockClear();

    await cache.set('key', 'value', { ttl: 1 });
    expect(provider.set).toBeCalledWith('key', 'value', { ttl: 1 });
  });

  it('Should properly pass key to "delete" method', async () => {
    await cache.delete('foo');
    expect(provider.delete).toBeCalledWith('foo');
  });

  it('Should properly pass a string key to "get" method', async () => {
    const value: string | undefined = await cache.get('key');
    expect(provider.get).toBeCalledWith('key');
  });

  it('Should properly handle a fetchData option to fill the cache for "get" method', async () => {
    provider.get = jest.fn(() => undefined);
    const value: string | undefined = await cache.get('key', {
      fetchData: () => Promise.resolve('new_value'),
      options: {
        ttl: 1
      }
    });

    expect(provider.get).toBeCalledWith('key');
    expect(provider.set).toBeCalledWith('key', 'new_value', { ttl: 1 });
  });

  it('Should be able to define TTL dynamically from fetchData for "get" method', async () => {
    provider.get = jest.fn(() => undefined);
    const value: string | undefined = await cache.get('key', {
      fetchData: () =>
        Promise.resolve({
          value: 'value',
          options: {
            ttl: 10
          }
        })
    });

    expect(provider.get).toBeCalledWith('key');
    expect(provider.set).toBeCalledWith('key', 'value', { ttl: 10 });
  });

  describe('Tags', () => {
    it('Should validate tags from the stored value', async () => {
      provider.get = jest.fn(async key => {
        switch (key) {
          case 'foo':
            return Promise.resolve({
              value: 1,
              options: {
                tags: {
                  bar: 1
                }
              }
            });
          case 'foo2':
            return Promise.resolve({
              value: 1,
              options: {}
            });
          case 'bar':
            return Promise.resolve(1);
          default:
            return Promise.resolve(undefined);
        }
      });

      const value = await cache.get('foo');
      expect(value).toEqual(1);
      const value2 = await cache.get('foo2');
      expect(value2).toEqual(1);
    });

    it('Should not return a value if tag is invalid', async () => {
      provider.get = jest.fn(async key => {
        switch (key) {
          case 'foo':
            return Promise.resolve({
              value: 1,
              options: {
                tags: {
                  bar: 1
                }
              }
            });
          case 'foo2':
            return Promise.resolve({
              value: 1,
              options: {
                tags: {
                  bar: 1,
                  bar2: 2
                }
              }
            });
          case 'bar':
            return Promise.resolve(2);
          default:
            return Promise.resolve(undefined);
        }
      });

      const value = await cache.get('foo');
      expect(value).toEqual(undefined);
      const value2 = await cache.get('foo2');
      expect(value2).toEqual(undefined);
    });

    it('Should add tag entries on adding a tagged value', async () => {
      const spySet = jest.spyOn(provider, 'set');
      await cache.set('foo', { bar: 1 }, { tags: ['tag1'] });

      expect(spySet).toHaveBeenCalledTimes(2);
    });
  });
});
