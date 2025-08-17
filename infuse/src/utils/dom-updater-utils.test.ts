import { createDomUpdater, DomUpdater } from "./dom-updater-utils";
import { ElementalWebComponentMixin } from "../mixins";
import { describe, it, expect } from "vitest";

describe('Dom Updater Utility unit tests', () => {
  const testTemplate = `
    <div data-ref='test'>Test01</div>
  `
  class TestComponent extends ElementalWebComponentMixin(HTMLElement) {
    domUpdater!: DomUpdater;
    constructor(){
      super();
      this.registerTemplates( new Map([
        ['testKey', testTemplate]
      ]));
      this.attachShadow({ mode: 'open' });
    }
    connectedCallback(): void {
      super.connectedCallback?.();
      const fragment = this.getClonedTemplate('testKey');
      this.shadowRoot?.append(fragment);

      
      this.cacheShadowElements();
      this.collectUpdatableElements();
      const updatableElements = this.updatableElements;

      //initialize a dom updater instance for the component
      this.domUpdater = createDomUpdater({ elementsMap: updatableElements });
    }
    disconnectedCallback(): void {
      super.disconnectedCallback?.();
    }

    // an update function
    update() {
      this.domUpdater.updateText('test', 'Overwritten');
    }
  }
  window.customElements.define('test-component', TestComponent);

  const component = document.createElement('test-component') as TestComponent;
  document.body.append(component);


  it('should take a keyed element as input and run the associated callback', () => {
    const test = component.shadowRoot?.querySelector('[data-ref="test"]');
    expect(test).toBeInstanceOf(HTMLElement);
    expect(test?.textContent).toBe('Test01');

    component.update();

    expect(test).toBeInstanceOf(HTMLElement);
    expect(test?.textContent).toBe('Overwritten');
  }) 

})