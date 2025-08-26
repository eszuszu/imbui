/* eslint-disable @typescript-eslint/no-explicit-any */
export interface TemplateResult {
  identity: TemplateStringsArray;
  strings: TemplateStringsArray;
  values: any[];
  key?: string;
}

export const DIRECTIVE_SYMBOL = Symbol('__directive');

export interface DirectiveResult<Value = unknown, Host = any,> {
  [DIRECTIVE_SYMBOL]: boolean;
  value: Value;
  fn: (part: Part, value: Value, host?: Host, oldValue?: any) => void;
  cleanup?: (part: Part, host?: Host) => void;
  kind?: any;
}

export type PartType = "node" | "attr" | "event" | 'childRange';

export interface BasePart {
  type: PartType;
  index: number;
  host?: HTMLElement;
  directiveInstance?: DirectiveResult;
  dispose?: (() => void) | null;
}

export interface NodePart extends BasePart {
  type: "node";
  node: Comment;
  valueNode?: Text | null;
}

export interface AttrPart extends BasePart {
  type: "attr";
  node: Element;
  name: string;
  attrStrings: string[];
  valueIndices: number[];
}
export interface EventPart extends BasePart {
  type: "event";
  node: Element;
  name: string;
  handler?: EventListener;
}

export interface ChildRangePart extends BasePart {
  type: "childRange";
  startNode: Comment;
  endNode: Comment;
  itemSpans?: Array<{ start: Comment; end: Comment }>;
  allParts?: Part[];
}

export type Part = NodePart | AttrPart | EventPart | ChildRangePart;

export type NodePath = number[];

export interface PartBlueprintBase {
  type: PartType;
  index: number;
}
export interface NodePartBlueprint extends PartBlueprintBase {
  type: "node";
  path: NodePath;
}
export interface ChildRangePartBlueprint extends PartBlueprintBase {
  type: "childRange";
  startPath: NodePath;
  endPath: NodePath;
}
export interface AttrPartBlueprint extends PartBlueprintBase {
  type: "attr";
  path: NodePath;
  name: string;
  attrStrings: string[];
  valueIndices: number[];
}
export interface EventPartBlueprint extends PartBlueprintBase {
  type: "event";
  path: NodePath;
  name: string;
}
export type PartBlueprint =
  | NodePartBlueprint
  | ChildRangePartBlueprint
  | AttrPartBlueprint
  | EventPartBlueprint

export interface Compiled {
  template: HTMLTemplateElement;
  blueprints: PartBlueprint[];
}
export interface TemplateData {
  template: HTMLTemplateElement;
  parts: Part[];
  oldValues: any[];
  dispose?: () => void;
}