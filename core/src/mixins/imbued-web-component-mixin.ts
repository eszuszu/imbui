import { ServiceScope } from "../root/service-scope";
import { LoggerService } from "../services/logger-service";
import { CustomElementRegistryService } from "../services/custom-element-registry-service";
import { LoggerServiceKey, CustomElementRegistryServiceKey } from "../identifiers/service-keys";
import { ContextRequestEvent } from "../events/context-request-event";
import { SERVICE_SCOPE_CONTEXT_KEY } from "../identifiers/context-keys";
import { WebComponentConstructor } from "@imbui/infuse";

export const ImbuedWebComponentMixin = <TBase extends WebComponentConstructor<HTMLElement>>(Base: TBase) => {

  const ImbuedWebComponentClass = class extends Base {

    logger!: LoggerService;
    customElementRegistryService!: CustomElementRegistryService;
    currentServiceScope!: ServiceScope;

    public _servicesReadyPromise: Promise<void>;
    public _resolveServicesReady!: () => void;
    public _rejectServicesReady!: (reason?: any) => void;

    constructor(...args: any[]) {
      super(...args);

      this._servicesReadyPromise = new Promise((resolve, reject) => {
        this._resolveServicesReady = resolve;
        this._rejectServicesReady = reject;
      });
    }

    connectedCallback(): void {
      super.connectedCallback?.();

      if (!this.currentServiceScope) {
        this.requestServiceScope();
      } else {
        this.logger?.log(`[${this.tagName}] Re-connected, services already established.`);
      }
    }

    public async getService<T>(key: string | symbol): Promise<T> {
      await this._servicesReadyPromise;
      if (!this.currentServiceScope) {
        throw new Error(`[${this.tagName}] currentServiceScope is not set after servicesReadyPromise resolved for key: ${String(key)}`);
      }
      return this.currentServiceScope.get<T>(key);
    }

    public requestServiceScope(): void {
      const event = new ContextRequestEvent<ServiceScope>(SERVICE_SCOPE_CONTEXT_KEY, (scope: ServiceScope) => {
        this.currentServiceScope = scope;
        try {
          this.logger = this.currentServiceScope.get<LoggerService>(LoggerServiceKey);

          this.customElementRegistryService = this.currentServiceScope.get<CustomElementRegistryService>(CustomElementRegistryServiceKey);

          if (this.logger && this.customElementRegistryService) {
            this._resolveServicesReady();
            this.logger.log(`[${this.tagName}] Received ServiceScope and initialized all required services.`);
          } else {
            const missingServices = [
              !this.logger && 'LoggerService',
              !this.customElementRegistryService && 'CustomElementRegistryService'
            ].filter(Boolean).join(', ');
            const errorMsg = `[${this.tagName}] failed to assign one or more required services: ${missingServices}`;
            this._rejectServicesReady(new Error(errorMsg));
          }
        } catch (error: any) {
          console.error(`[${this.tagName}] Failed to retrieve a required service from scope:`, error);
          this._rejectServicesReady(error);
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