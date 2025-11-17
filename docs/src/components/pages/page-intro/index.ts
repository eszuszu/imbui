import {
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ReactiveWebComponentMixin,
  ImbuedWebComponentMixin,
  infuse,
  //cast,
  //die,
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
    this.shadowRoot.append(document.createElement('slot'));
  }


  connectedCallback(): void {
    super.connectedCallback?.();

  }
}