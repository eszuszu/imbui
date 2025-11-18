---
title: "Intro"
tag: "page-intro"
api: "intro"
created: "2025-09-12"
updated: "updated"
slug: "intro"
id: "2025-09-12-intro"
---

# imbui is a forward looking, front-end toolkit for authoring browser native Custom Element web components and interactive experiences.

Built to utilize the browser and client-side capabilities, outside of the black-box of monolithic frameworks and ecosystems—*imbui* takes a *framework atomics* approach instead. It offers modular, composable packages, that can be used together synergistically or can individually slot into your project; Modern approaches to reactivity with `signals` and `effects`, *component mixins*, *decorators*, and utilities, and a small *templating engine* built on tagged template literals provide an endless range of possibilites to compose and design.

**the vision, imbui**

Learn the fundamentals of native *custom elements*, the *shadow DOM* and alternative approaches to style isolation, and more. Open up a whole new paradigm of building on the client. 

SPA, SSR, SSG, RPC, alphabet soup! Don't know what any of this is? That's okay, sometimes you just want a static website with a game—or widget; you're prototyping, learning, perfect. I built `imbui` with *learners*, *design engineers*, *prototypers* and *framework authors* in mind, that means its meant to be as unopinionated as I can make it. No React, Angular, Vue, or Svelte, not even Solid, or Lit. *imbui* was built with no outside dependendencies, just dev dependencies. That means you can use it as a base, pick pieces of it apart, or extend it at will without needing to buy into any other ecosystem.

## Packages

**`imbui/pulse`**

**`imbui/cast`**

**`imbui/infuse`** (dependency: pulse)

**`imbui/core`** (dependency: pulse & infuse)

Each package can be imported individually.

`core` is the most opinionated and includes both pulse and infuse. It's a microframework for custom elements built with imbui's other packages, but with no opinion about rendering to the DOM beyond custom elements. It offers the scaffolding for more involved projects: a context provider API, dependency injection workflows, services for client-side routing. Fetching utilities, and animation helpers, and exposes `infuse` and `pulse` and their primitives for your own building.

`infuse` is all about composing custom elements. It introduces the utility `infuse` that makes applying chains of custom element mixins seamless and type aware. It contain's a Base custom element mixin together with a suite of mixins for extensible reactivity and DOM book-keeping. It also includes declarative web component standard TypeScript **decorators**, for hooking into custom elements to extend their behavior—like adding reactive attributes, or logging lifecycle methods.

`pulse` powers all of the reactivity in core and is my implementation of `signal` and `effect` primitives and the general dependency tracking reactive programming design pattern. Super light-weight, pulse can be used alone to drive reactivity in your project, used as the primary reactive driver for `imbui` components or workflows, or to extend custom solutions. Signals hold state, effects react automatically when signals change.

`cast` is an HTML templating solution built with tagged template literals and the `TemplateStringsArray` they utilize. Inspired by `lit.js`, `marked.js`, and the philosophy of optimized, atomic updates—you can create static html layouts that contain isolated areas of dynamic content. Render nested templates, lists, even create *keyed* lists with the `keyed` directive for truly atomic updates to dynamically rendered list.