export class LoggerService {
  log(...args: any[]) {
    console.log("[LOG]", ...args);
  }

  warn(...args: any[]) {
    console.warn("[WARN]", ...args);
  }

  error(...args: any[]) {
    console.error("[ERROR]", ...args);
  }

  debug(...args: any[]) {
    if (import.meta.env.DEV) console.debug("[DEBUG]", ...args); //need to review vite.config and d.ts, as well as package.json
  }

  scope(scopeName: string): ScopedLogger {
    return new ScopedLogger(scopeName, this);
  }
}

class ScopedLogger {
  constructor (
    private scopeName: string,
    private logger: LoggerService
  ) {}

  log(...args: any[]) {
    this.logger.log(`[${this.scopeName}]`, ...args);
  }
  warn(...args: any[]) {
    this.logger.warn(`[${this.scopeName}]`, ...args);
  }
  error(...args: any[]) {
    this.logger.error(`[${this.scopeName}]`, ...args);
  }
  debug(...args: any[]) {
    this.logger.log(`[${this.scopeName}]`, ...args);
  }
}