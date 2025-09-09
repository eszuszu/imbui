import type { WebComponentConstructor } from "@imbui/infuse";
import type { TemplateResult } from "@imbui/cast";


export const DOMAwareMixin = <TBase extends WebComponentConstructor>(Base: TBase) => {
  class LayerElement extends Base {
    preRect?: DOMRectReadOnly;
    computedRect?: DOMRect;

    template?: (rect: DOMRectReadOnly) => TemplateResult;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      
    }

  }
  return LayerElement;
}
