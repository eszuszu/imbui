import type {
  Part,
  AttrPart,
  EventPart,
  ChildRangePart,
  TemplateResult
} from "../types";
import { toText } from "../utils/text";
import { disposeBetween } from "../utils/dom";
import { isDirective, runDirective } from "../directives/base";
import { compile } from "../compilation/compile";
import { instantiateParts } from "../parts/instantiateParts";
import { renderRange } from "./renderRange";
import { Runtime, defaultRuntime } from "../runtime/runtime";

//eslint-disable-next-line @typescript-eslint/no-explicit-any
function insertValueBefore(end: Comment, value: any, runtime: Runtime, host?: HTMLElement) {

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
    runtime.moveInstances(fragment, parent); // prototyping runtime service class
    while (fragment.firstChild) parent.insertBefore(fragment.firstChild, end);
    return;
  }
  parent.insertBefore(document.createTextNode(toText(value)), end);
}
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setSpanContent(span: { start: Comment, end: Comment }, value: any, host?: HTMLElement, owningPart?: ChildRangePart) {
  const runtime = owningPart?.runtime ?? defaultRuntime;
  disposeBetween(span.start, span.end, owningPart?.allParts);
  insertValueBefore(span.end, value, runtime, host);
}


export function render(templateResult: TemplateResult, host: ParentNode, hostEl?: HTMLElement, runtime: Runtime = defaultRuntime) {

  const { identity, values } = templateResult;

  const compiled = compile(templateResult, runtime);

  const instances = runtime.getInstances(host);
  const prevActive = runtime.getActiveIdentity(host);

  if (prevActive && prevActive !== identity) {
    for (const [, td] of instances) {

      runtime.disposeTemplateData(td);
    }
    instances.clear();
  }
  runtime.setActiveIdentity(host, identity);
  let instanceData = instances.get(identity);

  if (!instanceData) {

    const fragment = compiled.template.content.cloneNode(true) as DocumentFragment;
    const parts = instantiateParts(fragment, compiled.blueprints);
    parts.forEach(part => {
      part.host = hostEl || (host instanceof HTMLElement ? host : undefined);
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      (part as any).allParts = parts;
      part.runtime = runtime;
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
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((host as any).replaceChildren) {
      (host as ParentNode).replaceChildren(fragment);
    } else {
      const fallback = host as HTMLElement;
      if (fallback.innerHTML !== undefined) fallback.innerHTML = '';
      (host as Node).appendChild(fragment);
    }

    instanceData = { template: compiled.template, parts, oldValues: [...values] };
    instances.set(identity, instanceData);
    return;
  }

  const parts = instanceData.parts;
  for (const part of parts) {
    const newValue = values[part.index];
    const oldValue = instanceData.oldValues[part.index];
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
      const changed = attrPart.valueIndices.some(i => values[i] !== instanceData.oldValues[i]);
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
  instanceData.oldValues = [...values];
}