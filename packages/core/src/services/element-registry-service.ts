import type { LoggerService } from "./logger-service";
import { BaseService } from "./base-service";

export class ElementRegistryService extends BaseService {
  private prettyName: string;
  windowRegistry: CustomElementRegistry = customElements;
  registry!: CustomElementRegistry;
  private definitions = new Map<string, CustomElementConstructor>();
  pendingDefinitions = new Map<string, Promise<CustomElementConstructor>>();
  private resolvers = new Map<string, (ctor: CustomElementConstructor) => void>();
  private logger: LoggerService = console as unknown as LoggerService;

  constructor(logger: LoggerService, registry?: CustomElementRegistry) {
    super();
    this.prettyName = `[${this.constructor.name}]:`
    this.logger = logger;
    this.registry = registry ?? this.windowRegistry;
  }

  async defineMany(defs: { tag: string, ctor: CustomElementConstructor }[], signal?: AbortSignal): Promise<void> {
    const promises = defs.map(def => this.define(def.tag, def.ctor, signal));
    await Promise.all(promises);
  }

  async sequenceDefinitions(
    defs: { tag: string, ctor: CustomElementConstructor }[],
    callback?: () => Promise<void>,
    signal?: AbortSignal
  ): Promise<void> {
    for (const { tag, ctor } of defs) {
      await this.define(tag, ctor, signal);
      await callback?.();
    }
  }

  async define(tagName: string, constructor: CustomElementConstructor, signal?: AbortSignal): Promise<void> {
    const mergedSignal = AbortSignal.any(
      [signal, this.abortController.signal].filter(Boolean) as AbortSignal[]
    );
    this.checkAbort(mergedSignal);

    if (signal) {
      signal.addEventListener("abort", () => {
        this.pendingDefinitions.delete(tagName);
        this.logger.debug(`${this.prettyName} Pending definition for ${tagName} aborted and removed.`);
      }, { once: true });
    }

    if (this.registry.get(tagName)) {
      this.definitions.set(tagName, this.registry.get(tagName)!); // cache defensively;
      this.logger.debug(`${this.prettyName}Custom element ${tagName} already defined by native registry.`)
      return Promise.resolve();
    }

    if (!this.pendingDefinitions.has(tagName)) {
      const promise = new Promise<CustomElementConstructor>(resolve => {
        this.resolvers.set(tagName, resolve);

      });
      this.pendingDefinitions.set(tagName, promise);
    }

    try {
      this.registry.define(tagName, constructor);

      
      const resolve = this.resolvers.get(tagName);
      if (resolve) {
        resolve(constructor);
        this.resolvers.delete(tagName);
      }
      
      this.definitions.set(tagName, constructor);
      this.pendingDefinitions.delete(tagName);
    } catch (error) {
      this.logger.error(`Failed to define custom element ${tagName}:`, error);
      this.pendingDefinitions.delete(tagName); //Clean up if definition fails
      throw error;
    }
  }


  async awaitUndefinedChildren(host: HTMLElement | DocumentFragment | ShadowRoot | Document, signal?: AbortSignal): Promise<CustomElementConstructor[] | DOMException> {
    const mergedSignal = AbortSignal.any(
      [signal, this.abortController.signal].filter(Boolean) as AbortSignal[]
    );
    this.checkAbort(mergedSignal);

    const undefinedElements = host.querySelectorAll(":not(:defined)");   // Saw this on MDN shoutout~
    const tags = new Set(
      [...undefinedElements].map((child) => child.localName)
    );
    const promises = [...tags].map((tag) => this.whenDefined(tag, mergedSignal));
    return Promise.all(promises);
  }

  async whenDefined(tagName: string, signal?: AbortSignal): Promise<CustomElementConstructor> {

    const mergedSignal = AbortSignal.any(
      [signal, this.abortController.signal].filter(Boolean) as AbortSignal[]
    );
    this.checkAbort(mergedSignal);
    if (this.definitions.has(tagName)) {
      return this.definitions.get(tagName)!; //cached constructor
    }

    if (this.pendingDefinitions.has(tagName)) {
      this.logger.debug(`${this.prettyName} Returning pending definition promise for ${tagName}.`);
      return this.pendingDefinitions.get(tagName)!;
    }

    const promise = new Promise<CustomElementConstructor>(resolve => {
      this.resolvers.set(tagName, resolve)
    })
    this.pendingDefinitions.set(tagName, promise);
    this.logger.debug(`${this.prettyName} Waiting for ${tagName} via deferred promise.`);
    return promise
  }

  isDefined(tagName: string): boolean {
    return this.definitions.has(tagName) || this.registry.get(tagName) !== undefined;
  }

  isPending(tagName: string): boolean {
    return this.pendingDefinitions.has(tagName);
  }

  getConstructor(tagName: string): CustomElementConstructor | undefined {
    return this.definitions.get(tagName) || this.registry.get(tagName);
  }

  listDefinitions() { return [...this.definitions.keys()]; }

  listPending() { return [...this.pendingDefinitions.keys()]; }

  getSnapshot(): void {
    // think of returning actual snapshot not just strings.
    const output = (name: string,
      defs: string[],
    ) => `${name} ${defs} ${this.listPending()}`;

    console.log(output(this.prettyName, this.listDefinitions()));
  }
  // this will wipe the current element registry service cache (dumb) but can't wipe the window registry.
  // it ataches a passed instance of a new, different, or mocked registry.
  reset(newRegistry?: CustomElementRegistry) {
    this.definitions.clear();
    this.pendingDefinitions.clear();
    if (newRegistry) this.registry = newRegistry;
  }

  cleanup() {
    this.definitions.clear();
    this.pendingDefinitions.clear();
    this.logger = console as unknown as LoggerService;
    this.registry = this.windowRegistry;
  }
}
