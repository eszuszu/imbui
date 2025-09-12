import {
  ROUTER_SERVICE_KEY,
  ImbuedWebComponentMixin,
  ReactiveWebComponentMixin,
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  infuse,
  //cast,
  //die,
  signal,
  LoggerServiceKey,
} from "@imbui/core";

import type { RouterService, Signal } from "@imbui/core";

const ViewInfusion = infuse(
  HTMLElement,
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ImbuedWebComponentMixin,
  ReactiveWebComponentMixin,
);

export class View extends ViewInfusion {
  readonly currentTag: Signal<string | null>;
  readonly currentParams: Signal<Record<string, string>>;
  readonly isLoading: Signal<boolean>;
  readonly viewError: Signal<Error | null>;

  //private elementRegistry: ElementRegistryService;
  private currentPath: string | null = null;
  private router: RouterService | null = null;

  constructor(){
    super();
    this.attachShadow(
      { 
        mode: "open",
        slotAssignment: "manual"
      }
    );

    this.currentTag = signal<string | null>(null);
    this.currentParams = signal({});
    this.isLoading = signal(false);
    this.viewError = signal<Error | null>(null);

  }
  
  connectedCallback(){
    super.connectedCallback?.();

    const view = this.querySelector('[data-projected="page"]');
    
    if (view) {
      const tag = view.tagName.toLowerCase();
      this.currentTag.set(tag);
    }

    this.servicesReady.then(() => {

      this.router = this.currentScope.get(ROUTER_SERVICE_KEY);
      this.logger = this.currentScope.get(LoggerServiceKey);
      this.logger.log(`[${this.tagName}]: Connected and services retrieved.`);

      this.createEffect(async() => {
        const currentState = this.router?.currentRoute.get();
        if (currentState) {
          this.currentParams.set(currentState.params || {});
          this.currentPath = currentState.path;
          if (currentState.config && typeof currentState.config.componentTag === 'string') {
            this.currentTag.set(currentState.config.componentTag)
            const el = document.createElement(currentState.config.componentTag);
            this.shadowRoot.append(el);
          }
        }
      })
    });

    //cast(template(this.currentTag.get()), this.shadowRoot);
    
  }

}