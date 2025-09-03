import type { LoggerService } from "./logger-service";
import { BaseService } from "./base-service";
import { withDisposer } from "../utils/with-disposer";

export class ElementRegistryService extends BaseService {
  private prettyName: string;
  windowRegistry: CustomElementRegistry = customElements;
  registry!: CustomElementRegistry;
  private definitions = new Map<string, CustomElementConstructor>();
  private pendingDefinitions = new Map<string, Promise<CustomElementConstructor>>();
  private logger: LoggerService = console as unknown as LoggerService;

  constructor(logger: LoggerService, registry?: CustomElementRegistry) {
    super();
    this.prettyName = `[${this.constructor.name}]:`
    this.logger = logger;
    this.registry = registry ?? this.windowRegistry;
  }

  async defineMany(defs: { tag: string, ctor: CustomElementConstructor }[], signal?: AbortSignal): Promise<AsyncDisposableStack | void> {
    const mergedSignal = AbortSignal.any(
      [signal, this.abortController.signal].filter(Boolean) as AbortSignal[]
    );
    this.checkAbort(mergedSignal);

    // if AsyncDisposableStack is available use it -> progressive enhancement.
    // return withDisposer(async (stack) => {
    //   for (const { tag, ctor } of defs) {
    //     stack.defer((): void => { this.pendingDefinitions.delete(tag); return });
    //     await this.define(tag, ctor, signal);
    //   }
    // });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ADS = (globalThis as any).AsyncDisposableStack;
    if (typeof ADS === "function") {
      const stack = new ADS();
      for (const { tag, ctor } of defs) {
        stack.defer(() => { this.pendingDefinitions.delete(tag); });
        await this.define(tag, ctor, signal);
      }
      return stack; // caller disposes manually or via awaitUsingShim
    } else {
      // fallback: legacy no-op stack
      for (const { tag, ctor } of defs) {
        await this.define(tag, ctor, signal);
      }

    return {
      defer() { },
      adopt() { },
      use() { },
      disposeAsync() { return Promise.resolve(); }
    } as unknown as AsyncDisposableStack;
    }
  }

  async sequenceDefinitions(
    defs: { tag: string, ctor: CustomElementConstructor }[],
    callback?: () => Promise<void>,
    signal?: AbortSignal
  ): Promise<AsyncDisposableStack | void> {
    const mergedSignal = AbortSignal.any(
      [signal, this.abortController.signal].filter(Boolean) as AbortSignal[]
    );
    this.checkAbort(mergedSignal);

    // if AsyncDisposableStack is available use it -> progressive enhancement.
    return withDisposer(async (stack) => {
      for (const { tag, ctor } of defs) {
        stack.defer(() => {this.pendingDefinitions.delete(tag); });
        await this.define(tag, ctor, mergedSignal);
        await callback?.();
      }
      return stack;
    });
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

    console.log(`${this.prettyName} Defining ${tagName}. Received class: ${constructor.name}`);
    console.log(`${this.prettyName} Received constructor object:`, constructor);
    if (this.registry.get(tagName)) {
      this.definitions.set(tagName, customElements.get(tagName)!); // cache defensively;
      this.logger.debug(`${this.prettyName}Custom element ${tagName} already defined by native registry.`)
      return Promise.resolve();
    }
    if (this.pendingDefinitions.has(tagName)) {
      this.logger.debug(`${this.prettyName} Definition of ${tagName} is already pending`)
      await this.pendingDefinitions.get(tagName)!;
      return;
    }

    const definePromise = this.registry.whenDefined(tagName)
      .then((ctor) => {
        this.definitions.set(tagName, ctor);
        this.pendingDefinitions.delete(tagName);
        this.logger.debug(`${this.prettyName} Custom element ${tagName} succesfully defined.`)
        return ctor;
      });

    this.pendingDefinitions.set(tagName, definePromise);

    try {
      this.registry.define(tagName, constructor);
      await definePromise; //Wait for the definition promise to resolve
    } catch (error) {
      this.logger.error(`Failed to define custom element ${tagName}:`, error);
      this.pendingDefinitions.delete(tagName); //Clean up if definition fails
      throw error;
    }
  }

  // Saw this on MDN shoutout~
  async awaitUndefinedChildren(host: HTMLElement | DocumentFragment | ShadowRoot | Document, signal?: AbortSignal): Promise<CustomElementConstructor[] | DOMException> {
    const mergedSignal = AbortSignal.any(
      [signal, this.abortController.signal].filter(Boolean) as AbortSignal[]
    );
    this.checkAbort(mergedSignal);

    const undefinedElements = host.querySelectorAll(":not(:defined)");
    const tags = new Set(
      [...undefinedElements].map((child) => child.localName)
    );
    const promises = [...tags].map((tag) => this.registry.whenDefined(tag));

    return Promise.all(promises);
  }

  async whenDefined(tagName: string, signal?: AbortSignal): Promise<CustomElementConstructor> {

    const mergedSignal = AbortSignal.any(
      [signal, this.abortController.signal].filter(Boolean) as AbortSignal[]
    );
    this.checkAbort(mergedSignal);
    // if its already in the definitions cache, its ready
    if (this.definitions.has(tagName)) {
      return this.definitions.get(tagName)!; //cached constructor
    }
    // pending in this service, return existing promise
    if (this.pendingDefinitions.has(tagName)) {
      this.logger.debug(`${this.prettyName} Returning pending definition promise for ${tagName}.`);
      return this.pendingDefinitions.get(tagName)!;
    }
    //If not in cache or pending, defer to native 'customElements.whenDefined'.
    // This handles cases where the element might be defined by other means,
    // or, if 'define' was called but there is awaiting from a different context
    this.logger.debug(`${this.prettyName} Waiting for ${tagName} via native whenDefined fallback`);
    return this.windowRegistry.whenDefined(tagName);
  }

  isDefined(tagName: string): boolean {
    return this.definitions.has(tagName) || this.pendingDefinitions.has(tagName) || this.registry.get(tagName) !== undefined;
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
