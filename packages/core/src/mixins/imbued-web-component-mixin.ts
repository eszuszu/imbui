import { ServiceScope } from "../root/service-scope";
import { ElementRegistryService } from "../services/element-registry-service";
import { LoggerServiceKey, ElementRegistryServiceKey } from "../identifiers/service-keys";
import { ContextRequestEvent } from "../events/context-request-event";
import { SERVICE_SCOPE_CONTEXT_KEY } from "../identifiers/context-keys";
import { WebComponentConstructor } from "@imbui/infuse";

export const ImbuedWebComponentMixin = <TBase extends WebComponentConstructor<HTMLElement>>(Base: TBase) => {

  const ImbuedWebComponentClass = class extends Base {

    logger?: Console;
    ElementRegistryService!: ElementRegistryService;
    currentScope!: ServiceScope;

    public servicesReady: Promise<void>;
    public resolveServices!: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public rejectServices!: (reason?: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      this.servicesReady = new Promise((resolve, reject) => {
        this.resolveServices = resolve;
        this.rejectServices = reject;
      });
    }

    connectedCallback(): void {
      super.connectedCallback?.();

      if (!this.currentScope) {
        this.requestServiceScope();
      } else {
        this.logger?.log(`[${this.tagName}] Re-connected, services already established.`);
      }
    }

    public async getService<T>(key: symbol): Promise<T> {
      await this.servicesReady;
      if (!this.currentScope) {
        throw new Error(`[${this.tagName}] scope is not set after servicesReadyPromise resolved for key: ${String(key)}`);
      }
      return this.currentScope.get<T>(key);
    }

    public requestServiceScope(): void {
      const event = new ContextRequestEvent<ServiceScope>(SERVICE_SCOPE_CONTEXT_KEY, (scope: ServiceScope) => {
        this.currentScope = scope;
        try {
          this.logger = this.currentScope.get(LoggerServiceKey);

          this.ElementRegistryService = this.currentScope.get<ElementRegistryService>(ElementRegistryServiceKey);

          if (this.logger && this.ElementRegistryService) {
            this.resolveServices();
            this.logger.log(`[${this.tagName}] Received ServiceScope and initialized all required services.`);
          } else {
            const missingServices = [
              !this.logger && 'LoggerService',
              !this.ElementRegistryService && 'ElementRegistryService'
            ].filter(Boolean).join(', ');
            const errorMsg = `[${this.tagName}] failed to assign one or more required services: ${missingServices}`;
            this.rejectServices(new Error(errorMsg));
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          console.error(`[${this.tagName}] Failed to retrieve a required service from scope:`, error);
          this.rejectServices(error);
        }
      });
      this.dispatchEvent(event);

    }

    disconnectedCallback(): void {
      super.disconnectedCallback?.();
    }
  }
  return ImbuedWebComponentClass;
}