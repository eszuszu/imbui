export class LoggerService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public log(...args: any[]) {
    console.log("[LOG]", ...args);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public warn(...args: any[]) {
    console.warn("[WARN]", ...args);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public error(...args: any[]) {
    console.error("[ERROR]", ...args);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public debug(...args: any[]) {
    if (import.meta.env.DEV) console.debug("[DEBUG]", ...args);
  }

  public scope(scopeName: string): ScopedLogger {
    return new ScopedLogger(scopeName, this);
  }
}

class ScopedLogger {
  constructor(
    private scopeName: string,
    private logger: LoggerService
  ) { }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public log(...args: any[]) {
    this.logger.log(`[${this.scopeName}]`, ...args);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public warn(...args: any[]) {
    this.logger.warn(`[${this.scopeName}]`, ...args);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public error(...args: any[]) {
    this.logger.error(`[${this.scopeName}]`, ...args);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public debug(...args: any[]) {
    this.logger.debug(`[${this.scopeName}]`, ...args); // Corrected to use debug()
  }
}