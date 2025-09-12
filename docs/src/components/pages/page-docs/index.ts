import {
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ReactiveWebComponentMixin,
  ImbuedWebComponentMixin,
  infuse,
  cast,
  die,
} from "@imbui/core";

const PageDocsInfusion = infuse(
  HTMLElement,
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ImbuedWebComponentMixin,
  ReactiveWebComponentMixin
)

export class PageDocs extends PageDocsInfusion {
  constructor() {
    super();

  }


  connectedCallback(): void {
    super.connectedCallback?.();

    cast(die`<div>HELLO!</div>`, this.shadowRoot);
  }
}