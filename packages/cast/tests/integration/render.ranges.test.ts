import { describe, it, expect, vi } from "vitest";
import { Runtime } from "../../src/runtime/runtime";
import { render, html } from "../../src";

describe("Core rendering functionality of child ranges", () => {
  const runtime = new Runtime();
  const parent = document.createElement('p');

  const testVal1 = "hooray!";
  const tpl = html`<p>${testVal1}</p>`;
  const arr: unknown[] = [1, 2, 3];
  it("renders a text node when given a string insde the parent", () => {
    render(tpl, parent, undefined, runtime);
    expect(parent.firstElementChild?.textContent).toBe("hooray!");

    parent.firstElementChild?.remove();
  });
  
  it("ensures arrays are rendered in the right insertion order", () => {
    const tpl2 = html`<ul>${arr}</ul>`
    render(tpl2, parent, undefined, runtime); 
    expect(parent.firstElementChild).toBeInstanceOf(HTMLUListElement);
    expect(parent.firstElementChild?.childElementCount).toBe(0);
    parent.firstElementChild?.remove();
  });
  it("ensures nested templates properly render in child ranges", () => {
    const list = arr.map(item => html`<li>${item}</li>`)
    const tpl2 = html`<ul>${list}</ul>`
    render(tpl2, parent, undefined, runtime);
    expect(parent.firstElementChild).toBeInstanceOf(HTMLUListElement);
    expect(parent.firstElementChild?.childElementCount).toBe(3);
  });
  it("updates ranges when they grow", () => {
    const list = arr.map(item => html`<li>${item}</li>`)
    const tpl2 = html`<ul>${list}</ul>`
    list.push(html`<li>${4}</li>`);
    render(tpl2, parent, undefined, runtime);
    expect(parent.firstElementChild).toBeInstanceOf(HTMLUListElement);
    expect(parent.firstElementChild?.childElementCount).toBe(4);
  });

  it("renders mixed strings, numbers, and nodes in arrays", () => {
    const tpl = html`<div>${["a", 1, document.createTextNode("node")]}</div>`;
    render(tpl, parent, undefined, runtime);
 
    //2 comments per item w/ 3 items = 3 * 2, 3 text nodes, 2 head and tail comment nodes
    expect(parent.lastElementChild?.childNodes.length).toBe((3 * 2) + 3 + 2);
  });
  it("renders falsy values as empty strings in ranges", () => {
    const tpl = html`<div>${[null, undefined, false]}</div>`;
    render(tpl, parent, undefined, runtime);
    const textNodes = Array.from(parent.firstElementChild?.childNodes ?? []).filter(n => n.nodeType === Node.TEXT_NODE);

    expect(textNodes.length).toBe(3);
    expect(parent.firstElementChild?.textContent).toBe("false");
  })

  it("renders deeply nested templates", () => {
    const tpl = html`<div>${html`<span>${html`<b>deep</b>`}</span>`}</div>`;
    render(tpl,parent,undefined,runtime);
    expect(parent.querySelector("b")?.textContent).toBe("deep");
  });

  it("disposes parts when child range shrinks", () => {
    const disposeSpy = vi.fn();
    const list = [html`<li>1</li>`, html`<li>2</li>`];
    let tpl = html`<ul>${list}</ul>`;

    render(tpl, parent, undefined, runtime);
    runtime.disposeTemplateData = disposeSpy;
    list.pop();

    tpl = html`<ul>${list}</ul>`;
    render(tpl, parent, undefined, runtime);

    expect(disposeSpy).toHaveBeenCalled();
  })

});