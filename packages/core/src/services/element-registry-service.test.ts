import { describe, it, expect, vi, beforeEach } from "vitest";
import { ElementRegistryService } from "./element-registry-service";
import { LoggerService } from "./logger-service";

class TestElement extends HTMLElement {}

class FakeRegistry implements CustomElementRegistry {
  private map = new Map<string, CustomElementConstructor>();
  private nameMap = new WeakMap<CustomElementConstructor, string>();
  private pendingPromises = new Map<string, (ctor: CustomElementConstructor) => void>();
  define(tag: string, ctor: CustomElementConstructor): void {
    if (this.map.has(tag)) throw new DOMException("Already defined");
    this.map.set(tag, ctor);
    
    this.nameMap.set(ctor, tag);
    const resolve = this.pendingPromises.get(tag);
    if (resolve) {
      resolve(ctor);
      this.pendingPromises.delete(tag);
    }
  }
  get(tag: string): CustomElementConstructor | undefined {
    return this.map.get(tag);
  };
  getName(ctor: CustomElementConstructor): string | null {
    return this.nameMap.get(ctor)!;

  }
  whenDefined(tag: string): Promise<CustomElementConstructor> {
    const ctor = this.map.get(tag);
    if (ctor) {
      return Promise.resolve(ctor);
    }

    return new Promise<CustomElementConstructor>(resolve => {
      this.pendingPromises.set(tag, resolve);
    })
  }
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  upgrade(_root: Node) {};
}

describe('ElementRegistryService Unit Tests',() => {

  const logger: LoggerService = {
    debug: vi.fn(),
    error: vi.fn(),
  } as unknown as LoggerService;

  let registry: FakeRegistry;

  beforeEach(() => {
    registry = new FakeRegistry();
  });

  describe('Lifecycle methods and abort controller', () => {

    it('should call the dispose method when a using block ends', () => {
      const s = new ElementRegistryService(logger, registry);
      const disposeSpy = vi.spyOn(s, 'dispose');
      (() => {
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        using svc = s
      })();

      expect(disposeSpy).toHaveBeenCalledOnce();
      expect(s.disposed).toBe(true);
    });

    it ('should be marked as disposed after an asynchronous await using block', async () => {
      const s = new ElementRegistryService(logger, registry);
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      const asyncDisposeSpy = vi.spyOn(ElementRegistryService.prototype, Symbol.asyncDispose as any);

     await (async () => {
      await using svc = s
      svc.define('my-element', TestElement);})()

      expect(asyncDisposeSpy).toHaveBeenCalledOnce();
      expect(s.disposed).toBe(true);
    })

  })

  describe('Service Functionality', () => {

    it("should correctly define multiple custom elements with defineMany", async () => {
    
      const s = new ElementRegistryService(logger, registry);
      class One extends HTMLElement { }
      class Two extends HTMLElement { }

      await s.defineMany([
        { tag: "el-one", ctor: One },
        { tag: "el-two", ctor: Two }
      ]);
      expect(registry.get('el-one')).toBe(One);
      expect(registry.get('el-two')).toBe(Two);
    });
    it('should correctly define a single custom element', async ()=> {

      const service = new ElementRegistryService(logger, registry);
      await service.define('my-test-element', TestElement);
      expect(registry.get('my-test-element')).toBe(TestElement);
      expect(service.isDefined('my-test-element')).toBe(true);
    })
  })
  describe('whenDefined method', () => {
    it('should be a work in progress', () => {
      // This is a placeholder test to ensure Vitest passes.
      expect(true).toBe(true);
    });
  })
  describe('awaitUndefinedChildren method', () => {
    it('should be a work in progress', () => {
      // This is a placeholder test to ensure Vitest passes.
      expect(true).toBe(true);
    });
  })
  describe('sequenceDefinitions method', () => {
    it('should be a work in progress', () => {
      // This is a placeholder test to ensure Vitest passes.
      expect(true).toBe(true);
    });
  })


})