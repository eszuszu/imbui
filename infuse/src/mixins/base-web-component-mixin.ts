
import { WebComponentConstructor} from "./types";

export const BaseWebComponentMixin = <TBase extends WebComponentConstructor>(Base: TBase) => {

  const BaseWebComponentClass = class extends Base {

    declare shadowRoot: ShadowRoot;
    
    static get shadowRootInit(): ShadowRootInit {
      return { mode: 'open' };
    }

    declare observedAttributes: string[];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
  
      if (!this.shadowRoot) {
        this.attachShadow((this.constructor as typeof BaseWebComponentClass).shadowRootInit);
        console.log(`[${this.tagName}] ShadowRoot attached in BaseWebComponentMixin constructor. ShadowRoot is now: ${!!this.shadowRoot}`);
      }
    }

    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }


    set adoptedStyleSheets(sheets: CSSStyleSheet[]) {
      if (this.shadowRoot) {
        this.shadowRoot.adoptedStyleSheets = sheets;
      } else {
        console.warn(`[${this.tagName}] ShadowRoot not attached. Cannot set adopted StyleSheets`)
      }
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) {
        super.disconnectedCallback();
        console.log(`[${this.tagName}] disconnectedCallback fired;`)
      }
    }
  }
  return BaseWebComponentClass;
};
