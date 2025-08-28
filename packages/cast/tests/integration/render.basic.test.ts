import { describe, it, expect, beforeEach} from "vitest";
import { render, html } from "../../src/";

describe('Basic rendering functionality of `cast`(render()) and `die`(html)', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div')
  })

  it('should `cast`(render) the `die`(template) in host', () => {
    render(html`hello ${"world"}`, element);
    expect(element.innerHTML).toContain("hello world");
  });

  it('should handle multiple interpolations', () => {
   render(html`${"a"}-${"b"}`, element);
   expect(element.textContent).toContain("a-b")
  });

  

})