import type { ChildRangePart } from "../types";
import { disposeBetween } from "../utils/dom";
import { setSpanContent } from "./render";

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderRange(part: ChildRangePart, rawValue: any[]) {
  const items = Array.isArray(rawValue) ? rawValue : [rawValue];
  const parent = part.startNode.parentNode;
  const spans = part.itemSpans ?? (part.itemSpans = []);

  // shrink
  for (let i = items.length; i < spans.length; i++) {
    const { start, end } = spans[i];
    disposeBetween(start, end, part.allParts);
    parent?.removeChild(start);
    parent?.removeChild(end);
  }
  spans.length = Math.min(spans.length, items.length);

  // grow
  for (let i = spans.length; i < items.length; i++) {
    const s = document.createComment(`i:${part.index}`);
    const e = document.createComment(`/i:${part.index}`);
    parent?.insertBefore(s, part.endNode);
    parent?.insertBefore(e, part.endNode);
    spans.push({ start: s, end: e });
  }

  //update
  for (let i = 0; i < items.length; i++) {
    setSpanContent(spans[i], items[i], part.host, part);
  }
}