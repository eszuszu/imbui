import {
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ReactiveWebComponentMixin,
  ImbuedWebComponentMixin,
  infuse,
  cast,
  die,
} from "@imbui/core";

const PageIntroInfusion = infuse(
  HTMLElement,
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ImbuedWebComponentMixin,
  ReactiveWebComponentMixin
)

export class PageIntro extends PageIntroInfusion {
  constructor() {
    super();

  }


  connectedCallback(): void {
    super.connectedCallback?.();

    cast(die`<div>HELLO!</div>`, this.shadowRoot);
  }
}