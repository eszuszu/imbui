import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from "vitest";
import { signalAccessor } from "./signal-decorators";
import { ReactiveWebComponentMixin, WebComponentConstructor } from "../mixins";
import * as pulse from '@imbui/pulse';

class TestComponent extends ReactiveWebComponentMixin<WebComponentConstructor>(HTMLElement) {
  @signalAccessor(0)
  accessor count!: number;

  @signalAccessor('hello')
  accessor message!: string;

  @signalAccessor({ id: 1, name: 'test' })
  accessor obj!: { id: number; name: string };

  constructor() { super(); }
  connectedCallback() { super.connectedCallback?.(); }
  disconnectedCallback(): void { super.disconnectedCallback?.(); }
}
const testTag = 'test-component';
window.customElements.define(testTag, TestComponent);

describe('signalAccessor decorator', () => {
  let component: TestComponent;
  let signalSpy: MockInstance;

  beforeEach(() => {
    signalSpy = vi.spyOn(pulse, 'signal');

    component = document.createElement(testTag) as TestComponent;

  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize a signal for each decorated property with the correct initial value', () => {
    expect(signalSpy).toHaveBeenCalledTimes(3);

    expect(signalSpy).toHaveBeenCalledWith(0);
    expect(signalSpy).toHaveBeenCalledWith('hello');
    expect(signalSpy).toHaveBeenCalledWith({ id: 1, name: 'test' });
  });

  it('should get the value from the accessor, routing to the signal', () => {
    expect(component.count).toBe(0);
    component.count = 50;
    expect(component.count).toBe(50);
  });

  it('should set the value on the accessor, routing to the signal', () => {
    expect(component.message).toBe('hello');

    const newMessage = 'world';
    component.message = newMessage;

    expect(component.message).toBe(newMessage);
  });

  it('should work correctly with complex object types', () => {
    const initialObj = component.obj
    expect(initialObj).toEqual({ id: 1, name: 'test' });

    // A new object:
    const newObj = { id: 2, name: 'new-name' };
    component.obj = newObj;

    expect(component.obj).toEqual(newObj);
  });
});