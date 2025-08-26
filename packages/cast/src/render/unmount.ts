import type { TemplateData } from "../types";
import { disposeBetween } from "../utils/dom";
import { instanceCache, activeIdentity } from "./instanceCache";

export function disposeTemplateData(td: TemplateData) {
  for (const part of td.parts) {
    part.dispose?.();

    if (part.type === 'event' && part.handler) {
      (part.node as Element).removeEventListener(part.name, part.handler);
      part.handler = undefined;
    }
    if (part.type === 'childRange') {
      disposeBetween(part.startNode, part.endNode, td.parts)
    }
    if (part.type === 'node' && (part.valueNode || part.node)) {
      part.dispose?.();
    }
    if (part.type === 'attr' && part.node instanceof Element) {
      part.dispose?.();
    }
  }
}

export function unmount(host: ParentNode) {
  const map = instanceCache.get(host);
  if (!map) return;
  for (const td of map.values()) disposeTemplateData(td);
  map.clear();
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((host as any).replaceChildren) (host as ParentNode).replaceChildren();
  activeIdentity.delete(host);
}