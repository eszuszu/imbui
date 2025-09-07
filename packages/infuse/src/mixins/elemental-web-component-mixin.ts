import { WebComponentConstructor } from "./types";

export type TemplateUsage = 'shadow-slots' | 'shadow-full' | 'light-structure' | 'default-slot-content' | string

export const ElementalWebComponentMixin = <TBase extends WebComponentConstructor>(Base: TBase) => {

  class ElementalWebComponentClass extends Base {
    //Raw template strings
    public _rawTemplates = new Map<TemplateUsage, string>();

    public slots: { [name: string]: HTMLSlotElement; } = {};
    public refs: { [ref: string]: HTMLElement | HTMLUListElement | HTMLDetailsElement | undefined; } = {};

    public updatableElements: Record<string, HTMLElement> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
    }

    connectedCallback(): void {
      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }

    public registerTemplates(templates: Map<TemplateUsage, string>): void {
      templates.forEach((htmlString, usage) => {
        if (this._rawTemplates.has(usage)) {
          console.warn(`[${this.tagName || 'Unnamed Component'}] Template for usage '${usage}' already registered. Overwriting.`)
        }
        this._rawTemplates.set(usage, htmlString);
      });
    }

    public getClonedTemplate(usage: TemplateUsage): DocumentFragment {
      const rawHtmlString = this._rawTemplates.get(usage);
      if (!rawHtmlString) {
        throw new Error(`[${this.tagName || 'Unnamed Component'}] Template for usage '${usage}' not registered.`);
      }

      const tempTemplate = document.createElement('template');
      tempTemplate.innerHTML = rawHtmlString;
      return tempTemplate.content.cloneNode(true) as DocumentFragment;
    }

    public cacheShadowElements(): void {
      if (!this.shadowRoot || this.shadowRoot.children.length === 0) {
        console.warn(`[${this.tagName}] Attempted to cache shadow elements before ShadowRoot has content.`);
        return;
      }

      const slotElements = this.shadowRoot.querySelectorAll('slot');
      const componentRefs = this.shadowRoot.querySelectorAll('[data-ref]') as NodeListOf<HTMLElement>;

      slotElements.forEach(slot => {
        const name = slot.name || 'default';
        this.slots[name] = slot;
      });
      componentRefs.forEach(el => {
        const ref = el.dataset.ref;
        if (ref) {
          this.refs[ref] = el;
        }
      });
      console.log(`[${this.tagName}] Cached shadow elements (slots: ${Object.keys(this.slots).length} refs: ${Object.keys(this.refs).length})`);

    }

    public collectUpdatableElements(): void {
      this.updatableElements = {};

      for (const key in this.refs) {
        if (this.refs[key]) {
          this.updatableElements[key] = this.refs[key] as HTMLElement;
          console.log(`[${this.tagName}] Added data-ref element for key: "${key}"`)
        }
      }

      for (const slotName in this.slots) {
        const slot = this.slots[slotName];
        const assignedElements = slot.assignedElements();

        assignedElements.forEach(el => {
          if (el.hasAttribute('data-projected')) {
            const projectedKey = el.getAttribute('data-projected')!;
            this.updatableElements[projectedKey] = el as HTMLElement | HTMLAnchorElement;
            // Debug: this.logger.log(`[${this.tagName}] Added direct slotted data-projected element for key: "${projectedKey}`)
          }

          const nestedProjectedElements = el.querySelectorAll('[data-projected]') as NodeListOf<HTMLElement>;
          nestedProjectedElements.forEach(projectedEl => {
            const projectedKey = projectedEl.getAttribute('data-projected')!;
            if (projectedKey) {
              this.updatableElements[projectedKey] = projectedEl as HTMLElement;
              // Debug: this.logger.log(`[${this.tagName}] Added nested slotted data-projected element for key: ${projectedKey}"`)
            }
          });
        });
      }
      console.log(`[${this.tagName}] Total updatable elements collected ${Object.keys(this.updatableElements).length}`)
    }


    disconnectedCallback(): void {
      if (super.disconnectedCallback) {
        super.disconnectedCallback();
      }
      console.log(`[${this.tagName}] Disconnected.`)
    }
  }
  return ElementalWebComponentClass;
}