import {
  ReactiveWebComponentMixin,
  ElementalWebComponentMixin,
  BaseWebComponentMixin,
  DisposableMixin,
  infuse,
  signal,
  cast,
  die,
} from "@imbui/core";

const HeaderInfusion = infuse(
  HTMLElement,
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ReactiveWebComponentMixin,
  DisposableMixin,
);

export class DemoHeader extends HeaderInfusion {
  index = signal(0);
  greetings: string[] = ['Hello', 'Hola', 'Konnichiwa', 'Ciao', 'Guten Tag', 'Ni hao', 'Namaste'];
  greeting = this.createComputed(() => this.greetings[this.index.get()]);
  sheet = new CSSStyleSheet;

  constructor() {
    super();
    this.adoptedStyleSheets = [this.sheet];
  }


  connectedCallback(): void {
    super.connectedCallback?.();

    this.createEffect(() => {
      cast(die`${this.greeting.get()}`, this.shadowRoot);
    });

    const intervalHandler = () => {
      this.index.set((this.index.get() + 1) % this.greetings.length);
    }
    this.setDisposableInterval(intervalHandler, 4000);
  }

  setDisposableInterval(
    handler: () => void,
    ms: number
  ) {
    const id = setInterval(handler, ms);
    this.onDispose(() => clearInterval(id));
  }
}

