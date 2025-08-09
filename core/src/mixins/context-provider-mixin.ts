import { RootServiceScope } from "../root/root-scope-access";
import { ServiceScope } from "../root/service-scope";
import { ContextRequestEvent } from "../events/context-request-event";
import { SERVICE_SCOPE_CONTEXT_KEY } from "../identifiers/context-keys";

import { WebComponentConstructor } from "@imbui/infuse";

export const ContextProviderMixin = <TBase extends WebComponentConstructor<HTMLElement>>(Base: TBase) =>
  class ContextProvider extends Base {
    public scope!: ServiceScope;

    public _scopeInitializedPromise: Promise<void>;
    public _resolveScopeInitialized!: () => void;

    // flag to indicate if the scope has been explicitly set as root
    public _isRootScopeExplicitlySet: boolean = false;

    constructor(...args: any[]) {
      super(...args);
      this._scopeInitializedPromise = new Promise(resolve => {
        this._resolveScopeInitialized = resolve;
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
      if (this._isRootScopeExplicitlySet) {
        console.warn(`[${this.tagName || 'ContextProviderMixin'}] Root scope already explicitly set. Ignoring redundant call.`);
        return;
      }
      this.scope = rootScope;
      this._resolveScopeInitialized();
      this._isRootScopeExplicitlySet = true;
      console.log(`[${this.tagName || [ContextProviderMixin]}] Scope explicitly set as root`);
    }

    connectedCallback() {
      super.connectedCallback && super.connectedCallback();

      //Only attempt to request a parent scope and fork if the scope
      //hasn't been explicitly set as the root
      if (!this._isRootScopeExplicitlySet) {

        this.requestParentScope().then(parentScope => {
          this.scope = parentScope.fork();
          console.log(`[${this.tagName}] Initialized scope by forking parent. Parent scope...`)
          this._resolveScopeInitialized();

        }).catch(error => {
          console.error(`[${this.tagName}] failed to establish ServiceScope:`, error);
        });
      } else {
        console.log(`[${this.tagName}] Scope already explicitly set as root. Skipping parent request logic`)
      }
    }


    public provideContext<T>(key: string | symbol, service: T): void {
      this._scopeInitializedPromise.then(() => {
        this.scope.provide(key, service);
        console.log(`[${this.tagName}] Providing context for key: ${String(key)}`);
      });
    }

    public handleContextRequest = (event: ContextRequestEvent<ServiceScope>): void => {
      this._scopeInitializedPromise.then(() => {
        const { contextKey, callback } = event;

        if (contextKey === SERVICE_SCOPE_CONTEXT_KEY && this.scope) {
          callback(this.scope);
          event.stopPropagation();
          console.log(`[${this.tagName}] Provided context scope (${this.scope}) to a requester.`);
        } else {
          console.log(`[${this.tagName}] Does not have Context for key: ${String(contextKey)}, letting event bubble`);
        }
      });
    };

    public requestParentScope(): Promise<ServiceScope> {
      return new Promise(resolve => {
        const requestEvent = new ContextRequestEvent<ServiceScope>(SERVICE_SCOPE_CONTEXT_KEY, (parentScope: ServiceScope) => {
          resolve(parentScope);
        });
        this.dispatchEvent(requestEvent);

        setTimeout(() => {
          if (!this.scope) {
            console.warn(`[${this.tagName}] No parent ContextProvider found for ServiceScope. Falling back to global RootServiceScope`);
            resolve(RootServiceScope);
          }
        }, 0);
      })
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) {
        super.disconnectedCallback();
      }
      this.removeEventListener('context-request', this.handleContextRequest as EventListener);
    }
  }