# Imbui Infuse
**WIP**
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