import { html, Runtime, render, TemplateResult } from "@imbui/cast";
import {
  ElementalWebComponentMixin,
  BaseWebComponentMixin,
  ReactiveWebComponentMixin,
  infuse,
} from "@imbui/infuse";
import { Signal, signal } from "@imbui/pulse";
// You can get all of these with just "@imbui/core" too, this is just showcasing the modularity,
// no need for `imbui/core` grab what you want, or, use what you need~
import { ConsoleLogger, ElementRegistryService } from "@imbui/core";
import { DemoHeader } from "./components/banner/banner";

const logger = new ConsoleLogger() as Console;

const appInfusion = infuse(
  HTMLElement,
  BaseWebComponentMixin, // Be aware, all components that use the BaseWebComponentMixin attach an open shadow root by default
  ElementalWebComponentMixin,
  ReactiveWebComponentMixin,
);

const sheet = `
      [data-projected="counter"] {
        max-width: 100dw;
        background-color: black;
        color: white;
        display: block;
        min-height: 15rem;
        border-radius: 8px;
      }
      `

const appTemplate = (
  title: string | number,
  count: number,
  dynamicClass: string,
  handler: () => void,
  buttonText: string
) => html`
      <h1 class=${"hydrated"}>${title}</h1>
      <p class="${dynamicClass}">Count: ${count}</p>
      <div><button onclick="${handler}">${buttonText}</button></div>
      `;

const appSlots = () => html`
<slot name="header-slot"></slot>
<slot name="intro-slot"></slot>
<slot name="basics-slot"></slot>
<slot name="pre-slot"></slot>
<slot name="reactive-slot"></slot>
<slot name="state-slot"></slot>
<slot name="content-slot"></slot>
<slot name="footer-slot"></slot>
`
const elementRegistryService = new ElementRegistryService(logger);
elementRegistryService.define('demo-header', DemoHeader)
export const init = elementRegistryService.define(
  'app-',
  class App extends appInfusion {
    globalSignal!: Signal<number>;
    titleSignal!: Signal<string | number>;
    dynamicTitle!: string;
    runtime!: Runtime;
    sheet!: CSSStyleSheet;
    template!: () => TemplateResult;
    dynamicClass: string;
    buttonText: Signal<string>;
    constructor() { // generally you want to do things in the connectedCallback, but dependency injection can happen here as long as it doesn't depend on DOM, be careful about async and microtasks
      super();
      this.globalSignal = signal<number>(0);
      this.titleSignal = signal<string | number>('hello :) Why dont you click :D \n');
      this.runtime = new Runtime();
      this.sheet = new CSSStyleSheet();
      this.sheet.replaceSync(sheet);
      this.adoptedStyleSheets = [this.sheet];
      this.dynamicClass = 'test';
      this.buttonText = signal<string>('Click Me!');
      elementRegistryService.getSnapshot();
    }
    // base mixin always attaches to a shadow dom,
    // so we need to make a slot element if we want the original
    // pre-rendered light dom to render into the shadow dom.
    connectedCallback(): void {
      super.connectedCallback?.();
      render(appSlots(), this.shadowRoot, undefined, this.runtime);

      this.cacheShadowElements();
      this.collectUpdatableElements();
      // the setTimeout mimics an async resource or service
      setTimeout(() => {
        this.createEffect(() => {
            
        render(
          appTemplate(
            this.titleSignal.get(),
            this.globalSignal.get(),
            this.dynamicClass,
            this.handler,
            this.buttonText.get()
          ), this.updatableElements['counter'], undefined, this.runtime);
        
          });
      }, 4000);

      logger.log(`${elementRegistryService.constructor.name}`, elementRegistryService.listDefinitions())
    }
    
    handler = () => {
      this.globalSignal.set(<number>this.globalSignal.get() + 1);
      const count = this.globalSignal.get();
      if (count > 15) {
        this.titleSignal.set(this.titleSignal.get() + ' ouch');
      } else {
        this.titleSignal.set(this.titleSignal.get() + 'Updated ' + count + '. ');

      }
      if (count > 20) {
        this.titleSignal.set('Wow! I think, like, you won!')
      }
      if (count > 24) {
        this.titleSignal.set("No, seriously, stop, this hurts!")
      }
      if (count > 25) {
        this.dynamicClass = 'ouch';
        this.buttonText.set('ded.')
        render(
          appTemplate(
            this.titleSignal.get(),
            this.globalSignal.get(),
            this.dynamicClass,
            this.handler,
            this.buttonText.get(),
          ), this.updatableElements['counter'], undefined, this.runtime);
      }
      logger.log(`${elementRegistryService.constructor.name}`, count)
    }
  
    disconnectedCallback(): void {
      super.disconnectedCallback?.();
    }
  }
);