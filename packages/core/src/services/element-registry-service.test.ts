import { describe, it, expect, vi, beforeEach } from "vitest";
import { ElementRegistryService } from "./element-registry-service";
import { LoggerService } from "./logger-service";

class TestElement extends HTMLElement {}
// This is not to pollute the window registry.
const mockRegistry = (() => {
    const definitions = new Map();
    const resolvers = new Map();

    return {
    get: vi.fn(tag => definitions.get(tag)),
    define: vi.fn((tag, ctor) => {
      definitions.set(tag, ctor);
      if (resolvers.has(tag)) {
        resolvers.get(tag)(ctor);
        resolvers.delete(tag);
      }
    }),
    whenDefined: vi.fn(tag => {
      if (definitions.has(tag)) {
        return Promise.resolve(definitions.get(tag));
  
      }
      return new Promise(resolve => resolvers.set(tag, resolve));
    })
  }
})();

const logger: LoggerService = {
  debug: vi.fn(),
  error: vi.fn(),
} as unknown as LoggerService;

describe('ElementRegistryService Unit Tests',() => {

  let svc: ElementRegistryService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new ElementRegistryService(logger, mockRegistry as unknown as CustomElementRegistry);
  });

  describe('Lifecycle methods and abort controller', () => {

    it('should call the dispose method when a using block ends', () => {

      const disposeSpy = vi.spyOn(svc, 'dispose');
      (() => {
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        using s = svc
      })();

      expect(disposeSpy).toHaveBeenCalledOnce();
      expect(svc.disposed).toBe(true);
    });

    it ('should be marked as disposed after an asynchronous await using block', async () => {
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      const asyncDisposeSpy = vi.spyOn(ElementRegistryService.prototype, Symbol.asyncDispose as any);

     await (async () => {
       //eslint-disable-next-line @typescript-eslint/no-unused-vars
      await using s = svc
      svc.define('my-element', TestElement);})()

      expect(asyncDisposeSpy).toHaveBeenCalledOnce();
      expect(svc.disposed).toBe(true);
    })

  })

  describe('Service Functionality', () => {

    it("should correctly define multiple custom elements with defineMany", async () => {
    
      class One extends HTMLElement { }
      class Two extends HTMLElement { }

      await svc.defineMany([
        { tag: "el-one", ctor: One },
        { tag: "el-two", ctor: Two }
      ]);
      expect(mockRegistry.get('el-one')).toBe(One);
      expect(mockRegistry.get('el-two')).toBe(Two);
    });
    it('should correctly define a single custom element', async ()=> {


      await svc.define('my-test-element', TestElement);
      expect(mockRegistry.get('my-test-element')).toBe(TestElement);
      expect(svc.isDefined('my-test-element')).toBe(true);
    })
  })
  it('should resolve immediately if the element has already been defined', async () => {

    await svc.define('pending-el', TestElement);
    await expect(svc.whenDefined('pending-el')).resolves.toStrictEqual(TestElement);
  });
  it('should return the same pending promise from pending map when whenDefined returns', async () => {
    const whenDefinedPromise = svc.whenDefined('pending-el');

    expect(whenDefinedPromise).toStrictEqual(svc.pending.get('pending-el'));
    await svc.define('pending-el', TestElement);

  })

  describe('awaitUndefinedChildren method', () => {
    
    it('should resolve a promise with the correct constructor', async () => {
     
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = '<undefined-el></undefined-el>';
      class NewTestEl extends HTMLElement {};
      expect(svc.isDefined('undefined-el')).toBe(false);

      const childrenPromise = svc.awaitUndefinedChildren(tempDiv);
      expect(svc.isPending('undefined-el')).toBe(true);
      //await svc.define('undefined-el', NewTestEl)

      await svc.define('undefined-el', NewTestEl);

      const result = await childrenPromise;
      expect(result).toEqual([NewTestEl]);
      expect(svc.isPending('undefined-el')).toBe(false);
      expect(svc.isDefined('undefined-el')).toBe(true);
    });

    it('should return an array that contains the constructors for all unique undefined children', async () => {

      const tempDiv = document.createElement('div');

      tempDiv.innerHTML = `<test-one><test-two></test-two></test-one>`

      class TestOne extends HTMLElement { };
      class TestTwo extends HTMLElement { };
      const childrenPromise = svc.awaitUndefinedChildren(tempDiv);

      expect(svc.pending.has('test-one')).toBe(true);
      expect(svc.pending.has('test-two')).toBe(true);

      expect(svc.isDefined('test-one')).toBe(false);
      expect(svc.isDefined('test-two')).toBe(false);
      
      await svc.define('test-one', TestOne);
      await svc.define('test-two', TestTwo);

      const result = await childrenPromise;

      expect(result).toEqual([TestOne, TestTwo]);
      expect(svc.isDefined('test-one')).toBe(true);
      expect(svc.isDefined('test-two')).toBe(true);
    })
  })
  describe('sequenceDefinitions method', () => {
    it('should define elements sequentially and execute the callback after each definition', async () => {
      const defs = [
        { tag: "el-one", ctor: class One extends HTMLElement { } },
        { tag: "el-two", ctor: class Two extends HTMLElement { } }
      ];

      const defineSpy = vi.spyOn(svc, 'define');

      const mockCallback = vi.fn();

      await svc.sequenceDefinitions(defs, mockCallback);
      // Check that define was called for each element in the correct order
      expect(defineSpy).toHaveBeenCalledTimes(2);
      expect(defineSpy).toHaveBeenNthCalledWith(1, "el-one", defs[0].ctor, undefined);
      expect(defineSpy).toHaveBeenNthCalledWith(2, "el-two", defs[1].ctor, undefined);

      // Check that the callback was called after each definition
      expect(mockCallback).toHaveBeenCalledTimes(2);

      expect(defineSpy.mock.invocationCallOrder[0]).toBeLessThan(mockCallback.mock.invocationCallOrder[0]);
      expect(mockCallback.mock.invocationCallOrder[0]).toBeLessThan(defineSpy.mock.invocationCallOrder[1]);
      expect(defineSpy.mock.invocationCallOrder[1]).toBeLessThan(mockCallback.mock.invocationCallOrder[1]);
    });
  });


});