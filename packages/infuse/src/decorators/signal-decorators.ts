import type { Signal } from "@imbui/pulse";
import { signal } from "@imbui/pulse";

/**
 * Decorator to automatically initialize a class field as a Signal.
 * Usage: Legacy, use signalAccessor() instead.
 * @signalProperty(initialValue)
 * public myProp!: Signal<Type>;
 */
export function signalProperty<T>(initialValue: T) {
  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): (this: any) => Signal<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function (this: any) {
      const newSignal = signal(initialValue);
      return newSignal;
    };
  };
}

export function signalAccessor<T>(initialValue: T) {
  return <This extends object>(
    _target: ClassAccessorDecoratorTarget<This, T>,
    context: ClassAccessorDecoratorContext<This, T>
  ): ClassAccessorDecoratorResult<This, T> => {
    const propName = String(context.name);
    console.log(`Decorating property: ${propName}`);

    let _signalInstance: Signal<T>;

    context.addInitializer(function (this: This) {
      _signalInstance = signal(initialValue);
      console.log(`Initialized signal for ${propName} on instance:`, _signalInstance);
    });
    /** The getter for the decorated property.
     * When `instance.myProp` is accessed, this method runs.
     */
    return {
      get(): T {
        console.log(`Getting value for ${propName}:`, _signalInstance.get());
        return _signalInstance.get();
      },

      /**
       * The setter for the decorated property.
       * When `instance.myProp = value` is assigned, this method runs.
       */
      set(value: T): void {
        console.log(`Setting value for ${propName}:`, value);
        _signalInstance.set(value);
      }
    }
  }
}