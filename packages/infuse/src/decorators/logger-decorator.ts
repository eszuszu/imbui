// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logged<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
  ) {

  function replacement(this: This, ...args: Args) {
    console.log(`[${String(context.name)}] called, head before...`);
    target.call(this, ...args);
    console.log(`[${String(context.name)}] tail of call.`);
    return target;
  }
  return replacement;
}