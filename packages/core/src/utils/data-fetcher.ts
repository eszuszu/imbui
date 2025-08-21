import { signal } from "@imbui/pulse";
import type { Signal } from "@imbui/pulse";

// Stale While Revalidate fetcher

//Generic types for fetcher utility

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface SWRFetcherState<T> {
  isLoading: Signal<boolean>;
  error: Signal<Error | null>;
  getSignal: (key: string) => Signal<T | null>; // method to get a signal for a specific key
  fetch: (key: string) => Promise<T | null>; //fetched data/cached data
  preload: (key: string) => void; //background fetching
  destroy: () => void;
}

interface SWRFetcherOptions<T> {
  fetchFunction: (key: string) => Promise<T>;
  staleTime?: number; //how long data is considered fresh
  name?: string; //name for logging purposes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger?: any;
}

// Function to create a new fetcher instance, takes fetcher options, returns fetcher state
export function createSWRFetcher<T>(options: SWRFetcherOptions<T>): SWRFetcherState<T> {
  const { fetchFunction, staleTime = 5 * 60 * 1000, name = 'SWRFetcher', logger } = options;

  const cache = new Map<string, CacheEntry<T>>();
  // Map to hold a signal for each unique key
  const keyToSignalMap = new Map<string, Signal<T | null>>();

  const isLoadingSignal = signal(false);
  const errorSignal = signal<Error | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const log = (level: 'log' | 'error', ...args: any[]) => {
    if (logger) {
      logger[level](`[${name}]`, ...args);
    } else if (level === 'error') {
      console.error(`[${name}]`, ...args);
    } else {
      console.log(`[${name}]`, ...args);
    }
  };

  const getSignalForKey = (key: string): Signal<T | null> => {
    if (!keyToSignalMap.has(key)) {
      keyToSignalMap.set(key, signal<T | null>(null));
    }
    return keyToSignalMap.get(key)!;
  };

  const fetchAndCache = async (key: string): Promise<T | null> => {
    isLoadingSignal.set(true); // set loading for *this* fetch attempt
    errorSignal.set(null); // clear global error for this new operation

    const targetSignal = getSignalForKey(key); //get the signal with the passed key

    try {
      const freshData = await fetchFunction(key);
      cache.set(key, { data: freshData, timestamp: Date.now() });
      targetSignal.set(freshData); //Update primary signal for data
      log('log', `Successfully fetched and cached data for key: ${key}`);
      return freshData;
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error(String(err));
      errorSignal.set(fetchError); // Global error
      // If error, target signal remains stale or null
      log('error', `Error fetching data for key: ${key}`, fetchError);
      throw fetchError; //rethrow to propogate error
    } finally {
      isLoadingSignal.set(false);
    }
  };

  const fetcher: SWRFetcherState<T>['fetch'] = async (key: string): Promise<T | null> => {
    const cached = cache.get(key);
    let freshDataPromise: Promise<T | null> | null = null;
    const targetSignal = getSignalForKey(key); //Specific signal from passed key

    if (cached) {
      targetSignal.set(cached.data); //Display cached data right away, SWR
      log('log', `Cache hit for key: ${key}. Displaying stale data.`);

      const isStale = (Date.now() - cached.timestamp) > staleTime;
      if (!isStale) {
        log('log', `Cache for key ${key} is still fresh. No revalidation needed.`);
        return cached.data
      }

      log('log', ` Cache for key: ${key} is stale. Revalidating in background.`);
      freshDataPromise = fetchAndCache(key).catch(() => null); //don't block
    } else {
      log('log', `No cache for key: ${key}. Performing initial fetch.`);
      freshDataPromise = fetchAndCache(key);
    }

    // Await the fresh data -> only if initial fetch or ravalidation was triggered
    return freshDataPromise;
  };

  const preloadFetcher: SWRFetcherState<T>['preload'] = (key: string) => {
    if (!cache.has(key)) {
      log('log', `Preloading data for key: ${key}`);
      fetchAndCache(key).catch(() => {});  //Fire, forget
    } else {
      log('log', `Skipping preload, key ${key} already cached`);
    }
  };

  const destroyFetcher = () => {
    cache.clear();
    keyToSignalMap.clear();
    isLoadingSignal.set(false);
    errorSignal.set(null);
    log('log', `Fetcher instance destroyed. Cache and signals cleared.`);
  };

  return {
    getSignal: getSignalForKey,
    isLoading: isLoadingSignal,
    error: errorSignal,
    fetch: fetcher,
    preload: preloadFetcher,
    destroy: destroyFetcher
  };
}