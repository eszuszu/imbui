import type { PartBlueprint,
  NodePartBlueprint,
  ChildRangePartBlueprint,
  AttrPartBlueprint,
  EventPartBlueprint,
  Part
} from "../types";

import { nodeFromPath }from "../utils/dom";

export function instantiateParts(frag: DocumentFragment, blueprints: PartBlueprint[]): Part[] {
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