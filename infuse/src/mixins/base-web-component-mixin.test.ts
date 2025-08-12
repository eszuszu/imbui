import { describe, it, expect, vi } from 'vitest';
import { WebComponentConstructor } from './types';
import { BaseWebComponentMixin } from './base-web-component-mixin';



describe('BaseWebComponentMixin', () => {
  class TestComponent extends BaseWebComponentMixin<WebComponentConstructor>(HTMLElement) {
    connectedCallback(): void {
      super.connectedCallback?.();
    }
    disconnectedCallback(): void {
      super.disconnectedCallback?.()
    }
  }
  window.customElements.define('test-component', TestComponent);

  it('should attach an open shadowRoot', () => {
    const element = document.createElement('test-component');

    const shadow: ShadowRoot | null = element.shadowRoot;

    expect(shadow).toBeInstanceOf(ShadowRoot);
    expect(element.shadowRoot?.mode).toBe('open');

    element.remove();
  });

  it('should connect to the DOM', () => {
    const element = document.createElement('test-component');
    document.body.appendChild(element);
    expect(element.isConnected).toBe(true);

    element.remove();
  });

  it('should disconnect from the DOM', () => {
    const element = document.createElement('test-component');
    document.body.appendChild(element);

    expect(element.isConnected).toBe(true);

    element.remove();

    expect(element.isConnected).toBe(false);
  });

  it('should set adoptedStyleSheets on the shadowRoot', () => {
    const element = document.createElement('test-component') as TestComponent;

    const mockStyleSheet = new CSSStyleSheet();

    element.adoptedStyleSheets = [mockStyleSheet];

    expect(element.shadowRoot.adoptedStyleSheets).toContain(mockStyleSheet);
  });
});

describe('BaseWebComponentMixin lifecycle methods with spies', () => {
  it('should call connectedCallback when appended to the DOM', () => {
    // Define and register the component inside the 'it' block
    class ComponentToSpyOn extends BaseWebComponentMixin<WebComponentConstructor>(HTMLElement) {
      connectedCallback(): void {
        super.connectedCallback?.();
      }
      disconnectedCallback(): void {
        super.disconnectedCallback?.();
      }
    }
    
    const connectedCallbackSpy = vi.spyOn(ComponentToSpyOn.prototype, 'connectedCallback');
    const tagName = 'test-component-connected';
    window.customElements.define(tagName, ComponentToSpyOn);

    const element = document.createElement(tagName);
    expect(connectedCallbackSpy).not.toHaveBeenCalled();

    document.body.appendChild(element);
    expect(connectedCallbackSpy).toHaveBeenCalledTimes(1);

    element.remove();
  });

  it('should call disconnectedCallback when removed from the DOM', () => {
    class ComponentToSpyOn extends BaseWebComponentMixin<WebComponentConstructor>(HTMLElement) {
      connectedCallback(): void {
        super.connectedCallback?.();
      }
      disconnectedCallback(): void {
        super.disconnectedCallback?.();
      }
    }
    
    const disconnectedCallbackSpy = vi.spyOn(ComponentToSpyOn.prototype, 'disconnectedCallback');
    
    const tagName = 'test-component-disconnected';
    window.customElements.define(tagName, ComponentToSpyOn);
    const element = document.createElement(tagName);
    document.body.appendChild(element);

    expect(disconnectedCallbackSpy).not.toHaveBeenCalled();

    element.remove();
    expect(disconnectedCallbackSpy).toHaveBeenCalledTimes(1);
  });
});