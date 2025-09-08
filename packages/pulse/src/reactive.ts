import type { Signal, Computed, EffectFn, EffectRunner } from "./types/reactive-primitives";

//A pointer to the current effect and a closure over it's dependencies
let currentEffect: EffectRunner | null = null;
const pendingEffects = new Set<EffectRunner>();
let isFlushing = false;
//

// Function to run all pending effects in a single microtask
function flush() {
  if (isFlushing) {
    return;
  }
  isFlushing = true;
  Promise.resolve().then(() => {
    while (pendingEffects.size > 0) {
      const effectsToRun = [...pendingEffects];
      pendingEffects.clear();
      for (const runner of effectsToRun) {
        runner();
      }
    }
    isFlushing = false;
  });
}

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
  }) as EffectRunner;

  //create new set for this effect's dependencies
  runner.deps = new Set();

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

    for (const fn of subscribers) {
      pendingEffects.add(fn);
    }
    flush();
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
export function computed<T>(fn: () => T): Computed<T>{
  let value = fn();
  const internal = signal<T>(value);

  const cleanupFn = effect(() => {
    const newValue = fn();
    if (!Object.is(newValue, value)) {
      value = newValue;
      internal.set(value);
    }
  });

  return {
    get: internal.get,
    cleanup: cleanupFn
  };
}