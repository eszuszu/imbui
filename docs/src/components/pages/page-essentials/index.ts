import {
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ReactiveWebComponentMixin,
  ImbuedWebComponentMixin,
  infuse,
  cast,
  die,
} from "@imbui/core";
import type { TemplateResult } from "@imbui/core";

const PageEssentialsInfusion = infuse(
  HTMLElement,
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ImbuedWebComponentMixin,
  ReactiveWebComponentMixin
);

export class PageEssentials extends PageEssentialsInfusion {
  template: TemplateResult = die`<h2>Essentials</h2>`
  constructor() {
    super();
    this.shadowRoot.append(document.createElement('slot'));
    cast(this.template, this.shadowRoot);
  }


  connectedCallback(): void {
    super.connectedCallback?.();

  }
}