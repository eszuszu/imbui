export function withDisposer<T>(
  scope: (stack: AsyncDisposableStack) => Promise<T> | T
): Promise<T> | T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ADS = (globalThis as any).AsyncDisposableStack;
  if (typeof ADS === 'function') {
    const stack = new ADS();
    try {
      const result = scope(stack);

      if (result instanceof Promise) {
        return result.finally(() => stack.disposeAsync());
      }
      stack.disposeAsync();
      return result;
    } catch (err) {
      stack.disposeAsync();
      throw err;
    }
  }

  return scope({
    defer() {},
    adopt() {},
    use() {},
    disposeAsync() { return Promise.resolve(); }
  } as unknown as AsyncDisposableStack);
}