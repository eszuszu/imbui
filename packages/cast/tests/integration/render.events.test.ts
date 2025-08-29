import { describe, it, expect, vi, beforeEach } from "vitest";
import { die, cast } from "../../src/";
import { Runtime } from "../../src/runtime/runtime";
//import { instanceCache } from "../../src/render/instanceCache"; //`die` is an alias for the `html` tagged templatee
// `cast` is an alias for `render`


describe('Event listener functionality', () => {

  const runtime = new Runtime();
  const p = document.createElement('div');
  const handlerSpy = vi.fn();
  const newSpy = vi.fn();
  cast(die`<button onclick=${handlerSpy}></button>`, p, undefined, runtime);
  let element = p.firstElementChild as HTMLButtonElement;
  beforeEach(() => {

    vi.restoreAllMocks();

  });

  it('attaches events', () => {


    expect(handlerSpy).not.toHaveBeenCalled();
    element.click();
    expect(handlerSpy).toHaveBeenCalled();

  });

  it('should correctly swap the handler when updated', () => {

    element.click();
    expect(handlerSpy).toHaveBeenCalledTimes(1);
    expect(newSpy).not.toHaveBeenCalled();
    cast(die`<button onclick=${newSpy}></button>`, p, p, runtime);
    element = p.firstElementChild as HTMLButtonElement;
    element.click();
    expect(handlerSpy).toHaveBeenCalledTimes(1);
    expect(newSpy).toHaveBeenCalled();

  });

  //this potentially needs to be extended
  it('should have unmount remove listeners', () => {
    element.click()
    expect(newSpy).toHaveBeenCalledTimes(1);
    runtime.unmount(p);
    expect(newSpy).toHaveBeenCalledTimes(1);

  });

  it("should call removeEventListener on unmount", () => {
    cast(die`<button onclick=${handlerSpy}></button>`, p, p, runtime);
    element = p.firstElementChild as HTMLButtonElement;

    const removeSpy = vi.spyOn(EventTarget.prototype, "removeEventListener");

    runtime.unmount(p);
    expect(removeSpy).toHaveBeenCalledWith("click", expect.any(Function));

    removeSpy.mockRestore();
  })

  it("clears event parts from cache on unmount", () => {
    runtime.unmount(p);
    const hostCache = runtime.instanceCache.get(p);

    const imap = runtime.instanceCache.get(element);
    expect(imap).toBeUndefined();
    expect(hostCache?.size).toBe(0);
  });
});