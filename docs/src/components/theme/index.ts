import { BaseWebComponentMixin, ElementalWebComponentMixin, infuse, ReactiveWebComponentMixin, signal } from "@imbui/infuse";
import type { Signal } from "@imbui/infuse";
import { DOMAwareMixin } from "../primitives";
import { ImbuedWebComponentMixin } from "@imbui/core";
import { cast, die } from "@imbui/core";

const ThemeToggleInfusion = infuse(
  HTMLElement,
  DOMAwareMixin,
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ReactiveWebComponentMixin,
  ImbuedWebComponentMixin
)

const slots = die`
<slot></slot>
`
type ThemeType = 'light' | 'dark';

export class ThemeToggle extends ThemeToggleInfusion {
  theme: Signal<ThemeType> = signal<ThemeType>('light');
  themeToggle: HTMLButtonElement | null = null;
  constructor() {
    super();
    cast(slots, this.shadowRoot);
  }
  
  connectedCallback(): void {
    this.theme.set(this.getTheme() as ThemeType);
    this.themeToggle = this.querySelector('button');

    if (this.themeToggle != null) {
      this.themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      })
    }

    this.createEffect(() => {
      localStorage.setItem('theme', this.theme.get());
      document.documentElement.dataset.theme = this.theme.get();
      console.log(this.theme.get());
    })
  }

  getTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
      return savedTheme;
    }
    return prefersDark ? 'dark' : 'light';
  }


  toggleTheme = () => {
    const newTheme = this.theme.get() === 'dark' ? 'light' : 'dark';
    this.theme.set(newTheme);
  }
}