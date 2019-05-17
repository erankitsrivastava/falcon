/* eslint-disable no-useless-constructor, no-dupe-class-members, no-empty-function */
import { KeyValueCache } from 'apollo-server-caching';

export type SetCacheOptions = {
  ttl?: number;
  tags?: string[];
};

export type ValueOptions = {
  tags?: TagMap;
};

export type TagMap = {
  [key: string]: string;
};

export type GetCacheFetchResult =
  | any
  | {
      value: any;
      options?: SetCacheOptions;
    };

export type GetCacheOptions = {
  fetchData: () => Promise<GetCacheFetchResult>;
  options?: SetCacheOptions;
};

/**
 * Cache-wrapper with extended methods
 */
export default class Cache<V = any> implements KeyValueCache<V> {
  constructor(private cacheProvider: KeyValueCache<V>) {}

  async get(key: string): Promise<V>;
  async get(key: string, setOptions: GetCacheOptions): Promise<V>;

  /**
   * Returns cached value for the provided key and setOptions object
   * @param {string} key Cache key
   * @param {GetCacheOptions} setOptions Object with params to fetch the data to be cached
   * @return {Promise<string|undefined>} Cached value
   */
  async get(key: string, setOptions?: GetCacheOptions): Promise<V> {
    let value: GetCacheFetchResult = await this.cacheProvider.get(key);
    // Validating by cache tags
    if (this.isValueWithOptions(value)) {
      const { tags: tagMap = {} } = value.options as ValueOptions;
      if (await this.isTagMapValid(tagMap as TagMap)) {
        ({ value } = value);
      } else {
        // If tags are invalid - set value as "not found"
        value = undefined;
        await this.delete(key);
      }
    }

    if (typeof value === 'undefined' && typeof setOptions === 'object') {
      const { fetchData } = setOptions;
      let { options } = setOptions;
      const cacheResult: GetCacheFetchResult = await fetchData();
      if (typeof cacheResult !== 'undefined') {
        if (this.isValueWithOptions(cacheResult)) {
          ({ value } = cacheResult);
          const { options: cacheResultOptions = {} } = cacheResult;
          // Merging cache options from the "fetchData" result and passed method argument
          options = Object.assign({}, options, cacheResultOptions);
        } else {
          value = cacheResult;
        }

        if (typeof value !== 'undefined') {
          await this.set(key, value, options as SetCacheOptions);
        }
      }
    }

    return value;
  }

  async set(key: string, value: V): Promise<void>;
  async set(key: string, value: V, options: SetCacheOptions): Promise<void>;
  async set(key: string, value: V, options?: SetCacheOptions): Promise<void> {
    let cachedValue: V | GetCacheFetchResult = value;
    const { tags } = options || ({} as SetCacheOptions);
    if (tags) {
      const tagValues = await this.getTagsByNames(tags, true);
      cachedValue = {
        value: cachedValue,
        options: {
          tags: tagValues
        }
      };
    }
    return this.cacheProvider.set(key, cachedValue, options);
  }

  async delete(key: string): Promise<boolean>;
  async delete(keys: string[]): Promise<void>;

  /**
   * Cache key or array of cache keys to be removed from the cache.
   * Can be used to invalidate cache by tags
   * @param {string|string[]} key One or more cache keys to be removed
   * @return {Promise<boolean|void>} Result
   */
  async delete(key: string | string[]): Promise<boolean | void> {
    if (Array.isArray(key)) {
      await Promise.all(key.map(kKey => this.delete(kKey)));
      return;
    }
    return this.cacheProvider.delete(key);
  }

  /**
   * Check provided key-value tag object with the tags from the cache backend
   * @param {TagMap} tagMap Key-value object (tags)
   * @return {Promise<boolean>} Result
   */
  private async isTagMapValid(tagMap: TagMap): Promise<boolean> {
    const tagNames: string[] = Object.keys(tagMap);
    if (!tagNames.length) {
      // No tags available - we have nothing to validate against to
      return true;
    }
    const storedTags = await this.getTagsByNames(tagNames);

    // Simple key count check
    if (tagNames.length !== Object.keys(storedTags).length) {
      return false;
    }

    // Pair checking
    return !tagNames.some(name => tagMap[name] !== storedTags[name]);
  }

  /**
   * Load tag values from the cache backend
   * @param {string[]} names List of tag names to be loaded from the Cache Backend
   * @param {boolean} [createIfMissing=false] Flag whether to create new values for missing tags
   * @return {Promise<TagMap>} Key-value object
   */
  private async getTagsByNames(names: string[], createIfMissing: boolean = false): Promise<TagMap> {
    const tagValues: TagMap = {};
    await Promise.all(
      names.map(async tag => {
        let tagValue: any = await this.get(tag);
        if (typeof tagValue === 'undefined' && createIfMissing) {
          // For "createIfMissing" flag - generate new tag value and save it to the cache
          tagValue = this.generateTagValue();
          await this.set(tag, tagValue);
        }

        if (tagValue) {
          tagValues[tag] = tagValue;
        }
      })
    );

    return tagValues;
  }

  /**
   * Check if the provided values contains cache "options" object
   * @param {any} data Data to be checked
   * @return {boolean} Result of check
   */
  private isValueWithOptions(data: any): boolean {
    return typeof data === 'object' && data.value && data.options;
  }

  /**
   * Generating a short and safe enough tag value (second + ms = will ensure a unique value for the same tag name)
   * @return {string} Tag value
   */
  private generateTagValue(): string {
    const date: Date = new Date();
    return `${Date.now()
      .toString()
      .substr(6)}`;
  }
}
