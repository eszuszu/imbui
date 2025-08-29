import { Compiled, TemplateData } from "../types";
import { disposeBetween } from "../utils/dom";

type InstanceMap = Map<TemplateStringsArray, TemplateData>;

export class Runtime {

  compiledCache = new WeakMap<TemplateStringsArray, Compiled>();
  instanceCache = new WeakMap<ParentNode, InstanceMap>();
  #activeIdentity = new WeakMap<ParentNode, TemplateStringsArray>();

  getActiveIdentity(host: ParentNode)  {
    return this.#activeIdentity.get(host);
  }

  setActiveIdentity(host: ParentNode, tpl: TemplateStringsArray) {  
    this.#activeIdentity.set(host, tpl);
  }


  getInstances(container: ParentNode): InstanceMap {
    let map = this.instanceCache.get(container);
    if (!map) {
      map = new Map();
      this.instanceCache.set(container, map);
    }
    return map;
  }

  moveInstances(from: ParentNode, to: ParentNode) {
    const map = this.instanceCache.get(from);
    if (!map) return;
    const target = this.getInstances(to);
    for (const [identity, td] of map) {
      target.set(identity, td);
    }
    this.instanceCache.delete(from);
    const active = this.#activeIdentity.get(from);
    if (active) {
      this.#activeIdentity.set(to, active);
      this.#activeIdentity.delete(from);
    }
  }

  disposeTemplateData(td: TemplateData) {
    for (const part of td.parts) {
      try {
        switch (part.type) {
          case "event":
            if (part.handler) {
              (part.node as Element).removeEventListener(part.name, part.handler);
              part.handler = undefined;
            }
            break;
          case "childRange":
            disposeBetween(part.startNode, part.endNode, td.parts);
            break;
          case "node":
          case "attr":
            break;
        }
        part.dispose?.()
      } catch(err) {
        console.error("Dispose failed for part:", part, err);
      }
    }
  }

  unmount(host: ParentNode) {
    const map = this.instanceCache.get(host);
    if (!map) return;
    for (const td of map.values()) this.disposeTemplateData(td);
    map.clear();
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((host as any).replaceChildren) (host as ParentNode).replaceChildren();
    this.#activeIdentity.delete(host);
  }
}

export const defaultRuntime = new Runtime();