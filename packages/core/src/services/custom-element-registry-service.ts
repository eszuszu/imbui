import type { LoggerService } from "./logger-service";

export class CustomElementRegistryService {
  private definitions = new Map<string, CustomElementConstructor>();
  private pendingDefinitions = new Map<string, Promise<CustomElementConstructor>>();
  private logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger;
  }

  async define (tagName: string, constructor: CustomElementConstructor): Promise<void> {
    console.log(`[CustomElementRegistryService] Defining ${tagName}. Received class: ${constructor.name}`);
    console.log(`[CustomElementRegistryService] Received constructor object:`, constructor);
    if (customElements.get(tagName)) {
      this.definitions.set(tagName, customElements.get(tagName)!); // cache defensively;
      this.logger.debug(`[CustomElementregistryService] Custom element ${tagName} already defined by native registry.`)
      return Promise.resolve();
    }
    if (this.pendingDefinitions.has(tagName)) {
      this.logger.debug(`[CustomElementRegistryService] Definition of ${tagName} is already pending`)
      await this.pendingDefinitions.get(tagName)!;
      return;
    }

    const definePromise = customElements.whenDefined(tagName)
      .then((ctor) => {
        this.definitions.set(tagName, ctor);
        this.pendingDefinitions.delete(tagName);
        this.logger.debug(`[CustomElementRegistryService] Custom element ${tagName} succesfully defined.`)
        return ctor;
      });

    this.pendingDefinitions.set(tagName, definePromise);

    try {
      customElements.define(tagName, constructor);
      await definePromise; //Wait for the definition promise to resolve
    } catch (error) {
      this.logger.error(`Failed to define custom element ${tagName}:`, error);
      this.pendingDefinitions.delete(tagName); //Clean up if definition fails
      throw error;
    }
  }

  async whenDefined(tagName: string): Promise<CustomElementConstructor> {
    // if its already in the definitions cache, its ready
    if (this.definitions.has(tagName)) {
      return this.definitions.get(tagName)!; //cached constructor
    }
    // pending in this service, return existing promise
    if (this.pendingDefinitions.has(tagName)) {
      this.logger.debug(`[CustomElementRegistryService] Returning pending definition promise for ${tagName}.`);
      return this.pendingDefinitions.get(tagName)!;
    }

    //If not in cache or pending, defer to native 'customElements.whenDefined'.
    // This handles cases where the element might be defined by other means,
    // or, if 'define' was called but there is awaiting froma different context
    this.logger.debug(`[CustomElementRegistryService] Waiting for ${tagName} via native whenDefined fallback`);
    return customElements.whenDefined(tagName);
  }

  isDefined(tagName: string): boolean {
    return this.definitions.has(tagName)  || this.pendingDefinitions.has(tagName) || customElements.get(tagName) !== undefined;
  }

  getConstructor(tagName: string): CustomElementConstructor | undefined {
    return this.definitions.get(tagName) || customElements.get(tagName);
  }
}
