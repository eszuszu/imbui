export async function withDisposer<T>(
  scope: (stack: AsyncDisposableStack) => Promise<T>
): Promise<T> {
  await using stack = new AsyncDisposableStack();
  return await scope(stack);
}