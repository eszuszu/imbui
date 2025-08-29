/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TemplateResult } from "../types";
import { directive } from "./base";
import { disposeBetween } from "../utils/dom";
import { setSpanContent } from "../render/render";


type KeyRecord = { key: any; start: Comment; end: Comment };

export const keyed = <T>(
  keyFn: (item: T) => any,
  mapFn: (item: T) => TemplateResult | string | Node
) => directive<T[]>((part, items) => {
  if (part.type !== 'childRange') return;

  const parent = part.startNode.parentNode!;
  const state: Map<any, KeyRecord> =
    (part as any)._keyedState ?? ((part as any)._keyedState = new Map());

  const next = new Map<any, KeyRecord>();
  const pointer: Node | null = part.endNode;

  for (const item of items) {
    const k = keyFn(item);
    let rec = state.get(k);

    if (!rec) {
      const s = document.createComment(`key:${k}`);
      const e = document.createComment(`/key:${k}`);

      parent.insertBefore(s, pointer);
      parent.insertBefore(e, pointer);
      rec = { key: k, start: s, end: e };
      setSpanContent(rec, mapFn(item), part.host, part);
      next.set(k, rec);
    } else {
      let n: Node | null = rec.start;

      while (n) {
        const nextN: Node | null = n.nextSibling;
        parent.insertBefore(n, pointer);
        if (n === rec.end) break;
        n = nextN!;
      }
      state.delete(k);
      next.set(k, rec);
    }


  }

  for (const rec of state.values()) {
    disposeBetween(rec.start, rec.end, (part as any).allParts);
    parent.removeChild(rec.start);
    parent.removeChild(rec.end);
  }

  (part as any)._keyedState = next;
});