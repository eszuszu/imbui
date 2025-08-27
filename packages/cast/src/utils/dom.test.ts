import { describe, it, expect, beforeEach, vi } from "vitest";
import { disposeBetween } from "./dom";
import type { NodePart, EventPart, ChildRangePart } from "../types"

describe('Unit tests for function disposeBetween',()=> {
  let parent: HTMLElement;
  let start: Comment;
  let end: Comment;

  beforeEach(() => {
    parent = document.createElement('div');
    start = document.createComment('start');
    end = document.createComment('end');
    parent.append(start, end);
  });

  it("removes all nodes between start and end", () => {
    const mid = document.createElement("span");
    parent.insertBefore(mid, end);

    disposeBetween(start, end);

    expect(parent.contains(mid)).toBe(false);

    expect(Array.from(parent.childNodes)).toEqual([start, end]);
  });

  it("calls dispose() on node parts", () => {
    const mid = document.createTextNode("hello");
    parent.insertBefore(mid, end);

    const disposeSpy = vi.fn();
    const part: NodePart = {
      type: "node",
      index: 0,
      node: start,
      valueNode: mid,
      dispose: disposeSpy,
    };

    disposeBetween(start, end, [part]);

    expect(disposeSpy).toHaveBeenCalled();
  });

  it("removes event listeners and calls dispose", () => {
    const btn = document.createElement("button");
    parent.insertBefore(btn, end);
    const handler = vi.fn();
    btn.addEventListener("click", handler);

    const disposeSpy = vi.fn();
    const part: EventPart = {
      type: "event",
      index: 0,
      node: btn,
      name: "click",
      handler,
      dispose: disposeSpy,
    };

    disposeBetween(start, end, [part]);

    btn.click();
    expect(handler).not.toBeCalled();
    expect(disposeSpy).toHaveBeenCalled();
  });

  it("recursively disposes child ranges", () => {
    const innerStart = document.createComment("innerStart");
    const innerEnd = document.createComment("innerEnd");
    parent.insertBefore(innerStart, end);
    parent.insertBefore(document.createTextNode("x"), end);
    parent.insertBefore(innerEnd, end);

    const innerDispose = vi.fn();
    const part: ChildRangePart = {
      type: "childRange",
      index: 0,
      startNode: innerStart,
      endNode: innerEnd,
      dispose: innerDispose,
    };

    disposeBetween(start, end, [part]);

    expect(innerDispose).toHaveBeenCalled();
    expect(Array.from(parent.childNodes)).toEqual([start, end]);
  });

});