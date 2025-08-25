

//Placeholder to 'stamp' a textNode for dynamic update diffing
const __TEXT_STAMP__ = (i: number) => `<!--⁕${i}-->`;
const __ATTR_STAMP__ = (i: number) => `⁕${i}`

const __HEAD_STAMP__ = (i: number) => `<!--⁕start:${i}-->`;
const __TAIL_STAMP__ = (i: number) => `<!--⁕end:${i}-->`

const DIRECTIVE_SYMBOL = Symbol('__directive');

interface TemplateResult {
  identity: TemplateStringsArray;
  strings: TemplateStringsArray;
  values: any[];
  key?: string;
}

interface DirectiveResult<Value = unknown, Host = any, > {
  [DIRECTIVE_SYMBOL]: boolean;
  value: Value;
  fn: (part: Part, value: Value, host?: Host, oldValue?: any) => void;
  cleanup?: (part: Part, host?: Host) => void;
  kind?: any;
}

type PartType = "node" | "attr" | "event" | 'childRange';

interface BasePart {
  type: PartType;
  index: number;
  host?: HTMLElement;
  directiveInstance?: DirectiveResult;
  dispose?: (() => void) | null;
}

interface NodePart extends BasePart {
  type: "node";
  node: Comment;
  valueNode?: Text | null;
}

interface AttrPart extends BasePart {
  type: "attr";
  node: Element;
  name: string;
  attrStrings: string[];
  valueIndices: number[];
}
interface EventPart extends BasePart {
  type: "event";
  node: Element;
  name: string;
  handler?: EventListener;
}

interface ChildRangePart extends BasePart {
  type: "childRange";
  startNode: Comment;
  endNode: Comment;
  itemSpans?: Array<{ start: Comment; end: Comment }>;
  allParts?: Part[];
}

type Part = NodePart | AttrPart | EventPart | ChildRangePart;

type NodePath = number[];

interface PartBlueprintBase {
  type: PartType;
  index: number;
}
interface NodePartBlueprint extends PartBlueprintBase {
  type: "node";
  path: NodePath;
}
interface ChildRangePartBlueprint extends PartBlueprintBase {
  type: "childRange";
  startPath: NodePath;
  endPath: NodePath;
}
interface AttrPartBlueprint extends PartBlueprintBase {
  type: "attr";
  path: NodePath;
  name: string;
  attrStrings: string[];
  valueIndices: number[];
}
interface EventPartBlueprint extends PartBlueprintBase {
  type: "event";
  path: NodePath;
  name: string;
}
type PartBlueprint =
  | NodePartBlueprint
  | ChildRangePartBlueprint
  | AttrPartBlueprint
  | EventPartBlueprint

interface Compiled {
  template: HTMLTemplateElement;
  blueprints: PartBlueprint[];
}
interface TemplateData {
  template: HTMLTemplateElement;
  parts: Part[];
  oldValues: any[];
  dispose?: () => void;
}

function directive<Value, Host = any>(
  fn: DirectiveResult<Value, Host>['fn'] 
) {
  return (value: Value): DirectiveResult<Value, Host> => ({

    [DIRECTIVE_SYMBOL]: true,
    value,
    fn,
  });
}

function isDirective(value: any): value is DirectiveResult<any> {
  return !!(value && value[DIRECTIVE_SYMBOL]);
}
//To-do: try catch block to stop failed directives from stopping render
function runDirective (part: Part, dir: DirectiveResult, host: any) {
  const old = part.directiveInstance;
  const kindChanged = old && old.kind !== undefined && dir.kind !== undefined && old.kind !== dir.kind;
  if (kindChanged && old.cleanup) old.cleanup(part, host);

  part.directiveInstance = dir;

  part.dispose = dir.cleanup ? () => dir.cleanup!(part, host) : null;
  dir.fn(part, dir.value, host, old?.value);
}

export const html = (
  strings: TemplateStringsArray,
  ...values: any[]
): TemplateResult => {
  return { identity: strings, values, strings, }
};


const compiledCache2 = new WeakMap<TemplateStringsArray, Compiled>();
type InstanceMap = Map<TemplateStringsArray, TemplateData>;
const instanceCache = new WeakMap<ParentNode, InstanceMap>();
const activeIdentity = new WeakMap<ParentNode, TemplateStringsArray>();

function disposeTemplateData(td: TemplateData) {
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
  if((host as any).replaceChildren) (host as ParentNode).replaceChildren();
  activeIdentity.delete(host);
}

