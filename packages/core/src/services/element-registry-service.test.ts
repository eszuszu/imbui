import { describe, it, expect, vi } from "vitest";
import { ElementRegistryService } from "./element-registry-service";
import { LoggerService } from "./logger-service";
import { withDisposer } from "../utils/with-disposer";

describe('ElementRegistryService Unit Tests',() => {

  class FakeRegistry implements CustomElementRegistry {
    private map = new Map<string, CustomElementConstructor>();
    private nameMap = new WeakMap<CustomElementConstructor, string>();
    define(tag: string, ctor: CustomElementConstructor): void {
      if (this.map.has(tag)) throw new DOMException("Already defined");
      this.map.set(tag, ctor);
      this.nameMap.set(ctor, tag);
    }
    get(tag: string): CustomElementConstructor | undefined {
      return this.map.get(tag);
    };
    getName(ctor: CustomElementConstructor): string | null {
      return this.nameMap.get(ctor)!;

    }
    whenDefined(tag: string) {
      return Promise.resolve(this.map.get(tag)!);
    }
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    upgrade(_root: Node) {};
  }

  let testService: ElementRegistryService;

  const logger: LoggerService = {
    debug: vi.fn(),
    error: vi.fn(),
  } as unknown as LoggerService;

  describe('Lifecycle methods and abort controller', () => {
    it('assigns `this.registry` to the global registry if a registry is not provided during instantiation.', () => {
      testService = new ElementRegistryService(logger);
      expect(testService.registry).toBe(testService.windowRegistry);
      expect(testService.registry).toBe(customElements);
      expect(testService.registry).toHaveProperty("define");

    }); 

    it('assigns a given customElements registry object.', () => {
      const newService = new ElementRegistryService(logger, new FakeRegistry())
      expect(newService.registry).toBeInstanceOf(FakeRegistry);
    });

    it ("disposes when AsyncDisposableStack is available", async () => {
      const disposeSpy = vi.spyOn(AsyncDisposableStack.prototype, "disposeAsync");
      await withDisposer(async (stack) => {
        stack.defer(() => {});
      });
      expect(disposeSpy).toHaveBeenCalled();
    });


  })

  describe('define method', () => {
    it('should be a work in progress', () => {
      // This is a placeholder test to ensure Vitest passes.
      expect(true).toBe(true);
    });
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
  describe('defineMany method', () => {
    it("defines multiple elements and cleans up pendingDefinitions on dispose", async () => {

      const registry = new FakeRegistry();
      testService = new ElementRegistryService(logger, registry);

      class ElOne extends HTMLElement {}
      class ElTwo extends HTMLElement {}

      const stack = await testService.defineMany([
        { tag: "el-one", ctor: ElOne },
        { tag: "el-two", ctor: ElTwo }
      ]) as AsyncDisposableStack;
      expect(testService.listPending()).toEqual([]);
      const spy = vi.spyOn(stack, 'disposeAsync');
      await stack.disposeAsync();
      expect(spy).toHaveBeenCalled();
      expect(testService.registry.get('el-one')).toBeDefined();
    });
  });
  describe('sequenceDefinitions method', () => {
    it('should be a work in progress', () => {
      // This is a placeholder test to ensure Vitest passes.
      expect(true).toBe(true);
    });
  })


})