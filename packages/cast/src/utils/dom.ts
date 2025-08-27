import type { NodePath, Part } from "../types";
import { instanceCache } from "../render/instanceCache";
export function nodeFromPath(root: Node, path: NodePath): Node {
  let n: Node = root;
  for (const i of path) n = n.childNodes[i];
  return n;
}
export function indexPathTo(node: Node, root: Node): NodePath {
  const path: number[] = [];
  let n: Node | null = node;
  while (n && n !== root) {
    const p: Node = n.parentNode!;
    path.unshift(Array.prototype.indexOf.call(p.childNodes, n));
    n = p;
  }
  return path;
}
export function disposeBetween(start: Comment, end: Comment, parts?: Part[]) {
  const parent = start.parentNode!;
  if (!parts) {
    parts = [];
    const imap = instanceCache.get(parent);
    if (imap) {
      for (const td of imap.values()) {
        parts.push(...td.parts);
      }
    }
  }


  let node: Node | null;
  while ((node = start.nextSibling)&& node !== end) {

    if (parts && parts.length) {


      for (const part of parts) {
        switch (part.type) {
          case 'node': {
            if (
              part.valueNode === node ||
              part.node === node ||
              (node.nodeType === 1 && (
                (part.valueNode && (node as Node).contains(part.valueNode)) ||
                (part.node && (node as Node).contains(part.node))
              ))
            ) {
              part.dispose?.();
            }
            break;
          }
          case 'event': {
            if (part.node === node || (node.nodeType === 1 && (node as Node).contains(part.node))) {
              if (part.handler) {
                part.node.removeEventListener(part.name, part.handler);
                part.handler = undefined;
              }
              part.dispose?.();
            }
            break;
          }
          case 'attr': {
            if (part.node === node || (node.nodeType === 1 && (node as Node).contains(part.node))) {
              part.dispose?.();
            }
            break;
          }
          case 'childRange': {
            if (

              node === part.startNode ||
              (node.nodeType === 1 && (node as Node).contains(part.startNode))

            ) {
              disposeBetween(part.startNode, part.endNode, parts);
              part.dispose?.();
            }
            break;
          }
        }
      }
    }


    if (node.parentNode === parent) {
      parent.removeChild(node);
    }

  }
}