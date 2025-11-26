import {
  ROUTER_SERVICE_KEY,
  ImbuedWebComponentMixin,
  ReactiveWebComponentMixin,
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  infuse,
  signal,
  LoggerServiceKey,
} from "@imbui/core";

import type { RouterService, Signal } from "@imbui/core";

import { createViewer } from "./viewer";

const ViewInfusion = infuse(
  HTMLElement,
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ImbuedWebComponentMixin,
  ReactiveWebComponentMixin,
);

export class View extends ViewInfusion {
  static get shadowRootInit(): ShadowRootInit {
    return { mode: 'open', slotAssignment: 'manual' };
  }
  readonly preRendered: Signal<boolean> = signal(true);
  readonly currentTag: Signal<string | null> = signal<string | null>(null);
  readonly currentParams: Signal<Record<string, string>> = signal({});
  readonly isLoading: Signal<boolean> = signal(false);
  readonly viewError: Signal<Error | null> = signal<Error | null>(null);
  readonly cachedPages: Map<string, HTMLElement> = new Map();

  //private elementRegistry: ElementRegistryService; // this is for if I need to await child definitions

  currentPath: string | null = null;
  private router: RouterService | null = null;
  private view: HTMLSlotElement;
  private viewer;
  
  constructor(){
    super();
    this.view = document.createElement('slot');
    this.shadowRoot.append(this.view);
    this.viewer = createViewer(
      {
        type: 'slot',
        cachedPages: this.cachedPages,
        host: this,
        query: '[data-projected="page"]',
        slot: this.view,
      }
    );
  }
  
  connectedCallback(){
    
    super.connectedCallback?.();

    this.viewer.loadPage();
    this.currentTag.set(this.viewer.currentTag);
    this.servicesReady.then(() => {

      this.router = this.currentScope.get(ROUTER_SERVICE_KEY);
      this.logger = this.currentScope.get(LoggerServiceKey);
      this.logger.log(`[${this.tagName}]: Connected and services retrieved.`);

      // 3-ish cases, alot of checking the DOM, some type guards would make this more robust.
      //1. The given route and page is pre-rendered HTML
      //2. the given route is a new tag, the current page is pre-rendered HTML
      //3. the given route is a new tag, there is no pre-rendered HTML just dynamically generated 
      //transitions: pre-rendered -> template | template -> template | template -> pre-rendered.
      // page load: assign pre-rendered HTML to initial page component slot if any, otherwise, create initial component.
      // first transition: create new page component, unassign pre-rendered HTML, assign new page to the slot.
      // second transition: create new page component, unassign current component, assign new page to slot.
      // third transition: select pre-rendered page component from the light dom, assign it to the slot.
      // for cases where the component tag doesnt change, an api/dataservice will instead hydrate it's shape
      // components are in charge of tasking their fetching by interfacing with the fetcher

      this.createEffect(async() => {
        const routerState = this.router?.currentRoute.get();
        if (routerState) {
          this.currentParams.set(routerState.params || {});
          this.currentPath = routerState.path;

          if (routerState.config) {
            const tag = routerState.config.componentTag;

            if (typeof tag === 'string') {

              if (this.currentTag.get() === tag) {
                //don't do anyting, just update data
              } else if (
                tag === this.viewer.initialTag &&
                this.currentTag.get() !== this.viewer.initialTag &&
                this.viewer.initialTag !== null &&
                this.currentTag.get() !== null
              ) {
                const current = this.view.assignedElements()[0];
                current.remove();
                const el = this.viewer.createPage(tag);
                this.viewer.assignPage(el);
                this.currentTag.set(tag);
              } else {
                const el = this.viewer.createPage(tag);
                el.remove();
                this.viewer.appendPage(el);
                this.viewer.assignPage(el);
                this.currentTag.set(tag);
              } 
            }
          }
        } 
      });
    });
  }

  isPreAssigned() {
    const page = this.querySelector('[data-projected="page"');
    if (page && this.view.assignedElements()[0] === page && this.preRendered.get() === true) {
      return true;
    } else {
      return false;
    }
  }
}