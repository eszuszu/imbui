import { html, renderText, addEffect } from "./prototypes/tagged-templates";
import {
  BaseWebComponentMixin,
  infuse,
  Signal,
  signal,
} from "@imbui/infuse";


const appInfusion = infuse(
  HTMLElement,
  BaseWebComponentMixin,
);

export const init = customElements.define(
  'app-',
  class App extends appInfusion {
    globalSignal!: Signal<number>;
    titleSignal!: Signal<string>;
    constructor() {
      super();
      this.globalSignal = signal(0);
    }
  
    connectedCallback(): void {
      super.connectedCallback?.();
      const container = document.createElement('div');

      const slot: HTMLSlotElement = document.createElement('slot');
      this.shadowRoot.appendChild(slot);
      this.appendChild(container);

      let dynamicTitle = 'hello';
      this.titleSignal = signal(dynamicTitle);

      let test = "test";
      const doc = html`
      <h1>${addEffect(this.titleSignal)}</h1>
      <p class="${test}">Count: ${addEffect(this.globalSignal)}</p>
      `;

      renderText(doc, container);

      dynamicTitle = 'Updated!';

      for(let i = 0; i< 10; i++){

        setTimeout(() => {
          this.globalSignal.set(this.globalSignal.get() + 1);
          this.titleSignal.set(this.titleSignal.get() + dynamicTitle)
        }, 2000 + (i*100));
      }
    }
  
    disconnectedCallback(): void {
      super.disconnectedCallback?.();
    }
  }
);