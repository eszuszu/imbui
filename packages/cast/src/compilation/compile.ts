import type {
  TemplateResult,
  Compiled,
  PartBlueprint,
  ChildRangePart
} from "../types";
//import { compiledCache } from "./compiledCache";
import { Runtime } from "../runtime/runtime";
import { looksLikeAttrOpen, looksLikeChildSlot } from "../utils/parsing";
import { indexPathTo } from "../utils/dom";
import { collectParts } from "../parts/collectParts";
import {
  __TEXT_STAMP__,
  __ATTR_STAMP__,
  __HEAD_STAMP__,
  __TAIL_STAMP__
} from "../stamps";

export function compile(tr: TemplateResult, runtime: Runtime): Compiled {
  const compiledCache = runtime.compiledCache;
  const hit = compiledCache.get(tr.identity);

  if (hit) return hit;

  const template = document.createElement('template');
  let markup = '';
  tr.strings.forEach((str, i) => {
    markup += str;
    if (i < tr.values.length) {
      const next = tr.strings[i + 1] ?? '';
      if (looksLikeAttrOpen(str)) markup += __ATTR_STAMP__(i);
      else if (looksLikeChildSlot(str, next)) markup += __HEAD_STAMP__(i) + __TAIL_STAMP__(i);
      else markup += __TEXT_STAMP__(i);
    }
  });
  template.innerHTML = markup;

  const frag = template.content.cloneNode(true) as DocumentFragment;
  const parts = collectParts(frag);

  const blueprints: PartBlueprint[] = parts.map(p => {
    if (p.type === 'node') {
      return {
        type: 'node',
        index: p.index,
        path: indexPathTo(p.node, frag)
      };
    } else if (p.type === 'childRange') {
      return {
        type: 'childRange',
        index: p.index,
        startPath: indexPathTo((p as ChildRangePart).startNode, frag),
        endPath: indexPathTo((p as ChildRangePart).endNode, frag),
      };
    } else if (p.type === 'attr') {
      return {
        type: 'attr',
        index: p.index,
        path: indexPathTo(p.node, frag),
        name: p.name,
        attrStrings: p.attrStrings,
        valueIndices: p.valueIndices,
      };
    } else {
      return {
        type: 'event',
        index: p.index,
        path: indexPathTo(p.node, frag),
        name: p.name,
      }
    }
  });

  const compiled: Compiled = { template, blueprints };
  compiledCache.set(tr.identity, compiled);
  return compiled;

}