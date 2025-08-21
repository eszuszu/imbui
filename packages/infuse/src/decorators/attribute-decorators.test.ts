import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import { attribute, attributeSignal } from './attribute-decorators';
import { WebComponentConstructor } from '../mixins';
import { ReactiveWebComponentMixin } from '../mixins';

vi.useFakeTimers();

// Single component class with all decorators for testing purposes
class TestComponent extends ReactiveWebComponentMixin<WebComponentConstructor>(HTMLElement) {
  @attribute('test-string', 'string')
  accessor testString = 'initial-string';

  @attribute('test-boolean', 'boolean')
  accessor testBoolean = false;

  @attributeSignal('signal-string-attr', { reflect: true, observe: true })
  accessor signalString = 'initial-signal-string';

  @attributeSignal('signal-boolean-attr', { reflect: true, observe: true, typeHint: 'boolean' })
  accessor signalBoolean = false;

  constructor() { super(); }
  connectedCallback() { super.connectedCallback?.(); }
  disconnectedCallback(): void { super.disconnectedCallback?.(); }
}
const testTag = 'test-component';
window.customElements.define(testTag, TestComponent);

describe('Decorators Unit Tests', () => {
  let component: TestComponent;
  let setAttributeSpy: MockInstance;
  let removeAttributeSpy: MockInstance;
  let hasAttributeSpy: MockInstance;
  let getAttributeSpy: MockInstance;
  let createEffectSpy: MockInstance;
  let registerAttributeObserverSpy: MockInstance;

  beforeEach(() => {
    createEffectSpy = vi.spyOn(TestComponent.prototype, 'createEffect');
    registerAttributeObserverSpy = vi.spyOn(TestComponent.prototype, 'registerAttributeObserver');

    component = document.createElement(testTag) as TestComponent;

    setAttributeSpy = vi.spyOn(component, 'setAttribute');
    removeAttributeSpy = vi.spyOn(component, 'removeAttribute');
    hasAttributeSpy = vi.spyOn(component, 'hasAttribute');
    getAttributeSpy = vi.spyOn(component, 'getAttribute');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('@attribute decorator', () => {
    it('should get a string attribute from the DOM', () => {
      component.setAttribute('test-string', 'new-value');
      getAttributeSpy.mockReturnValue('new-value');
      expect(component.testString).toBe('new-value');
      expect(getAttributeSpy).toHaveBeenCalledWith('test-string');
    });

    it('should set a string attribute on the DOM', () => {
      const newValue = 'updated-value';
      component.testString = newValue;
      expect(setAttributeSpy).toHaveBeenCalledWith('test-string', newValue);
    });

    it('should remove an attribute if a string value is null or undefined', () => {
      component.setAttribute('test-string', 'to-be-removed');
      setAttributeSpy.mockClear();
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      component.testString = null as any;
      expect(removeAttributeSpy).toHaveBeenCalledWith('test-string');
    });

    it('should get a boolean attribute from the DOM (exists vs not)', () => {
      component.setAttribute('test-boolean', '');
      expect(component.testBoolean).toBe(true);
      expect(hasAttributeSpy).toHaveBeenCalledWith('test-boolean');
      hasAttributeSpy.mockClear();
      component.removeAttribute('test-boolean');
      expect(component.testBoolean).toBe(false);
      expect(hasAttributeSpy).toHaveBeenCalledWith('test-boolean');
    });

    it('should set a boolean attribute on the DOM', () => {
      component.testBoolean = true;
      expect(setAttributeSpy).toHaveBeenCalledWith('test-boolean', '');
    });

    it('should remove a boolean attribute from the DOM if value is false', () => {
      component.setAttribute('test-boolean', '');
      removeAttributeSpy.mockClear();
      component.testBoolean = false;
      expect(removeAttributeSpy).toHaveBeenCalledWith('test-boolean');
    });
  });

  describe('@attributeSignal decorator', () => {
    
    it('should call createEffect to reflect signal changes', () => {
      // The initializer for the decorator should have called this
      // one time for each decorated property
      expect(createEffectSpy).toHaveBeenCalledTimes(2);
    });

    it('should add the attributes to the observedAttributes static property', () => {
      const Ctor = TestComponent as typeof HTMLElement & { observedAttributes: string[] };
      expect(Ctor.observedAttributes).toContain('signal-string-attr');
      expect(Ctor.observedAttributes).toContain('signal-boolean-attr');
    });

    it('should reflect a string signal change to the DOM', async () => {
      // Re-create the component inside this test to capture the createEffect callback
      const effectCallback = vi.fn();
      createEffectSpy.mockImplementationOnce(callback => {
        effectCallback.mockImplementation(callback);
        return vi.fn();
      });
      component = document.createElement(testTag) as TestComponent;
      setAttributeSpy = vi.spyOn(component, 'setAttribute');

      const mockSignal = {
        get: vi.fn().mockReturnValue('updated-by-effect') 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      vi.spyOn(component, '_getReactiveSignal').mockReturnValue(mockSignal);

      effectCallback();
      await vi.runAllTimersAsync();
      expect(setAttributeSpy).toHaveBeenCalledWith('signal-string-attr', 'updated-by-effect');
    });

    it('should update the signal when attribute changes', async () => {
      const newAttributeValue = 'updated-by-dom';

      const mockSignal = {
        get: vi.fn().mockReturnValue('initial-value'),
        set: vi.fn(),
        update: vi.fn(),
      };

      vi.spyOn(component, '_getReactiveSignal').mockReturnValue(mockSignal);
      const attributeChangeHandler = registerAttributeObserverSpy.mock.calls[0][1];
      attributeChangeHandler(newAttributeValue);

      attributeChangeHandler();
      await vi.runAllTimersAsync();
      expect(mockSignal.set).toHaveBeenCalledWith(newAttributeValue);
    });
  });
});