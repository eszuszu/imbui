import type { WebComponentConstructor } from "./types";
import { signal, effect, computed } from "@imbui/pulse";
import type { Signal } from "@imbui/pulse";


export const ReactiveWebComponentMixin = <TBase extends WebComponentConstructor>(Base: TBase) => {

  class ReactiveWebComponentClass extends Base {
    static observedAttributes: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public _reactiveSignals = new Map<PropertyKey, Signal<any>>();
    public _attributeObservers = new Map<string, (value: string | null) => void>();
    //a Set for the unsubscribe—i.e. `cleanup()`—function for effects
    public _effectCleanups: Set<() => void> = new Set();

    declare logger: Console | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      this.logger = this.logger ?? console;
    }
    _registerReactiveSignal<PropType>(propName: PropertyKey, initialValue: PropType): Signal<PropType> {
      if (!this._reactiveSignals.has(propName)) {
        this._reactiveSignals.set(propName, signal(initialValue));
      }
      return this._reactiveSignals.get(propName) as Signal<PropType>;
    }
    
    _getReactiveSignal<PropType>(propName: PropertyKey): Signal<PropType> | undefined {
      return this._reactiveSignals.get(propName) as Signal<PropType>;
    }

    public delegateAttributeChange(name: string, oldValue: string | null, newValue: string | null) {
      const handler = this._attributeObservers.get(name);
      if (handler && oldValue !== newValue) {
        handler(newValue);
      }
    }

    registerAttributeObserver(attribute: string, handler: (value: string | null) => void) {
      this._attributeObservers.set(attribute, handler);
    }

    //helper method for component authors to create effects
    createEffect(callback: () => void): void {
      const cleanupFn = effect(callback);
      this._effectCleanups.add(cleanupFn);
    }

    createComputed<T>(callback: () => T): { get: () => T } {
      const { get, cleanup } = computed(callback);
      this._effectCleanups.add(cleanup);
      return { get };
    }

    connectedCallback() {
      super.connectedCallback?.();
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
      this.delegateAttributeChange(name, oldValue, newValue);
      super.attributeChangedCallback?.(name, oldValue, newValue);
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();

      this._effectCleanups.forEach(cleanup => cleanup());
      this._effectCleanups.clear();
      this.logger?.log(`[${this.tagName.toLowerCase()}] ReactiveMixin: Cleaned up effects`);
    }

    //method to manually disconnect effect if effect is dynamic
    disconnectEffect(cleanupFn: () => void) {
      cleanupFn();
      this._effectCleanups.delete(cleanupFn);
    }
  }
  return ReactiveWebComponentClass;
};