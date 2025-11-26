/// <reference types="vite/client" />
import {
  ServiceScope,
  LoggerServiceKey,
  ElementRegistryServiceKey,
  ROUTER_SERVICE_KEY,
  ContextProviderMixin,

} from "@imbui/core";

import { ConsoleLogger, NoOpLogger, ElementRegistryService, RouterService } from "@imbui/core";
import { DOMAwareMixin } from "../components/primitives";
import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { Link } from "../components/link";
import { APP_ROUTES } from "../app-routes";
import { DATA_SERVICE_KEY, DataService } from "../services/data-service";
import type { Page } from "../services/types";
import { PageDocs } from "../components/pages/page-docs";
import { PageIntro } from "../components/pages/page-intro";
import { PageError } from "../components/pages/page-error";
import { PageEssentials } from "../components/pages/page-essentials";
import { View } from "../components/view";
import { Overlay } from "../components/overlay";
import { ThemeToggle } from "../components/theme";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).IMBUI_RUNTIME_MODE = import.meta.env.MODE

class RootFacade {
  static #__ENV__: string;
  logger: InstanceType<typeof ConsoleLogger | typeof NoOpLogger> | Console = console;
  elementRegistry: ElementRegistryService;
  router: RouterService;
  dataService: DataService<Page>;
  root: ServiceScope;
  constructor() {
    this.root = new ServiceScope;
    const root = this.root;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    RootFacade.#__ENV__ = (window as any).IMBUI_RUNTIME_MODE;
    this.logger = RootFacade.#__ENV__ === 'development' ?  new ConsoleLogger : new NoOpLogger;
    this.elementRegistry = new ElementRegistryService(this.logger as Console);
    this.router = new RouterService(this.logger as Console, APP_ROUTES);
    this.dataService = new DataService<Page>(this.logger);
    root.provide(LoggerServiceKey, this.logger)
    root.provide(ElementRegistryServiceKey, this.elementRegistry)
    root.provide(ROUTER_SERVICE_KEY, this.router);
    root.provide(DATA_SERVICE_KEY, this.dataService);
  }
  getEnv() {
    return RootFacade.#__ENV__;
  }
}

const root = new RootFacade;

class App extends ContextProviderMixin(HTMLElement) {
  root: RootFacade;
  constructor(){
    super();
    this.root = root
    const rootScope = this.root.root;
    this.logger = rootScope.get(LoggerServiceKey);
    this.setAsRootScopeProvider(rootScope);
    console.log(`[APP] Initialized in environment ${this.root.getEnv()}`)
    // this.provideContext(LoggerServiceKey, rootScope.logger);
    // this.provideContext(ElementRegistryServiceKey, rootScope.elementRegistry);
    // this.provideContext(ROUTER_SERVICE_KEY, rootScope.router);
    // this.provideContext(DATA_SERVICE_KEY, rootScope.dataService);
  }
  connectedCallback(): void {
    const router = this.providerScope.get<RouterService>(ROUTER_SERVICE_KEY);
   if (router != null) {
      router.init();
   }
  }


}

class Layer extends DOMAwareMixin(HTMLElement) {
  constructor() {
    super();
  }
}

class Container extends DOMAwareMixin(HTMLElement) {
  constructor() {
    super();
  }
}

export function createApp(tag: string) {
  root.elementRegistry.defineMany(
    [
      { tag: tag, ctor: App },
      { tag: 'router-link', ctor: Link},
      { tag: 'theme-toggle', ctor: ThemeToggle},
      { tag: 'ui-container', ctor: Container },
      { tag: 'ui-layer', ctor: Layer },
      { tag: 'ui-header', ctor: Header },
      { tag: 'ui-sidebar', ctor: Sidebar },
      { tag: 'page-docs', ctor: PageDocs },
      { tag: 'page-error', ctor: PageError },
      { tag: 'page-intro', ctor: PageIntro},
      { tag: 'page-essentials', ctor: PageEssentials },
      { tag: 'ui-view', ctor: View },
      { tag: 'ui-overlay', ctor: Overlay}
    ]
  );
}