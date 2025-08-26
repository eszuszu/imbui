import type { DirectiveResult, Part } from "../types";
import { DIRECTIVE_SYMBOL } from "../types";

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function directive<Value, Host = any>(
  fn: DirectiveResult<Value, Host>['fn']
) {
  return (value: Value): DirectiveResult<Value, Host> => ({

    [DIRECTIVE_SYMBOL]: true,
    value,
    fn,
  });
}
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isDirective(value: any): value is DirectiveResult<any> {
  return !!(value && value[DIRECTIVE_SYMBOL]);
}
//To-do: try catch block to stop failed directives from stopping render
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runDirective(part: Part, dir: DirectiveResult, host: any) {
  const old = part.directiveInstance;
  const kindChanged = old && old.kind !== undefined && dir.kind !== undefined && old.kind !== dir.kind;
  if (kindChanged && old.cleanup) old.cleanup(part, host);

  part.directiveInstance = dir;

  part.dispose = dir.cleanup ? () => dir.cleanup!(part, host) : null;
  dir.fn(part, dir.value, host, old?.value);
}