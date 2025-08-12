import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WebComponentConstructor } from './types';
import { ReactiveWebComponentMixin } from './reactive-web-component-mixin';

class ReactiveTestComponent extends ReactiveWebComponentMixin<WebComponentConstructor>(HTMLElement) {
  constructor() {
    super();
    this._registerReactiveSignal('count', 0);
  }
  
  connectedCallback() {
    super.connectedCallback();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
}

const testTag = 'reactive-test-component';
window.customElements.define(testTag, ReactiveTestComponent);

vi.useFakeTimers();


describe('ReactiveWebComponentMixin Lifecycle Integration', () => {
  let component: ReactiveTestComponent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let effectSpy: any;

  beforeEach(() => {
    component = document.createElement(testTag) as ReactiveTestComponent;
    effectSpy = vi.fn();
  });

  it('should run an effect initially and on subsequent signal updates', async () => {
    const signal = component._getReactiveSignal('count');
    if (signal) {
      component.createEffect(() => {
        signal.get();
        effectSpy();
      });
    }
    expect(effectSpy).toHaveBeenCalledTimes(1);

    document.body.appendChild(component);


    signal!.set(1);
    await vi.runAllTimersAsync();
    expect(effectSpy).toHaveBeenCalledTimes(2);

    signal!.set(1);
    await vi.runAllTimersAsync();
    // The signal value is the same so the effect shouldn't have been called
    expect(effectSpy).toHaveBeenCalledTimes(2);
  });

  it('should clean up effects on disconnect', async () => {
    const signal = component._getReactiveSignal('count');
    component.createEffect(() => {
      signal!.get();
      effectSpy();
    });

    document.body.appendChild(component);
    await vi.runAllTimersAsync();
    expect(effectSpy).toHaveBeenCalledTimes(1);

    component.remove();

    signal!.set(2);
    await vi.runAllTimersAsync();
    // The effect cleanup should have removed the effect, the spy isn't called
    expect(effectSpy).toHaveBeenCalledTimes(1);
  });

});