import type { Part } from "../types";
export function collectParts(fragment: DocumentFragment): Part[] {
  const parts: Part[] = [];
  const startMap = new Map<number, Comment>();
  const endMap = new Map<number, Comment>();
  const commentWalker = document.createTreeWalker(fragment, NodeFilter.SHOW_COMMENT);
  let c: Comment | null;
  while ((c = commentWalker.nextNode() as Comment | null)) {
    const text = c.nodeValue || '';
    let stamped = text.match(/^⁕(\d+)$/);
    if (stamped) {
      parts.push({
        type: "node",
        node: c,
        index: parseInt(stamped[1], 10),
        valueNode: null
      });
      continue;
    }

    stamped = text.match(/^⁕start:(\d+)$/);
    if (stamped) {
      startMap.set(parseInt(stamped[1], 10), c);
      continue;
    }

    stamped = text.match(/^⁕end:(\d+)$/);
    if (stamped) {
      endMap.set(parseInt(stamped[1], 10), c)
      continue;
    }
  }

  for (const [i, startNode] of startMap) {
    const endNode = endMap.get(i);
    if (endNode) {
      parts.push({
        type: "childRange",
        index: i,
        startNode,
        endNode
      });
    }
  }

  const attrTokenReg = /⁕(\d+)/g;
  const elWalker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT);
  let el: Element | null;
  while ((el = elWalker.nextNode() as Element | null)) {
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      const name = attr.name;
      const raw = attr.value;
      attrTokenReg.lastIndex = 0;
      let found = false;
      const attrStrings: string[] = [];
      const valueIndices: number[] = [];
      let last = 0;
      let stamped: RegExpExecArray | null;
      while ((stamped = attrTokenReg.exec(raw))) {
        found = true;
        attrStrings.push(raw.slice(last, stamped.index));
        valueIndices.push(parseInt(stamped[1], 10));
        last = stamped.index + stamped[0].length;
      }
      if (!found) continue;
      attrStrings.push(raw.slice(last));

      if (name.startsWith('on')) {
        const idx = valueIndices[0] ?? 0;
        parts.push({
          type: 'event',
          node: el,
          index: idx,
          name: name.slice(2)
        });
        el.removeAttribute(name);
      } else {
        parts.push({
          type: 'attr',
          node: el,
          name,
          index: valueIndices[0],
          attrStrings,
          valueIndices
        });
      }
    }
  }
  parts.sort((a, b) => a.index - b.index);
  return parts;
}