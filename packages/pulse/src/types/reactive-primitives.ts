//reactive primitive types

//Signal type primitive
export type Signal<T> = {
  get: () => T;
  set: (value: T) => void;
  update: (updater: (prev: T) => T) => void;
}

export type Computed<T> = {
  get(): T;
  cleanup(): void;
}

//Effect function type primitive
export type EffectFn = () => void;

//Effect runner & dependencies type union—
//Implemented by `effect` function
//Sets up dependency tracking for the subscribed effect
export type EffectRunner = EffectFn & {
  deps: Set<Set<EffectRunner>>;
};



