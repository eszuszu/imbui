import {
  ServiceScope,
  LoggerServiceKey,
  ElementRegistryServiceKey,
  ContextProviderMixin
} from "@imbui/core";

import { LoggerService, ElementRegistryService } from "@imbui/core";
import { DOMAwareMixin } from "../components/primitives";
import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";

const ROOT_SCOPE = new ServiceScope();
const LOGGER = new LoggerService();
const EL_REGISTRY = new ElementRegistryService(LOGGER);

class App extends ContextProviderMixin(HTMLElement) {
  constructor(){
    super();
    this.setAsRootScopeProvider(ROOT_SCOPE);
    this.provideContext(LoggerServiceKey, LOGGER);
    this.provideContext(ElementRegistryServiceKey, EL_REGISTRY);
  }
  connectedCallback(): void {
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
  EL_REGISTRY.defineMany(
    [
      { tag: tag, ctor: App },
      { tag: 'ui-container', ctor: Container },
      { tag: 'ui-layer', ctor: Layer },
      { tag: 'ui-header', ctor: Header },
      { tag: 'ui-sidebar', ctor: Sidebar },
    ]
  );
}