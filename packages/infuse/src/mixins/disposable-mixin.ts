import type { WebComponentConstructor } from "./types";

export const DisposableMixin = <TBase extends WebComponentConstructor>(Base: TBase) => {
  class DisposableClass extends Base {
    cleanups = new Set<() => void>();
    disposed = false;

    onDispose(callback: () => void) {
      if (this.disposed) callback();
      else this.cleanups.add(callback);
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this.dispose();
    }

    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      for (const callback of this.cleanups) {
        try { callback(); } catch (error) {
          console.error(`[${this.tagName.toLowerCase()}] cleanup failed`, error);
        }
      }
      this.cleanups.clear();
    }
  }
  return DisposableClass;
}