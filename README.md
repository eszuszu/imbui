# Imbui
A lightweight Front-End toolkit for authoring HTML custom element web components with TypeScript. It provides a modular approach to building, with:

  - `imbui/core`: An opinionated core for a fast tracked workflow.

  - `imbui/infuse`: Tools to help you prototype your own custom components.

  - `imbui/pulse`: A lightweight package for atomic reactivity using signals and effects.

***

**Table of Contents**
- [Imbui](#imbui)
  - [Imbui Core](#imbui-core)
    - [HTML Custom Elements](#html-custom-elements)
    - [Baseline Standard APIs to Know](#baseline-standard-apis-to-know)
    - [Services](#services)
    - [Reactivity](#reactivity)
    - [State](#state)
    - [Routing](#routing)
    - [All the Goodies of pulse and infuse plus:](#all-the-goodies-of-pulse-and-infuse-plus)
  - [Imbui Infuse](#imbui-infuse)
  - [Imbui Pulse](#imbui-pulse)
    - [Signals](#signals)
    - [Effects](#effects)
  - [Examples](#examples)
  - [Ways to Build / Workflows](#ways-to-build--workflows)
    - [SPA (Single-Page Application)](#spa-single-page-application)
    - [SSR (Server-Side Rendering)](#ssr-server-side-rendering)
    - [Static Site Generation](#static-site-generation)
  - [Integrations / Tooling](#integrations--tooling)
    - [Vite](#vite)
    - [TypeScript](#typescript)
  - [Inspirations / Alternatives](#inspirations--alternatives)
  - [Contributions](#contributions)
  - [](#)
  - [Feature Requests](#feature-requests)
  - [License](#license)

***

## Imbui Core
The core package provides an opinionated base for rapid development. It focuses on streamlined component registration, lifecycle management, and built-in dependency injection. The detailed API reference is a work in progress and will be available shortly.

### HTML Custom Elements
This section will detail how `imbui` leverages the web native custom element suite of APIs, such as shadowRoot, adoptedStylesheets, and others, to create encapsulated, reusable components.

### Baseline Standard APIs to Know
Coming Soon

### Services
Details about `imbui`'s service-based architecture and its influence from the MVVM pattern.

### Reactivity
`imbui` uses a signal-based approach with `imbui/pulse` to ensure fine-grained, atomic updates to the DOM, minimizing re-renders and improving performance.

### State
State vs Signals, differences with react. Notes about runtime vs. transpiletime vs. compiletime in the different ecosystems
implementing services, registries as stores, caches, etc.
SWR, fetching, data ingress
History API, browser state which leads to...

### Routing
`imbui/core` includes a minimal routing setup to help you get started
  - 'router-service'
  - 'route-matcher'
  - default config: see further examples*

### All the Goodies of pulse and infuse plus:
  - Animation
    - Web animations api integration with signals, services, streamlined setup
  - Mixins
    - `ContextProviderMixin`: custom event based context API solution to avoid 'prop drilling' in naive components, especially helpful as
    a service provider, allows scoped services with heirarchichical lookup, integral to routing setups.
    - `ImbuedWebComponentMixin` enables service injection, asychronous service subscriptions, and seamless data ingress from context providers
  - And more including: Integration with a 'root' service registry and access, logger, registering stylesheets from strings, programatically, from style rules. Custom elements registering and initialization, and rapid setup powered by Vite. (link to Vite?)

***

## Imbui Infuse
Details on the infuse package, which provides tools to help you prototype and build your own custom components.
  - Anatomy of a TypeScript mixin
    - BaseWebComponentMixin
      - Shadow Dom
      - slots?
      - lifecycle methods
    - ElementalWebComponentMixin
      - opinionated way to query and cache element references
      - other functionality 
    - ReactiveWebComponentMixin
      - easy integration with `imbui/pulse` signals and effects, enables @attributeSignal 
  - Decorators? Quick guide — necessary ES versions, etc.
  - Available
    - @attribute
    - @attributeSignal
    - @signalProperty (legacy)
    - @signalAccessor
  - Anatomy of a decorator
  - Utilities
    - dom-updater-utils
    - mixin-infusion-utils
***

## Imbui Pulse
Details on the pulse package, a lightweight solution for atomic reactivity using signals and effects:

  - Why signals and effects rather than traditional pub/sub, eventing, or even observables?—The answer is that all approaches have their place depending on context and scope, as well as desired effects.
  - Will elaborate: Signals vs Observables vs 'State' (react), Effects vs Events, More info about design patterns in `imbui/core`

### Signals
Details on how to use signals atomically within web components or even Node.js applications.
Signals vs. 'observables'?

### Effects
An elaboration on the mechanics of effects and how to use them—
Dependency tracking, automatic reactivity, `effect()`, vs. `computed()`, cleanup.
***

## Examples
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
***

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

## Contributions
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
##

## Feature Requests
Details on how to get ahold of me (or future project collaborators/maintainers) to request additions or improvements
  - see contributions
  - contact?
  - 
***

## License
Link to the project's license.
