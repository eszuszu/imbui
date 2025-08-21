import { describe, it, expect, beforeEach, afterEach, vi, MockInstance } from "vitest";
import { ElementalWebComponentMixin } from "./elemental-web-component-mixin";

// Most tests are self described and assert the mixins interoperability
// with lifecycle methods, comments to elaborate on some setup.
describe('ElementalWebComponentMixin Unit Tests', () => {
  //Arranging mocks and dependencies

  /**
   * A mock base element to use for verifying lifecycle methods
   * propogate up the inheritance chain.
   */
  class MockBaseElement extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() { }
    disconnectedCallback() { }
  }

  /**
   * This will be the core test component definition.
   */
  class TestComponent extends ElementalWebComponentMixin(MockBaseElement) {
    constructor() {
      super();
    }
    connectedCallback() {
      super.connectedCallback?.();
    }
    disconnectedCallback() {
      super.disconnectedCallback?.();
    }
  }

  /**
   * A generic class for testing parent child relationships
   */
  class ParentComponent extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() { }
    disconnectedCallback() { }
  }
  window.customElements.define('parent-component', ParentComponent);
  window.customElements.define('test-component', TestComponent);

  let component: TestComponent;

  // Arranging some mock template literals with data-projected,
  // data-ref, and HTML slot elements with accompanying ingress tags
  // that are located in one of the other templates to test element
  // slotting and element reference caching behavior
  const lightStructure = `
  <div id='light-dom'>
    <ul data-projected='ul-light-el'>
      <span>test</span>
      <li><slot name='one'></slot></li>
      <li><slot name='two'></slot></li>
    </ul>
  </div>
  `;
  const shadowSlots = `
    <div id='shadow-slots' slot='two' data-projected='slotted-light-el'>
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
  const elementWithComment = `
  <div id='comment-test'>
    <!-- This is a HTML comment node -->
  </div>
  `
  // A default slot to render to, in components with an open shadow
  const defaultSlot = document.createElement('slot') as HTMLSlotElement;

  // a map of the templates, ingested by the mixin,
  // will define it once here at the top of the tests.
  const templateMap = new Map([
    ['lightStructureKey', lightStructure],
    ['shadowSlotsKey', shadowSlots],
    ['shadowFullKey', shadowFull],
    ['commentedKey', elementWithComment]
  ]);

  // spies to watch the inherited lifecycle methods
  let connectedCallbackSpy!: MockInstance<() => void>;
  let disconnectedCallbackSpy!: MockInstance<() => void>;
  let consoleWarnSpy: MockInstance;

  /**
   * Settup and teardown of test components and mocks
   */
  beforeEach(() => {

    component = document.createElement('test-component') as TestComponent;
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

    connectedCallbackSpy = vi.spyOn(MockBaseElement.prototype, 'connectedCallback');
    disconnectedCallbackSpy = vi.spyOn(MockBaseElement.prototype, 'disconnectedCallback');
  });

  afterEach(() => {
    component.remove();
    vi.restoreAllMocks();
  });


  //Main tests start~
  /**
   * To be sure lifecycle methods work as intended
   */
  describe('Lifecycle Integrations', () => {
    let parent: ParentComponent;
    beforeEach(() => {
      parent = document.createElement('mock-parent') as ParentComponent;
      document.body.append(parent);
    });
    afterEach(() => {
      parent.remove();
      vi.restoreAllMocks();
    })

    it('should be able to be added via template literal to live DOM elements innerHTML and subsequently run its lifecycle methods', () => {
      const child = `
        <test-component>
        </test-component>
        `;
      expect(connectedCallbackSpy).not.toHaveBeenCalled();
      parent.innerHTML = child;

      // the tag is added to the live DOM via string or template literal the connectedCallback should fire.
      expect(connectedCallbackSpy).toHaveBeenCalledTimes(1);
      const testComponent = parent.children[0] as TestComponent;
      
      //it should disconnect
      expect(disconnectedCallbackSpy).not.toHaveBeenCalled();
      testComponent.remove();
      expect(disconnectedCallbackSpy).toHaveBeenCalledTimes(1);
    });
    
    it('should be able to be added via native createElement API', () => {

      const testChild = document.createElement('test-component') as TestComponent;

      expect(connectedCallbackSpy).not.toHaveBeenCalled();
      parent.appendChild(testChild);
      expect(connectedCallbackSpy).toHaveBeenCalledTimes(1);

      //it should also succefully disconnect
      expect(disconnectedCallbackSpy).not.toHaveBeenCalled();
      parent.removeChild(testChild);
      expect(disconnectedCallbackSpy).toHaveBeenCalledTimes(1);
      
    });
  });

  // Core mixin methods
  describe('ElementalWebComponentMixin methods', () => {

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

    it('should handle all node types, including comments, without errors', () => {
      const testTemplate = `
      <div>
        Wow
        <div><!-- Test Comment node --></div>
      </div>
      `
      const testMap = new Map([['key', testTemplate]]);
      component.registerTemplates(testMap);
      // test DOM selectors on clonedTemplates
      const nodes: DocumentFragment = component.getClonedTemplate('key');
      
      const allElementNodes = nodes.querySelectorAll('*');
      // Assert that we only have the two element nodes
      expect(allElementNodes.length).toBe(2);
      const innerDiv = allElementNodes[1];

      // Assert that there is the comment node
      expect(innerDiv.childNodes.length).toBe(1);
      expect(innerDiv.childNodes[0].nodeType).toBe(Node.COMMENT_NODE);
    });

    it('should cache elements from the shadowRoot', () => {
      //arranging all inner mock/test html elements and
      //appending them to the main test component
      const shadowRoot = component.attachShadow({ mode: 'open' });
      component.registerTemplates(templateMap);
      const fragment = component.getClonedTemplate('lightStructureKey');
      component.append(fragment);
      const shadowFragment = component.getClonedTemplate('shadowSlotsKey');
      shadowRoot.append(shadowFragment);
      const shadowChild = component.getClonedTemplate('shadowFullKey');
      shadowRoot.append(shadowChild);

      // the call in question
      component.cacheShadowElements();
      
      // assert that component element cache maps contain expected DOM
      // reference keys with cached HTML snapshot
      expect(component.refs['shadow-section']).toBeInstanceOf(HTMLElement);
      expect(component.slots['five']).toBeInstanceOf(HTMLSlotElement)
    });

    it('should collect all updatable elements when collectUpdatableElements is called.', () => {
      // attaching a shadowRoot to the test component
      // Arranging the templates for HTML fragments
      const shadowRoot = component.attachShadow({ mode: 'open' });
      component.registerTemplates(templateMap);
      const fragment = component.getClonedTemplate('lightStructureKey');
      shadowRoot.append(defaultSlot);
      component.append(fragment);
      const shadowFragment = component.getClonedTemplate('shadowSlotsKey');
      shadowRoot.append(shadowFragment);
      const shadowChild = component.getClonedTemplate('shadowFullKey');
      shadowRoot.append(shadowChild);

      // Caching references
      component.cacheShadowElements();
      component.collectUpdatableElements();

      // Asserting that both nested data-projected and nested data-ref
      // instance snapshots are cached
      expect(component.updatableElements['ul-light-el']).toBeInstanceOf(HTMLElement);
      expect(component.updatableElements['slotted-light-el']);
      expect(component.refs['shadow-section']).toBeInstanceOf(HTMLElement);
    });
  });
});