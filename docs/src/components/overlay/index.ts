import { BaseWebComponentMixin, ElementalWebComponentMixin, infuse, ReactiveWebComponentMixin } from "@imbui/infuse";
import { DOMAwareMixin } from "../primitives";
import { ImbuedWebComponentMixin } from "@imbui/core";
import { cast, die } from "@imbui/core";

const OverlayInfusion = infuse(
  HTMLElement,
  DOMAwareMixin,
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ReactiveWebComponentMixin,
  ImbuedWebComponentMixin
)

const slots = die`
<slot name="theme-toggle"></slot>
<slot name="sidebar-toggle"></slot>
`
export class Overlay extends OverlayInfusion {


  sidebarToggle: HTMLButtonElement | null = null;
  constructor() {
    super();
    cast(slots, this.shadowRoot);
  }

  connectedCallback(): void {
    this.sidebarToggle = this.querySelector('[slot="sidebar-toggle"]');
    
    if (this.sidebarToggle != null) {
      this.sidebarToggle.addEventListener('click', () => {
        this.toggleSidebar();
      })
    }
  }


  toggleSidebar(): void {
    const sidebar = document.querySelector('ui-sidebar') as HTMLElement;

    if (sidebar != null) {
      sidebar.classList.toggle('expanded');
    }
  }


}