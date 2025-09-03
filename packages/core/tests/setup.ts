/*eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Pollyfill shim for the AsyncDisposableStack part of the ERM dispose protocol
 */
if (!(globalThis as any).AsyncDisposableStack) {
  class FakeADS {
    private callbacks: (() => unknown | Promise<unknown>)[] = [];
    defer(cb: () => unknown | Promise<unknown>) {
      this.callbacks.push(cb);
    }
    adopt<T>(value: T, disposer: (value: T) => unknown | Promise<unknown>): T {
      this.callbacks.push(() => disposer(value));
      return value;
    }
    use<T extends { [Symbol.asyncDispose]?(): unknown | Promise<unknown> }>(value: T): T {
      if (value?.[Symbol.asyncDispose]) {
        this.callbacks.push(() => value[Symbol.asyncDispose]!());
      }
      return value;
    }
    async disposeAsync() {
      for (const cb of this.callbacks.reverse()) {
        await cb();
      }
    }
  }

  ; (globalThis as any).AsyncDisposableStack = FakeADS;
}

//dispose shim
// Define symbols if missing
if (!(Symbol as any).dispose) {
  (Symbol as any).dispose = Symbol("Symbol.dispose");
}
if (!(Symbol as any).asyncDispose) {
  (Symbol as any).asyncDispose = Symbol("symbol.asyncDispose");
}

//Patch global so `using` / `await using` can be faked
// Helpers~

(globalThis as any).usingShim = async function <T extends { [Symbol.dispose]?: () => void }> (
  resource: T,
  fn: (res: T) => any
) {
  try {
    return fn(resource);
  } finally {
    await resource?.[Symbol.dispose]?.();
  }
};

(globalThis as any).awaitUsingShim = async function <T extends { [Symbol.asyncDispose]?: () => Promise<void> }>(
  resource: T,
  fn: (res: T) => Promise<any>
) {
  try {
    return await fn(resource);
  } finally {
    await resource?.[Symbol.asyncDispose]?.();
  }
};