function getInstances(container: ParentNode): InstanceMap {
  let map = instanceCache.get(container);
  if (!map) {
    map = new Map();
    instanceCache.set(container, map);
  }
  return map;
}
function moveInstances(from: ParentNode, to: ParentNode) {
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

function indexPathTo(node: Node, root: Node): NodePath {
  const path: number[] = [];
  let n: Node | null = node;
  while (n && n !== root) {
    const p: Node = n.parentNode!;
    path.unshift(Array.prototype.indexOf.call(p.childNodes, n));
    n = p;
  }
  return path;
}

function nodeFromPath(root: Node, path: NodePath): Node {
  let n: Node = root;
  for (const i of path) n = n.childNodes[i];
  return n;
}
function compile(tr: TemplateResult): Compiled {
  const hit = compiledCache2.get(tr.identity);
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
  compiledCache2.set(tr.identity, compiled);
  return compiled;

}

function instantiateParts(frag: DocumentFragment, blueprints: PartBlueprint[]): Part[] {
  const parts: Part[] = [];
  for (const bp of blueprints) {
    if (bp.type === 'node') {
      const node = nodeFromPath(frag, (bp as NodePartBlueprint).path) as Comment;
      parts.push({
        type: 'node',
        index: bp.index,
        node,
        valueNode: null
      });
    } else if (bp.type === 'childRange') {
      const b = bp as ChildRangePartBlueprint;
      parts.push({
        type: 'childRange',
        index: bp.index,
        startNode: nodeFromPath(frag, b.startPath) as Comment,
        endNode: nodeFromPath(frag, b.endPath) as Comment,
      });
    } else if (bp.type === 'attr') {
      const b = bp as AttrPartBlueprint;
      parts.push({
        type: 'attr',
        index: b.index,
        node: nodeFromPath(frag, b.path) as Element,
        name: b.name,
        attrStrings: b.attrStrings,
        valueIndices: b.valueIndices,
      });
    } else {
      const b = bp as EventPartBlueprint;
      parts.push({
        type: 'event',
        index: b.index,
        node: nodeFromPath(frag, b.path) as Element,
        name: b.name,
      });
    }
  }
  return parts;
}

function lastNonSpaceChar(s: string) {
  for (let i = s.length - 1; i >= 0; i--) {
    const ch = s[i];
    if (!/\s/.test(ch)) return ch;
  }
  return '';
}
function firstNonSpaceChar(s: string) {
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (!/\s/.test(ch)) return ch;
  }
  return '';
}
function looksLikeAttrOpen(prev: string) {
  return /([^\s"'>/=]+)\s*(["'])?$/.test(prev);
}
function looksLikeChildSlot(prev: string, next: string) {
  const last = lastNonSpaceChar(prev);
  const first = firstNonSpaceChar(next || '');
  if (last === '>' || first === '<') return true;
  return false;
}
function toText(value: any): string {
  if (value == null || value === false) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  } else {
    try { return JSON.stringify(value)} catch { return String(value)};
  }    
}
function disposeBetween(start: Comment, end: Comment, parts?: Part[]) {
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

  let node = start.nextSibling;
  while (node && node !== end) {
    const next = node.nextSibling;

    if (parts) {
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
              node === part.startNode || node === part.endNode ||
              (node.nodeType === 1 && ((node as Node).contains (part.startNode) || (node as Node).contains (part.endNode)))
            ) {
              disposeBetween(part.startNode, part.endNode, parts);
              part.dispose?.();
            }
            break;
          }
        }
      }
    }
    parent.removeChild(node);
    node = next;
  }
}
function insertValueBefore(end: Comment, value: any, host?: HTMLElement) {
  const parent = end.parentNode!;
  if (isDirective(value)) {
    runDirective(
      { type: "childRange", startNode: end, endNode: end, index: -1, host } as Part,
      value,
      host
    );
    return;
  }
  if (value instanceof Node) {
    parent.insertBefore(value, end);
    return;
  }
  if (value && (value as TemplateResult).identity) {
    const fragment = document.createDocumentFragment();
    render(value, fragment, host);
    moveInstances(fragment, parent);
    while (fragment.firstChild) parent.insertBefore(fragment.firstChild, end);
    return;
  }
  parent.insertBefore(document.createTextNode(toText(value)), end);
}

function setSpanContent(span: { start: Comment, end: Comment }, value: any, host?: HTMLElement, owningPart?: ChildRangePart) {
  disposeBetween(span.start, span.end, owningPart?.allParts);
  insertValueBefore(span.end, value, host);
}

