import { describe, it, expect, vi } from "vitest";
import { BaseService } from "./base-service";

class FakeService extends BaseService {
  cleaned = false;
  asyncCleaned = false;

  protected cleanup() {
    this.cleaned = true;
  }

  protected async cleanupAsync() {
    this.asyncCleaned = true;
  }
}

describe("BaseService", () => {
  it("calls cleanup() on dispose()", () => {
    const svc = new FakeService();
    svc.dispose();
    expect(svc.cleaned).toBe(true);
    expect(svc.asyncCleaned).toBe(false);
  });

  it("calls cleanupAsync() on async dispose()", async () => {
    const svc = new FakeService();
    
    await svc[Symbol.asyncDispose]();
    expect(svc.asyncCleaned).toBe(true);
    expect(svc.cleaned).toBe(false);

  });

  it("emits dispose events", () => {
    const svc = new FakeService();
    const fn = vi.fn();
    svc.onDispose!(fn);

    svc.dispose();
    expect(fn).toHaveBeenCalled();
  });

  it("emits error events", () => {
    const svc = new FakeService();
    const fn = vi.fn();

    svc.onError!(fn);

    const err = new Error("test");
    svc["emitError"](err);
    expect(fn).toHaveBeenCalledWith(err);
  });

  it("throws if ensureActive() is called after dispose", () => {
    const svc = new FakeService();
    svc.dispose();
    expect(() => svc["ensureActive"]()).toThrowError(/disposed/);
  });

  it("resets abortController on newAbortController()", () => {
    const svc = new FakeService();
    const old = svc["abortController"];
    svc["newAbortController"]();
    expect(svc["abortController"]).not.toBe(old);
  });

})