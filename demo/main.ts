import { html, Runtime, render, TemplateResult } from "@imbui/cast";
import {
  BaseWebComponentMixin,
  ReactiveWebComponentMixin,
  infuse,
  Signal,
  signal,
} from "@imbui/infuse";


const appInfusion = infuse(
  HTMLElement,
  BaseWebComponentMixin,
  ReactiveWebComponentMixin,
);

const sheet = `h1 {
        max-width: 100dw;
        background-color: black;
        color: white;
        display: block;
        min-height: 15rem;
      }`

const appTemplate = (
  title: string | number,
  count: number,
  dynamicClass: string,
  handler: () => void
) => html`
      <h1>${title}</h1>
      <p class="${dynamicClass}">Count: ${count}</p>
      <button onclick="${handler}">Click Me!</button>
      `;

export const init = customElements.define(
  'app-',
  class App extends appInfusion {
    globalSignal!: Signal<number>;
    titleSignal!: Signal<string | number>;
    dynamicTitle!: string;
    runtime!: Runtime;
    sheet!: CSSStyleSheet;
    template!: () => TemplateResult;
    dynamicClass: string;
    constructor() {
      super();
      this.globalSignal = signal<number>(0);
      this.titleSignal = signal<string | number>('hello :) Why dont you click :D \n');
      this.runtime = new Runtime();
      this.sheet = new CSSStyleSheet();
      this.sheet.replaceSync(sheet);
      this.adoptedStyleSheets = [this.sheet];
      this.dynamicClass = 'test';

    }
    
    connectedCallback(): void {
      super.connectedCallback?.();
      const container = document.createElement('div');
      container.setAttribute('name', 'slotted');
      const projected = document.createElement('slot');
      projected.setAttribute('slot', 'slotted');
      this.shadowRoot.appendChild(projected);
      this.shadowRoot.appendChild(container);

      this.createEffect(() => {

        render(
          appTemplate(
            this.titleSignal.get(),
            this.globalSignal.get(),
            this.dynamicClass,
            this.handler
          ), container, undefined, this.runtime);
    
      });

      for(let i = 0; i< 10; i++){

        setTimeout(() => {
          this.globalSignal.set(<number>this.globalSignal.get() + 1);
          
          const count = this.globalSignal.get();
          if (count > 15) {
            this.titleSignal.set(this.titleSignal.get() + ' ouch');
          } else {
            this.titleSignal.set(this.titleSignal.get() + 'Updated ' + count)
          }
        }, 2000 + (i*100));
      }
    }

    handler = () => {
      this.globalSignal.set(<number>this.globalSignal.get() + 1);
      const count = this.globalSignal.get();
      if (count > 15) {
        this.titleSignal.set(this.titleSignal.get() + ' ouch');
      } else {
        this.titleSignal.set(this.titleSignal.get() + 'Updated ' + count);

      }
    }
  
    disconnectedCallback(): void {
      super.disconnectedCallback?.();
    }
  }
);