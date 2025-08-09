import { CustomElementLifecycleMethods } from "../mixins/types";
import type { Signal } from "@imbui/pulse";

interface ReactiveWebComponentInterface {
  registerAttributeObserver(attribute: string, handler: (value: string | null) => void): void;
  _registerReactiveSignal<PropType>(propName: PropertyKey, initialValue: PropType): Signal<PropType>;
  _getReactiveSignal<PropType>(propName: PropertyKey): Signal<PropType> | undefined;
  createEffect(callback: () => void): void;
  disconnectEffect(cleanupFn: () => void): void;
}

interface AttributeMethods {
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string, value: string): void;
  hasAttribute(name: string): boolean;
  getAttribute(name: string): string | null;
}

type WebComponentInstance = HTMLElement & ReactiveWebComponentInterface & AttributeMethods & CustomElementLifecycleMethods & { [key: string]: any };


// This is a decorator function for reflecting attributes to and from the DOM in web components, in vite dev, 'ES2022' is needed for esbuild.target in defineConfig
export function attribute(attributeName?: string, typeHint: 'boolean' | 'string' = 'string') {
  return <T extends WebComponentInstance, Value>(
    target: ClassAccessorDecoratorTarget<T, Value>,
    context: ClassAccessorDecoratorContext<T, Value>
  ): ClassAccessorDecoratorResult<T, Value> => {
    const propKey = String(context.name);
    const attrName = attributeName || propKey;

    return {

      get() {
        if (typeHint === 'boolean') {
          return this.hasAttribute(attrName) as Value;
        }
        return this.getAttribute(attrName) as Value;
      },
      set(value: Value) {
        if (typeHint === 'boolean') {
          if (value) {
            this.setAttribute(attrName, '');
          } else {
            this.removeAttribute(attrName);
          }
        } else {
          if (value === null || value === undefined) {
            this.removeAttribute(attrName);
          } else {
            this.setAttribute(attrName, String(value));
          }
        }
      },

    };
  };
}


/**
 * Custom Element accessor decorator. This decorator must be used in conjuction with the ReactiveWebComponentMixin
 * @param attributeName The reactive attribute to sync with an internal signal instance.
 * @param options An options object with props `typeHint?:` string literals `'boolean' | 'string'`, `reflect?: boolean` Whether to reflect signal changes to HTML DOM attributes, `observe?: boolean` Whether to observe the DOM attribute and update it's synced signal when changed.
 * @returns A signal accessor for reactive attribute syncing
 */
export function attributeSignal<T>(
  attributeName?: string,
  options: {
    typeHint?: 'boolean' | 'string';
    reflect?: boolean;
    observe?: boolean
  } = {}
) {
  const { typeHint = 'string', reflect = true, observe = true } = options;

  return <This extends WebComponentInstance>(
    _target: ClassAccessorDecoratorTarget<This, T>,
    context: ClassAccessorDecoratorContext<This, T>
  ): ClassAccessorDecoratorResult<This, T> => {
    const propName = String(context.name);
    const attrName = attributeName || propName;

    let originalInitialValue: T;

    context.addInitializer(function (this: This) {
      originalInitialValue = this[propName] as T;


      this._registerReactiveSignal<T>(propName, originalInitialValue);

      if (reflect) {
        this.createEffect(() => {
          const signalValue = this._getReactiveSignal<T>(propName)!.get();
          if (typeHint === 'boolean') {
            if (signalValue) {
              this.setAttribute(attrName, '');
            } else {
              this.removeAttribute(attrName);
            }
          } else {
            if (signalValue === null || signalValue === undefined || String(signalValue) === '') {
              this.removeAttribute(attrName);
            } else {
              this.setAttribute(attrName, String(signalValue));
            }
          }
        });
      }


      if (observe) {
        this.registerAttributeObserver(attrName, (newValue) => {
          const parsedValue = typeHint === 'boolean' ? (newValue !== null) : newValue;
          const instanceSignal = this._getReactiveSignal<T>(propName);
          if (instanceSignal && !Object.is(instanceSignal.get(), parsedValue)) {
            instanceSignal.set(parsedValue as T);
          }
        });
      }

      const Ctor = this.constructor as typeof HTMLElement & {
        observedAttributes: string[]
      };
      if (!Ctor.observedAttributes.includes(attrName)) {
        Ctor.observedAttributes.push(attrName);
      }
    });



    return {
      get(): T {
        const instanceSignal = this._getReactiveSignal<T>(propName);
        if (!instanceSignal) {
          console.error(`ERROR: Accessor for '${String(propName)}' called before signal was registered by decorator initializer. Returning initial default value.`);
          return originalInitialValue;
        }
        return instanceSignal.get();
      },
      set(value: T): void {
        const instanceSignal = this._getReactiveSignal<T>(propName);
        if (!instanceSignal) {
          console.error(`ERROR: Set for accessor '${String(propName)}' called before signal was registered. Attempting to lazily initialize with new value.`);
          this._registerReactiveSignal<T>(propName, value);
          return;
        }
        instanceSignal?.set(value);
      }
    }
  }
}