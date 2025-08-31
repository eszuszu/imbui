# Cast
_A mini dom rendering engine with tagged templates, directives, and keyed updates_

## Quick Example

```ts
import { die, cast } from "@imbui/cast"

const name = "imbui";
cast(die`<h1>Hello, ${name}</h1>`, document.body);
```
Cast turns tagged template literals into efficient DOM updates. Static parts are memoized, dynamic values are updated atomically.

💡 Prefer the familiar syntax?
 ```ts
 import { html, render } from "@imbui/cast";
 render(html`<h1>Hello, ${name}</h1>`, document.body);
 ```
Same engine, just different names and still valid.

## Features
  - Tagged template rendering (`die`, `html`)
  - Safe event binding (`onclick=${handler}`)
  - keyed lists for efficient updates
  - Works standalone or with `pulse`/`infuse`, packaged with `core`

## Usage
### Basic rendering
```ts
cast(die`<p>Hello World</p>`, document.body);
```
### Dynamic attributes
```ts
const color = "red";
cast(die`<p class="${color}">This is styled text.</p>`, document.body);
```
### Event listeners
Safely attach events; unsafe on* attributes are replaced at compile time.
```ts
const clickHandler = () => alert("clicked!");
cast(die`<button onclick=${clickHandler}>Click</button>`, document.body);
```
### Ranges and Lists
```ts
//render child ranges
const items = ["a", "b", "c"];
cast(die`
  <ul>
    ${items.map(item => html`<li>${item}</li>`)}
  </ul>
`, document.body);
```
### Keyed Lists
```ts
//keyed directive for optimized updates
cast(die`
  <ul>${
  keyed(item => item, item => die`<li>${item}</li>`)(items)
    }</ul>`
);
```
---
### Integration with `pulse` and signals + effects
```typescript
import { signal, effect } from "@imbui/pulse";
import { die, cast } from "@imbui/cast";
const count = signal(0);

effect(() => {
  cast(die`
    <button onclick=${() => count.set(count.get() + 1)}>
    Count: ${count.get()}
    </button>
  `, document.body)
})
```

### Integration with `infuse`
```typescript
import { ReactiveWebComponentMixin } from "@imbui/infuse";
import { die, cast } from "@imbui/cast";
import { signal } from "@imbui/pulse";

class Counter extends ReactiveWebComponentMixin(HTMLElement) {
  count = signal(0);

  connectedCallback() {
    this.createEffect(() => {
      cast(
        die`<button onclick=${() => this.count.set(this.count.get() + 1)}>Count: ${this.count.get()}
        </button>`,
        this
      )
    })
  }
}
customElements.define("my-counter", Counter)
```

## Why "Cast" and "Die"?

A **die** is a mold, a template, or a cube of possibilities.
To **cast** is to pour, to transform, to make something real.

In Cast, a `die` is your template literal, and to `cast` a `die` is to render one of its states into the DOM.


## Aliases
`die` + `cast` are the defaults.  
`html` + `render` are provided as familiar aliases (especially for Lit users).

Some IDE's and development environments have linting/formatting for `html`-tagged templates.
Use whichever style fits your project best.



