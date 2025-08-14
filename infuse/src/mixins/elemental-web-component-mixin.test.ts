import { describe, it, expect, beforeEach, afterEach, vi, MockInstance } from "vitest";
import { ElementalWebComponentMixin } from "./elemental-web-component-mixin";

class MockBaseElement extends HTMLElement {
  connectedCallback() { }
  disconnectedCallback() { }
}

class TestComponent extends ElementalWebComponentMixin(MockBaseElement) {
  constructor() {
    super();
  }
}
window.customElements.define('test-component', TestComponent);

describe('ElementalWebComponentMixin Unit Tests', () => {
  let component: TestComponent;
  const lightStructure = `
  <div id='light-dom'>
    <ul data-projected='ul-light-el'>
      <span>test</span>
      <li><slot name='one'></slot></li>
      <li><slot name='two'></slot>
    </ul>
  </div>
  `;
  const shadowSlots = `
    <div id='shadow-slots' slot='two'>
      <slot name='three'></slot>
      <slot name='four'></slot>
    </div>
  `;
  const shadowFull = `
  <div id='shadow-full' slot='four'>
    <section data-ref='shadow-section'></section>
    <slot name='five'></slot>
  </div>
  `;
  //const defaultSlot = document.createElement('slot');

  const templateMap = new Map([
    ['lightStructureKey', lightStructure],
    ['shadowSlotsKey', shadowSlots],
    ['shadowFullKey', shadowFull],
  ]);

  let consoleWarnSpy: MockInstance;
  beforeEach(() => {
    
    component = document.createElement('test-component') as TestComponent;
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    //connectedCallbackSpy = vi.spyOn(MockBaseElement.prototype, 'connectedCallback');
    //disconnectedCallbackSpy = vi.spyOn(MockBaseElement.prototype, 'disconnectedCallback');
  });

  afterEach(() => {
    component.remove();
    vi.restoreAllMocks();
  })

  it('should register templates correctly and handle overwrites', () => {
    component.registerTemplates(templateMap);
    expect(component._rawTemplates.get('lightStructureKey')).toBe(templateMap.get('lightStructureKey'));
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    const overwriteMap = new Map([['lightStructureKey', '<p>overwritten</>']]);
    component.registerTemplates(overwriteMap);
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(component!._rawTemplates!.get('lightStructureKey')).toBe(overwriteMap.get('lightStructureKey'));
  });

  it('should get a cloned template fragment or throw an error if not found', () => {
    component.registerTemplates(templateMap);

    const fragment = component.getClonedTemplate('lightStructureKey');
    expect(fragment).toBeInstanceOf(DocumentFragment);

    expect(() => component.getClonedTemplate('non-existent')).toThrowError();
  });

  it('should cache elements from the shadowRoot', () => {
    const shadowRoot = component.attachShadow({ mode: 'open' });
    component.registerTemplates(templateMap);
    const fragment = component.getClonedTemplate('lightStructureKey');
    component.append(fragment);
    const shadowFragment = component.getClonedTemplate('shadowSlotsKey');
    shadowRoot.append(shadowFragment);
    const shadow = component.getClonedTemplate('shadowFullKey');
    shadowRoot.append(shadow);

    component.cacheShadowElements();

    expect(component.refs['shadow-section']).toBeInstanceOf(HTMLElement);
    expect(component.slots['five']).toBeInstanceOf(HTMLSlotElement)
  })
})