function collectParts(fragment: DocumentFragment): Part[] {
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

export function render(templateResult: TemplateResult, host: ParentNode, hostEl?: HTMLElement) {
  const { identity, values } = templateResult;
  
  const compiled = compile(templateResult);

  const instances = getInstances(host);
  const prevActive = activeIdentity.get(host);

  if (prevActive && prevActive !== identity) {
    for (const [_, td] of instances) {
      disposeTemplateData(td);
    }
    instances.clear();
  }
  activeIdentity.set(host, identity);
  let cached = instances.get(identity);

  if (!cached) {

    const fragment = compiled.template.content.cloneNode(true) as DocumentFragment;
    const parts = instantiateParts(fragment, compiled.blueprints);
    parts.forEach(part => {
      part.host = hostEl || (host instanceof HTMLElement ? host : undefined);
      (part as any).allParts = parts;
    })

    for (const part of parts) {
      const value = values[part.index];
      if (isDirective(value)) {
        part.directiveInstance = value;
        runDirective(part, value, part.host);
        continue;
      }
      if (part.type === 'node') {
        const text = document.createTextNode(toText(value));
        part.node.parentNode?.insertBefore(text, part.node);
        part.valueNode = text;
        continue;
      }
      if (part.type === 'attr') {
        const attrPart: AttrPart = part;
        const node: Element = attrPart.node;
        const finalValue = attrPart.attrStrings
          .map((s, i) => s + (values[attrPart.valueIndices[i]] ?? ''))
          .join('');
        node.setAttribute(attrPart.name, finalValue);
        continue;
      }
      if (part.type === 'event') {
        const eventPart: EventPart = part;
        const handler = value as any;
        if (typeof handler === 'function') {
          eventPart.node.addEventListener(eventPart.name, handler);
          eventPart.handler = handler
        } else {
          eventPart.handler = undefined;
        }
        continue;
      }
      if (part.type === 'childRange') {
        const range = part as ChildRangePart;
        const raw = values[part.index];
        const items = Array.isArray(raw) ? raw : [raw];
        range.itemSpans = range.itemSpans ?? [];
        const parent = range.endNode.parentNode!;

       for (const item of items) {
        const s = document.createComment(`i:${part.index}`)
        const e = document.createComment(`/i:${part.index}`);
        parent.insertBefore(s, range.endNode);
        parent.insertBefore(e, range.endNode);
        const span = { start: s, end: e };
        setSpanContent(span, item, part.host, part);
        range.itemSpans.push(span);
       }
       continue;
      }
    }
    if ((host as any).replaceChildren) {
      (host as ParentNode).replaceChildren(fragment);
    } else {
      const fallback = host as HTMLElement;
      if (fallback.innerHTML !== undefined) fallback.innerHTML = '';
      (host as Node).appendChild(fragment);
    }

    cached = { template: compiled.template, parts, oldValues: [...values] };
    instances.set(identity, cached);
    return;
  }

  const parts = cached.parts;
  for (const part of parts) {
    const newValue = values[part.index];
    const oldValue = cached.oldValues[part.index];
    if (!isDirective(newValue) && isDirective(oldValue)) {
      oldValue.cleanup?.(part, part.host);
      part.directiveInstance = undefined;
      part.dispose = null;
    }
    if (isDirective(newValue)) {

      part.directiveInstance = newValue;
      runDirective(part, newValue, part.host);
      continue;
    }
    if (part.type !== 'childRange' && newValue === oldValue) continue;
    if (part.type === 'node' && part.valueNode) {
      part.valueNode.nodeValue = toText(newValue);
    } else if (part.type === 'attr') {
      const attrPart: AttrPart = part;
      const changed = attrPart.valueIndices.some(i => values[i] !== cached.oldValues[i]);
      if (!changed) continue;

      const node: Element = attrPart.node;
      const finalValue = attrPart.attrStrings
        .map((s, j) => s + (values[attrPart.valueIndices[j]] ?? ''))
        .join('');
      node.setAttribute(attrPart.name, finalValue);
    } else if (part.type === 'event') {
      const eventPart: EventPart = part;
      const node: Element = eventPart.node;
      const handler = newValue as EventListener | undefined | null;
      if (eventPart.handler !== handler) {
        if (eventPart.handler) node.removeEventListener(eventPart.name, eventPart.handler);
        if (typeof handler === 'function') node.addEventListener(eventPart.name, handler);
        eventPart.handler = typeof handler === 'function' ? handler : undefined;
      }
    } else if (part.type === 'childRange') {
      const rangePart = part as ChildRangePart;
      renderRange(rangePart, newValue);
    }
  }
  cached.oldValues = [...values];
}

function renderRange(part: ChildRangePart, rawValue: any[]) {
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
  let pointer: Node | null = part.endNode;

  for (const item of items) {
    const k = keyFn(item);
    let rec = state.get(k);

    if (!rec) {
      const s = document.createComment(`key:${k}`);
      const e = document.createComment(`/key:${k}`);

      parent.insertBefore(s, pointer);
      parent.insertBefore(e, pointer);
      rec = { key: k, start: s, end: e };
    } else {
      let n: Node | null = rec.start;

      while (n) {
        const nextN: Node | null = n.nextSibling;
        parent.insertBefore(n, pointer);
        if (n === rec.end) break;
        n = nextN!;
      }
      state.delete(k);
    }

    setSpanContent(rec, mapFn(item), part.host, part);
    next.set(k, rec);
  }

  for (const rec of state.values()) {
    disposeBetween(rec.start, rec.end, (part as any).allParts);
    parent.removeChild(rec.start);
    parent.removeChild(rec.end);
  }

  (part as any)._keyedState = next;
});
