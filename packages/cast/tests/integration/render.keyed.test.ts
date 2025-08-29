import { describe, it, expect, vi } from "vitest";
import { Runtime } from "../../src/runtime/runtime";
import { render, html } from "../../src";
import { keyed } from "../../src/directives/keyed";

function setupTest() {
  const runtime = new Runtime();
  const container = document.createElement("div");
  const disposeSpy = vi.fn();
  runtime.disposeTemplateData = disposeSpy;
  return { runtime, container, disposeSpy };
}
  
describe("Keyed directive", () => {
  type Data = { id: string };
  const { runtime, container } = setupTest();
  it("reorders keyed ranges", () => {
    const data: Data[] = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const tpl = (items: Data[]) =>
      html`<ul>${
        keyed<Data>(item => item.id, item => html`<li>${item.id}</li>`)(items)
      }</ul>`;

      render(tpl(data), container, undefined, runtime);
      const [liA, liB, liC] = container.querySelectorAll("li");
      expect([liA.textContent, liB.textContent, liC.textContent]).toEqual(["a", "b", "c"]);

      const reordered = [data[2], data[0], data[1]];
      render(tpl(reordered), container, undefined, runtime);
      const lis = container.querySelectorAll("li");
      expect(Array.from(lis).map(li => li.textContent)).toEqual(["c", "a", "b"]);

      expect(lis[0]).toBe(liC);
      expect(lis[1]).toBe(liA);
      expect(lis[2]).toBe(liB);

  });

  it("preserves input values when reordered", () => {
    const data = [{ id: "a" }, { id: "b" }];
    const tpl = (items: Data[]) =>
      html`<div>${
        keyed<Data>(item => item.id, item => html`<input value=${item.id}>`)(items)
      }</div>`;

    render(tpl(data), container, undefined, runtime);

    const [inputA, ] = container.querySelectorAll('input');
    inputA.value = "user typed";

    render(tpl([data[1], data[0]]), container, undefined, runtime);
    const [, afterA] = container.querySelectorAll("input");

    expect(afterA.value).toBe("user typed");
  });
})