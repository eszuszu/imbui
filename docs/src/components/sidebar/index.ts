import { BaseWebComponentMixin, ElementalWebComponentMixin, infuse, ReactiveWebComponentMixin } from "@imbui/infuse";
import { DOMAwareMixin } from "../primitives";
import { ImbuedWebComponentMixin } from "@imbui/core";

const SidebarInfusion = infuse(
  HTMLElement,
  DOMAwareMixin,
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ReactiveWebComponentMixin,
  ImbuedWebComponentMixin
)

export class Sidebar extends SidebarInfusion {
  constructor() {
    super();
    const slot = document.createElement('slot');
    slot.setAttribute('name', 'sidebar');
    this.shadowRoot.append(slot);
  }
}