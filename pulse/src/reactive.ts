import type { Signal, EffectFn, EffectRunner } from "./types/reactive-primitives";

//A pointer to the current effect and a closure over it's dependencies
let currentEffect: EffectRunner | null = null;
//

export function effect(fn: EffectFn): () => void {
  const runner: EffectRunner = (() => {
    //clear prior dependencies to prepare
    cleanup(runner);
    //set the current effect pointer to this effect
    currentEffect = runner;
    
    //Call the passed effect function
    try {
      fn()
    } finally {
      currentEffect = null;
    }
    //clear the currentEffect pointer
    currentEffect = null;
  }) as EffectRunner;

  //create new set for this effect's dependencies
  runner.deps = new Set();
  //call the effect runner function for initial setup and tracking
  runner();
  //run the cleanup function and return
  return () => cleanup(runner);
}
//cleanup function for reseting runners dependencies
function cleanup(runner: EffectRunner) {
  for (const dep of runner.deps) {
    dep.delete(runner);
  }
  runner.deps.clear();
}

//Factory function to create a new signal
//Takes an initial value, returns a Signal instance
//
export function signal<T>(initial: T): Signal<T> {
  //The initial signal value used when setting
  let value = initial;
  //The effect functions subscribed to the signal
  const subscribers = new Set<EffectRunner>();

  //if an effect is active, add itself to the signals subscribers *adds this signals subscribers set to its own deps* for later cleanup.
  function read(): T {
    if (currentEffect) {
      subscribers.add(currentEffect);
      currentEffect.deps.add(subscribers);
    }
    return value;
  }

  function write(next: T){
    if (Object.is(value, next)) return;

    value = next;
    // copies subscribers first & re-runs all subscribers
    for (const fn of [...subscribers]) {
      fn();
    }
  }

  return {
    get: read,
    set: write,
    update(updater: (prev: T) => T) {
      write(updater(value));
    }
  }
}

//basic computed incapsulated signal subscribes to internal signal w/ effect.
export function computed<T>(fn: () => T) {
  const initialValue = fn();
  const internal = signal<T>(initialValue);
  effect(
    () => internal.set(fn())
  );
  return {
    get: internal.get
  };
}