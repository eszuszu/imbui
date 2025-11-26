/// <reference types="vite/client" />
/* eslint-disable
  @typescript-eslint/no-unused-vars,
  @typescript-eslint/no-explicit-any 
*/

export interface LogMethods {
  log?(...args: any[]): void;
  info?(...args: any[]): void;
  warn?(...args: any[]): void;
  error?(...args: any[]): void;
  debug?(...args: any[]): void;
}

export class ConsoleLogger {
  public log(...args: any[]) {
    console.log("[LOG]", ...args);
  }
  public info(...args: any[]) {
    console.info("[INFO]", ...args);
  }
  public warn(...args: any[]) {
    console.warn("[WARN]", ...args);
  }
  public error(...args: any[]) {
    console.error("[ERROR]", ...args);
  }
  public debug(...args: any[]) {
    if (import.meta.env.DEV) console.debug("[DEBUG]", ...args);
  }
}
export class NoOpLogger {
  public log(..._args: unknown[]): void {};
  public info(..._args: unknown[]): void {};
  public warn(..._args: unknown[]): void {};
  public error(..._args: unknown[]): void {};
  public debug(..._args: unknown[]): void {};
}
