import { describe, it, expect, beforeEach } from "vitest";
import { die, cast } from "../../src/";

describe('Basic rendering functionality of `cast`(render()) and `die`(html)', () => {
  let parent: HTMLElement;

  beforeEach(() => {
    parent = document.createElement('div')
  })

  it('handle setting attributes via interpolation', () => {
    let dynamic = "foo";
    cast(die`<div id=${dynamic}></div>`, parent);
    expect(parent.firstElementChild?.id).toBe('foo');
    dynamic = "bar";
    cast(die`<div id=${dynamic}></div>`, parent);
    expect(parent.firstElementChild?.id).toBe('bar');
  });

});