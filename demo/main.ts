import {
  BaseWebComponentMixin,
  infuse
} from "@imbui/infuse";

const appInfusion = infuse(
  HTMLElement,
  BaseWebComponentMixin,
);

export const init = customElements.define(
  'app-',
  class App extends appInfusion {
    constructor() {
      super();
    }
  
    connectedCallback(): void {
      super.connectedCallback?.();
  
      const slot: HTMLSlotElement = document.createElement('slot');
      this.shadowRoot.appendChild(slot);
    }
  
    disconnectedCallback(): void {
      super.disconnectedCallback?.();
    }
  }
);