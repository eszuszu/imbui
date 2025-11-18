import {
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ReactiveWebComponentMixin,
  ImbuedWebComponentMixin,
  infuse,
  cast,
  die,
} from "@imbui/core";

const PageErrorInfusion = infuse(
  HTMLElement,
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ImbuedWebComponentMixin,
  ReactiveWebComponentMixin
);


export class PageError extends PageErrorInfusion {
  template = die`
    <h2>404</h2>
    <p>Sorry, the page doesn't exist.<p>
    `
  constructor() {
    super();
    cast(this.template, this.shadowRoot);
  }


  connectedCallback(): void {
    super.connectedCallback?.();

  }
}