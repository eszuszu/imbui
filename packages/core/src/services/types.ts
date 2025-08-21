import type { Signal } from "@imbui/pulse";

export interface DataServiceInterface<T> {
  isLoading: Signal<boolean>;
  error: Signal<Error | null>;
  getSignal: (key: string) => Signal<T | null>; // method to get a signal for a specific key
  fetch: (key: string) => Promise<T | null>; //fetched data/cached data
  preload: (key: string) => void; //background fetching
  destroy?(): void;
}