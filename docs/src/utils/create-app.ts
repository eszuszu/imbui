import {
  ServiceScope,
  LoggerServiceKey,
  ElementRegistryServiceKey,
  ROUTER_SERVICE_KEY,
  ContextProviderMixin,
} from "@imbui/core";

import { LoggerService, ElementRegistryService, RouterService } from "@imbui/core";
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

const rootScope = new ServiceScope();
const logger = new LoggerService();
const elementRegistry = new ElementRegistryService(logger);
const router = new RouterService(logger, APP_ROUTES);
const dataService = new DataService<Page>(logger);

class App extends ContextProviderMixin(HTMLElement) {
  constructor(){
    super();
    this.setAsRootScopeProvider(rootScope);
    this.provideContext(LoggerServiceKey, logger);
    this.provideContext(ElementRegistryServiceKey, elementRegistry);
    this.provideContext(ROUTER_SERVICE_KEY, router);
    this.provideContext(DATA_SERVICE_KEY, dataService);
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
  elementRegistry.defineMany(
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