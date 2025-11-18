import { BaseWebComponentMixin, ElementalWebComponentMixin, infuse, ReactiveWebComponentMixin } from "@imbui/infuse";
import { DOMAwareMixin } from "../primitives";
import { ImbuedWebComponentMixin } from "@imbui/core";

const HeaderInfusion = infuse(
  HTMLElement,
  DOMAwareMixin,
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ReactiveWebComponentMixin,
  ImbuedWebComponentMixin
)

export class Header extends HeaderInfusion {
  constructor() {
    super();
    const slot = document.createElement('slot');
    slot.setAttribute('name', 'header');
    this.shadowRoot.append(slot);
  }
}