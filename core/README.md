# Imbui Core
**WIP**
The core package provides an opinionated base for rapid development. It focuses on streamlined component registration, lifecycle management, and built-in dependency injection. The detailed API reference is a work in progress and will be available shortly.

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