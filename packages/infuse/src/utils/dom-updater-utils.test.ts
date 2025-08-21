import { createDomUpdater, DomUpdater } from "./dom-updater-utils";
import { ElementalWebComponentMixin } from "../mixins";
import { describe, it, expect } from "vitest";

describe('Dom Updater Utility unit tests', () => {
  const testTemplate = `
    <div data-ref='test'>Test01</div>
  `
  const listTemplate = `
    <ul data-ref='test-list'>
    </ul>
  `
  class TestComponent extends ElementalWebComponentMixin(HTMLElement) {
    domUpdater!: DomUpdater;
    constructor(){
      super();
      this.registerTemplates( new Map([
        ['testKey', testTemplate],
        ['testList', listTemplate]
      ]));
      this.attachShadow({ mode: 'open' });
    }
    connectedCallback(): void {
      super.connectedCallback?.();
      const fragment = this.getClonedTemplate('testKey');
      const list = this.getClonedTemplate('testList');
      this.shadowRoot?.append(fragment);
      this.shadowRoot?.append(list);
      
      this.cacheShadowElements();
      this.collectUpdatableElements();
      const updatableElements = this.updatableElements;

      //initialize a dom updater instance for the component
      this.domUpdater = createDomUpdater({ elementsMap: updatableElements });
    }
    disconnectedCallback(): void {
      super.disconnectedCallback?.();
    }

  }
  window.customElements.define('test-component', TestComponent);

  const component = document.createElement('test-component') as TestComponent;
  document.body.append(component);


  describe ('updateText function', () => {

    it('should take a keyed element as input and update the elements textContent', () => {
      const test = component.shadowRoot?.querySelector('[data-ref="test"]');
      expect(test).toBeInstanceOf(HTMLElement);
      expect(test?.textContent).toBe('Test01');
  
      component.domUpdater.updateText('test', 'Overwritten')
  
      expect(test).toBeInstanceOf(HTMLElement);
      expect(test?.textContent).toBe('Overwritten');
    });

    it('should correctly handle null, undefined, or empty strings as values', () => {
      const test = component.shadowRoot?.querySelector('[data-ref="test"]');
      expect(test?.textContent).toBe('Overwritten');
      const empty = '';
      const u = undefined;
      const n = null;

      component.domUpdater.updateText('test', empty);
      expect(test?.textContent).toBe('');
      
      component.domUpdater.updateText('test', u);
      expect(test?.textContent).toBe('');
      
      component.domUpdater.updateText('test', n);
      expect(test?.textContent).toBe('');
    });

  });

  describe('updateList function', () => {
    
    const test = component.shadowRoot?.querySelector('[data-ref="test-list"]');
    expect(test).toBeInstanceOf(HTMLElement);

    const cached = component.updatableElements['test-list'];
    it('should correctly render a fallback "None" list item when the list is empty', () => {
      
      component.domUpdater.updateList('test-list', [], 'Test List', () => document.createElement('li'));
      expect(cached).toBeInstanceOf(HTMLUListElement);
      
      expect(cached.firstElementChild).toBeInstanceOf(HTMLSpanElement);
      expect(cached.lastElementChild).toBeInstanceOf(HTMLLIElement);
      expect(cached.lastElementChild!.textContent).toBe('None');
    });

    it('should render the correct number of items to the list', () => {
      type testItem = string | HTMLDivElement;
      const item4 = document.createElement('div');
      const newList: testItem[] = ['item1', 'item2', 'item3', item4];
      component.domUpdater.updateList(
        'test-list',
        newList,
        'Updated List',
        (item: testItem) => {
          const li = document.createElement('li');
          if (item instanceof HTMLElement){
            li.append(item);
          } else if (typeof item === 'string'){
            li.textContent = item;
          }
          return li;
        }
      );

      expect(cached.getElementsByTagName('li').length).toBe(4);
    });

    it('should gracefully handle null or undefined values in the items array', () => {
      type testItem = undefined | null | string 
      const newList: testItem[] = [undefined, null, null, 'item1'];
      component.domUpdater.updateList(
        'test-list',
        newList,
        'Updated List',
        (item: testItem) => {
          const li = document.createElement('li');
          if (item) {
            li.append(item);
          }
          return li;
        }
      );
      const updatedItems = cached.querySelectorAll('li');
      expect(updatedItems[0].textContent).toBe('');
      expect(updatedItems[1].textContent).toBe('');
      expect(updatedItems[2].textContent).toBe('');
      expect(updatedItems[3].textContent).toBe('item1');
    });
  });

});