import type { DataServiceInterface, Signal, ConsoleLogger, NoOpLogger} from "@imbui/core";
import { signal, BaseService, createSWRFetcher } from "@imbui/core";
import { getPage } from "../utils/fetch";

export const DATA_SERVICE_KEY = Symbol('DataService');

export class DataService<T> extends BaseService implements DataServiceInterface<T> {
  prettyName: string;
  logger: InstanceType<typeof ConsoleLogger | typeof NoOpLogger>;
  isLoading: Signal<boolean> = signal(false);
  error: Signal<Error | null> = signal<Error | null>(null);

  private swrFetcher: ReturnType<typeof createSWRFetcher<T>>;

  constructor(logger: InstanceType<typeof ConsoleLogger | typeof NoOpLogger>){
    super();
    this.prettyName = `${[this.constructor.name]}: `
    this.logger = logger;

    this.swrFetcher = createSWRFetcher<T>({
      fetchFunction: getPage,
      staleTime: 5 * 60 * 1000,
      name: 'IntroData',
      logger: this.logger
    });

    this.isLoading = this.swrFetcher.isLoading;
    this.error = this.swrFetcher.error;
  }

  getSignal(id: string): Signal<T | null> {
    return this.swrFetcher.getSignal(id);
  }
  async fetch(id: string): Promise<T | null> {
    return await this.swrFetcher.fetch(id);
  }

  preload(id: string): void {
    this.swrFetcher.preload(id);
  }
  cleanup() {
    this.swrFetcher.destroy();
    this.logger.log(`${this.prettyName}disposed.`)
  }

}