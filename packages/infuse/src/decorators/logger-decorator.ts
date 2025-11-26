export interface Logger {
  log(message: unknown): void;
  info(message: unknown): void;
  warn(message: unknown): void;
  error(message: unknown): void;
  debug(message: unknown): void;
}
export function logged(logger: Logger) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function decorator<This, Args extends any[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
    ) {
  
    function replacement(this: This, ...args: Args){
      logger.log(`[${String(context.name)}] called, head before...`);
      const result = target.call(this, ...args);
      logger.log(`[${String(context.name)}] tail of call.`);
      return result;
    }
    return replacement;
  }
}