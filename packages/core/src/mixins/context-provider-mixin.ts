import { ServiceScope } from "../root/service-scope";
import { ContextRequestEvent } from "../events/context-request-event";
import { SERVICE_SCOPE_CONTEXT_KEY } from "../identifiers/context-keys";
import { WebComponentConstructor } from "@imbui/infuse";

export const ContextProviderMixin = <TBase extends WebComponentConstructor<HTMLElement>>(Base: TBase) =>
  class ContextProvider extends Base {
    logger!: Console;

    defaultScope: ServiceScope | null = null;
    public providerScope!: ServiceScope;
    public scopeReady: Promise<void>;
    public resolveScope!: () => void;

    // flag to indicate if the scope has been explicitly set as root
    public isRootSet: boolean = false;
    public isSecureScope = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      this.scopeReady = new Promise(resolve => {
        this.resolveScope = resolve;
      });

      this.addEventListener('context-request', this.handleContextRequest as EventListener)
    }

    /**
     * Allows a coponent to explicitly set its ServiceScope as the root scope provider.
     * this method bypasses the parent scope request/forking logic for this instance.
     * Must be called in the component's constructor.
     * @param rootScope The pre-instantiated root ServiceScope singleton
     */
    public setAsRootScopeProvider(rootScope: ServiceScope): void {
      if (this.isRootSet) {
        this.logger.warn(`[${this.tagName || 'ContextProviderMixin'}] Root scope already explicitly set. Ignoring redundant call.`);
        return;
      }
      this.providerScope = rootScope;
      this.resolveScope();
      this.isRootSet = true;
      this.logger.log(`[${this.tagName || [ContextProviderMixin]}] Scope explicitly set as root`);
    }

    connectedCallback() {
      super.connectedCallback?.();

      //Only attempt to request a parent scope and fork if the scope
      //hasn't been explicitly set as the root
      if (!this.isRootSet) {

        this.requestParentScope().then(parentScope => {
          this.providerScope = parentScope.fork();
          this.logger.log(`[${this.tagName}] Initialized scope by forking parent. Parent scope...`)
          this.resolveScope();

        }).catch(error => {
          this.logger.error(`[${this.tagName}] failed to establish ServiceScope:`, error);
        });
      } else {
        this.logger.log(`[${this.tagName}] Scope already explicitly set as root. Skipping parent request logic`)
      }
    }


    public provideContext<T>(key: symbol, service: T): void {
      this.scopeReady.then(() => {
        this.providerScope.provide(key, service);
        this.logger.log(`[${this.tagName}] Providing context for key: ${String(key)}`);
      });
    }

    public handleContextRequest = (event: ContextRequestEvent<ServiceScope>): void => {
      this.scopeReady.then(() => {
        const { contextKey, callback } = event;

        if (contextKey === SERVICE_SCOPE_CONTEXT_KEY && this.providerScope) {
          callback(this.providerScope);
          event.stopPropagation();
          this.logger.log(`[${this.tagName}] Provided context scope (${this.providerScope}) to a requester.`);
        } else {
          this.logger.log(`[${this.tagName}] Does not have Context for key: ${String(contextKey)}, letting event bubble`);
        }
      });
    };

    public requestParentScope(): Promise<ServiceScope> {
      return new Promise(resolve => {
        let resolved = false;
        const requestEvent = new ContextRequestEvent<ServiceScope>(
          SERVICE_SCOPE_CONTEXT_KEY,
          scope => { resolved = true; resolve(scope); }
        );
        this.dispatchEvent(requestEvent);
        queueMicrotask(() => {
          if (!resolved) {
            this.logger.warn(`[${this.tagName}] No parent ContextProvider found for ServiceScope. Falling back to default scope.`);
            this.defaultScope = new ServiceScope;
            resolve(this.defaultScope);
          }
        });
      })
    }

    setSecureScope(rootScope: ServiceScope, allowedKeys: symbol[]): void {
      this.providerScope = rootScope.secureFork(allowedKeys);
      this.resolveScope();
      this.isRootSet = true;
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) {
        super.disconnectedCallback();
      }
      this.removeEventListener('context-request', this.handleContextRequest as EventListener);
    }
  }