
import { WebComponentConstructor} from "./types";

export const BaseWebComponentMixin = <TBase extends WebComponentConstructor>(Base: TBase) => {

  const BaseWebComponentClass = class extends Base {

    declare shadowRoot: ShadowRoot;
    
    static get shadowRootInit(): ShadowRootInit {
      return { mode: 'open' };
    }

    declare observedAttributes: string[];
    
    logger: Console  | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      if (!this.shadowRoot) {
        this.attachShadow((this.constructor as typeof BaseWebComponentClass).shadowRootInit);
        this.logger?.log(`[${this.tagName}] ShadowRoot attached in BaseWebComponentMixin constructor. ShadowRoot is now: ${!!this.shadowRoot}`);
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
        this.logger?.warn(`[${this.tagName}] ShadowRoot not attached. Cannot set adopted StyleSheets`)
      }
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) {
        super.disconnectedCallback();
      }
    }
  }
  return BaseWebComponentClass;
};
