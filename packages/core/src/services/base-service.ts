export abstract class BaseService {
  protected abortController = new AbortController();
  protected disposed = false;

  init?(): void | Promise<void>;
  reset?(): void | Promise<void>;
  whenReady?(): Promise<void>;

  getSnapshot?(): unknown;
  inspect?(): unknown; 
  forceCleanup?(): void;

  private disposeListeners = new Set<() => void>();
  private errorListeners = new Set<(err: Error) => void>();

  onError?(cb: (err: Error) => void) {
    this.errorListeners.add(cb);
    return () => this.errorListeners.delete(cb);
  }

  onDispose?(cb: () => void) {
    this.disposeListeners.add(cb);
    return () => this.disposeListeners.delete(cb);
  }

  protected emitError(err: Error) {
    for (const cb of this.errorListeners) cb(err);
  }

  protected emitDispose() {
    for (const cb of this.disposeListeners) cb();
  }

  protected ensureActive() {
    if (this.disposed) throw new Error(`[${this.constructor.name}] Service already disposed`);
  }

  protected checkAbort(signal: AbortSignal) {
    if (signal.aborted) {
      throw signal.reason instanceof Error
        ? signal.reason
        : new DOMException("Operation aborted", "AbortError");
    }
  }

  protected newAbortController() {
    this.abortController.abort('reset');
    this.abortController = new AbortController;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;

    this.abortController.abort(`[${this.constructor.name}] disposed`);
    try {
      this.cleanup();
    } finally {
      this.emitDispose();
    }
  }

  protected abstract cleanup(): void;

  protected async cleanupAsync(): Promise<void> {
    this.cleanup();
  }

  [Symbol.dispose]() { this.dispose(); }
  
  protected async [Symbol.asyncDispose]() {
    if (this.disposed) return;
    this.disposed = true;
    this.abortController.abort(`[${this.constructor.name}] Service already disposed`);
    try {
      await this.cleanupAsync();
    } finally {
      this.emitDispose();
    }
  }
}