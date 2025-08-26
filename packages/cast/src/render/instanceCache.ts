import type { TemplateData } from "../types";
// To-do, same as compiledCache, consider a factory pattern
// for per runtime cache
type InstanceMap = Map<TemplateStringsArray, TemplateData>;
export const instanceCache = new WeakMap<ParentNode, InstanceMap>();
export const activeIdentity = new WeakMap<ParentNode, TemplateStringsArray>();

export function getInstances(container: ParentNode): InstanceMap {
  let map = instanceCache.get(container);
  if (!map) {
    map = new Map();
    instanceCache.set(container, map);
  }
  return map;
}
export function moveInstances(from: ParentNode, to: ParentNode) {
  const map = instanceCache.get(from);
  if (!map) return;
  const target = getInstances(to);
  for (const [identity, td] of map) {
    target.set(identity, td);
  }
  instanceCache.delete(from);
  const active = activeIdentity.get(from);
  if (active) {
    activeIdentity.set(to, active);
    activeIdentity.delete(from);
  }
}