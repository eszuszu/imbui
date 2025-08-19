# Imbui
**This Documentation is a work in progress**

**Imbui** is a modern and forward looking front-end toolkit for building HTML custom elements with TypeScript. Unlike all-in-one frameworks, imbui provides a transparent, modular foundation that helps teach you how the web works under the hood. It’s a workbench of composable utilities for atomic reactivity, declarative DOM updates, and service-based architecture, allowing you to build from the ground up or integrate with existing projects.

  - `imbui/core`: An opinionated core for a fast tracked workflow.

  - `imbui/infuse`: Tools to help you prototype your own custom components.

  - `imbui/pulse`: A lightweight package for atomic reactivity using signals and effects.
  
  > Think of `/core` as the workbench and `/infuse` as tools inside, `/pulse` contains the reactive primitives
  > that power it all.

***

**Table of Contents**
- [Imbui](#imbui)
  - [Quick Start](#quick-start)
  - [HTML Custom Elements](#html-custom-elements)
    - [Want to learn more about Custom Elements?](#want-to-learn-more-about-custom-elements)
  - [Documentation](#documentation)
  - [Examples](#examples)
  - [Ways to Build / Workflows](#ways-to-build--workflows)
    - [SPA (Single-Page Application)](#spa-single-page-application)
    - [SSR (Server-Side Rendering)](#ssr-server-side-rendering)
    - [Static Site Generation](#static-site-generation)
  - [Integrations / Tooling](#integrations--tooling)
    - [Vite](#vite)
    - [TypeScript](#typescript)
  - [Inspirations / Alternatives](#inspirations--alternatives)
  - [Contributing](#contributing)
  - [Feature Requests](#feature-requests)
  - [License](#license)

***
## Quick Start


The simplest thing you can do with `imbui` is to grab the `signal` and `effect` primitives from `imbui/pulse`
```typescript

// Here's a toy example setting up a basic reactive pipeline
// First, import these from 'imbui/pulse'
import { signal, effect } from '@imbui/pulse';

// We'll going to create a 'signal' to hold our dynamic data.
// A signal can be any value—a string, number object, etc.
const myDynamicText = signal('My (maybe) first signal.');

// Next, let's create a <p> element to display the text.
const myParagraph = document.createElement('p');

// Now, we'll create an effect to automatically update the paragraph's
// textContent whenever myDynamicText's value changes.
effect(() => {
    
  // We're 'getting' the signal's value here.
  // This automatically sets up a dependency, so `effect` will
  // rerun whenever `myDynamicText` is updated.
  myParagraph.textContent = myDynamicText.get();

});



// To see it in action, let's append the paragraph to the body.
document.body.append(myParagraph);

setTimeout(() => {
  myDynamicText.set('The signal value has changed!');
}, 2000); // The paragraph's text will update after 2 seconds.
```
***

**`infuse`** offers some more fundamental pieces to get started building,
here is how easy a web component with reactivity built-in is to get set up:

```typescript

// First, import the signal primitive and the ReactiveWebComponentMixin.
import { signal, ReactiveWebComponentMixin } from '@imbui/infuse';

// This is our reactive state. We will connect it to our component.
const myDynamicText = signal('My other signal.');

// We use the ReactiveWebComponentMixin to add reactive capabilities
// to a standard HTMLElement.
class MyComponent extends ReactiveWebComponentMixin(HTMLElement) {
  constructor(){
    super();
  }
  // The connectedCallback is the best place to create effects.
  // The ReactiveWebComponentMixin automatically manages the effect's
  // lifecycle, ensuring it is properly disposed when the component
  // is removed from the DOM.
  connectedCallback(){
    // We create the effect here using the mxin's helper method.
    // This call automatically registers the effect for cleanup.
    this.createEffect(() => {
      this.textContent = myDynamicText.get();
    });
  }
}

// Register our new component definition with the custom element registry
window.customElements.define('my-component', MyComponent);

// We'll create our new element with the native `createElement` API:
const myComponent = document.createElement('my-component');
document.body.append(myComponent);

// The component's text is now the initial signal value.
console.log(myComponent.textContent); // Outputs: "This is the initial text."

// At this point, signal is the initial value, 'My other signal.'
// If we change it, using `set()`:
myDynamicText.set('New signal text value');
// It's now updated. 
// And now every time the signal is set, the component updates automatically.

```
***
## HTML Custom Elements
New to custom elements and native web components?
Check out MDN's Web Docs here:
[Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)

### Want to learn more about Custom Elements?

- **Curious about compatibility?** Here's a site that tests frameworks for their compatibility with native custom elements: [The Custom Elements Everywhere Project](https://custom-elements-everywhere.com/)

- 'web components' search on css-tricks.com: [CSS Tricks search="web components"](https://css-tricks.com/?s=web%20components)
- **Feeling lazy?**

  Copy and paste this prompt into your favorite LLM:

    > "Explain the core concepts of HTML Custom Elements, including Shadow DOM, the template tag, and the element lifecycle callbacks. Use a simple analogy to make it easy to understand. 🧠"

## Documentation

- [**Imbui Core**](./core/README.md)
- [**Imbui Infuse**](./infuse/README.md)
- [**Imbui Pulse**](./pulse/README.md)

***

## Examples

**WIP** at the moment this is more of a roadmap for the docs:
- `imbui/pulse`
  - Basic form with client side validation.
  - Message popup on form submit.
- `imbui/infuse`: 
  - Using mixins to quicken development by creating a reusable card component
  - using utilities to make consistent and reliable DOM updates and mutations by updating a list
  - Leading into `imbui/core`—Building a 'service' for data egress to components.
- `imbui/core`:
  - How to set up an app project
    - What to expect, what's not included, additional resources 
    - Configuring your environment
    - Vite
    - TypeScript
    - What's available in a given dev setup (ESM vs. TypeScript)
    - Building for production  
  - Creating a router-link and a app-router component
  - Creating an animation controller enabled component
  - How to use the SWR fetcher utility


## Ways to Build / Workflows

### SPA (Single-Page Application)
Coming Soon

### SSR (Server-Side Rendering)
Coming Soon

### Static Site Generation
Coming Soon

***

## Integrations / Tooling

### Vite
Info
Config
Links

### TypeScript
Info
Config
Links

***

## Inspirations / Alternatives
- Lit web components
- Solid.js components, signal based reactivity
- Angular.js services
- MVVM
- and other reactive libraries using signals, observables, and novel reactive systems beyond traditional event queues or pub/sub

This section will elaborate on the design patterns and architectural inspirations behind `imbui`, such as the MVVM pattern and the concept of Front-End "services" as UI providers.

***

## Contributing
Details on how to contribute to the project.
  - Setting up your dev environment
  - getting the repo
- **I'm currently looking for help testing, implementing/dialing in code standards/cleanliness, dialing in/defining semantic primitives, elaborating with the project examples, more examples. Also:**
  - help identifying and working through project roadmap and milestones
  - help with managing the project, enabling and promoting communication with all project stakeholders,
  - currently looking for awesome collaborators and professional mentors, if you are
    -  attentive,
    -  sharp,
    -  passionate,
    -  and compassionate
    - *I'd love to hear from you, please please please reach out :)* 

## Feature Requests
Details on how to get ahold of me (or future project collaborators/maintainers) to request additions or improvements
  - see contributions
  - contact?
***

## License
Link to the project's license.
