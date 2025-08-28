import { describe, it, expect, vi, beforeEach } from "vitest";
import { die, cast, unmount } from "../../src/";
import { instanceCache } from "../../src/render/instanceCache"; //`die` is an alias for the `html` tagged templatee
// `cast` is an alias for `render`


describe('Event listener functionality', () => {
  
  const p = document.createElement('div');
  const handlerSpy = vi.fn();
  const newSpy = vi.fn();
  cast(die`<button onclick=${handlerSpy}></button>`, p);
  let element = p.firstElementChild as HTMLButtonElement;
  beforeEach(()=> {
  
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
    cast(die`<button onclick=${newSpy}></button>`, p);
    element = p.firstElementChild as HTMLButtonElement;
    element.click();
    expect(handlerSpy).toHaveBeenCalledTimes(1);
    expect(newSpy).toHaveBeenCalled();

  });

  //this potentially needs to be extended
  it('should have unmount remove listeners', () => {
    element.click()
    expect(newSpy).toHaveBeenCalledTimes(1);
    unmount(p);
    expect(newSpy).toHaveBeenCalledTimes(1);

  });

  it("should call removeEventListener on unmount", () => {
    cast(die`<button onclick=${handlerSpy}></button>`, p);
    element = p.firstElementChild as HTMLButtonElement;

    const removeSpy = vi.spyOn(EventTarget.prototype, "removeEventListener");

    unmount(p);
    expect(removeSpy).toHaveBeenCalledWith("click", expect.any(Function));

    removeSpy.mockRestore();
  })

  it("clears event parts from cache on unmount", () => {
    unmount(p);
    const hostCache = instanceCache.get(p);
    
    const imap = instanceCache.get(element);
    expect(imap).toBeUndefined();
    expect(hostCache?.size).toBe(0);
  });
});