// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = object> = new (...args: any[]) => T;

// Interface for Web Component lifecycle methods
export interface CustomElementLifecycleMethods {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  connectedMoveCallback?(): void;
  attributeChangedCallback?(name: string, oldValue: string | null, newValue: string | null): void;
  adoptedCallback?(): void;
}

export type WebComponentConstructor<T extends HTMLElement = HTMLElement> = Constructor<T & CustomElementLifecycleMethods>;

/**
 * @template TBase The constructor type of the class being extended by the mixin.
 * @template TResultInstance The type of the instance that the mixin adds to the base class, usually infered from mixin's class declaration.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MixinFunction<TBase extends Constructor<any>, TResultInstance extends object = object> = (base: TBase) => Constructor<InstanceType<TBase> & TResultInstance>;