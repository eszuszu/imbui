# Codex Grove, a Digital Garden, Library of Self, Observatory, and Workshop

## Ferments

04/26/2025
- parse markdown using AST schema
- decide on how build pipeline works e.g.
  - run build commands/cli utils = Markdown -> parse -> GroveNode -> generate -> HTML and Web Components w/ slots in static HTML file.
  - i want to avoid fetching content at build preferring to generate as part of build step
- decide on how dev and preview pipeline works e.g.
  - pnpm vite -> Markdown -> realtime parse -> GroveNode -> inject/fetch(?) -> Web Components
  - is it possible to just generate code on change with HMR without it being too crazy, instead of having a dif preview & build pipeline?

05/22/2025 - 05/23/2025
- Starting to formalize API, architecture, and system
Recent code implementations ready to go-`reactive.ts` and `reactive-primitives.ts` containing signals and effects for reactivity.`ServiceScope`, `ServiceRegistry`, general mixins.

Next steps: Implement feed manifest service, other services and Models Refine Base Web Component to offer either light or shadow dom focused templating(?), `<codex-entry>`, `<codex-feed>`, Context API and provider pattern implementation.

Start to ideate on, make, and encourage patterns around routing, etc (this will often be dependent on which domain, e.g. dev, production, early build—and then, migrating to cloudflare D1 or KV, potentially later true backend). This is also to encourage parity—especially while iterating/developing—between static generation and enhancement/hydration behaviors.

## Data Models, Types, Interfaces
  -...maybe `EntryData`, `ResourceMap`, certain signal types *to-implement*

## Components
`<codex-entry>` *to-implement*
  - light ViewModel Orchestrator, ingress: signals, service injection?, uses `EntryDataService` to fetch the `entryData` for its slug. egress: might manage a signal for its own `entryData`: `Signal<EntryData>`
  - methods: `connectedCallback` retrieves `EntryDataService`from the registry and calls `fetchAndPopulate(slug)` or similar method
  - implement `fetchAndPopulate` to intelligently update its existing Light DOM elements based on fetched data. (for static, these elements are already there; for dynamic, they'll have been created by `codex-feed`)

`<codex-feed>` *to-implement*
  - ViewModel, Orchestrator, subscribes to a list of slugs (e.g., from `resource-map` attribute or another *feed manifest* service), manages a signal that represents the list of `EntryData` *objects* it wants to display (e.g. feedEntries: `Signal<EntryData[]>`).
  - When it's resource-map changes (or it loads more slugs), it tells `EntryDataService` to `getEntries(newSlugs).`
  - it then populates/updates its feedEntries signal
  - it renders `<codex-entry>` elements based on the feedEntries signal, passing individual `EntryData` objects down to them (as a property or they subscribe to a signal directly).

  - methods: `connectedCallback` & `renderFeed` for sure-> Identify existing static codex-entry elements, dynamically create new `<codex-entry>`
elements as needed, cloning `<entry-ltpt>` for their light DOM, append new `codex-entry` elements to it's own light DOM.

`<entry-header>`, `<entry-content`>, `<entry-footer>`
  - pure views
  - ingress: pieces of `EntryData` (e.g. headerData, contentData) as attributes/properties or by subscribing to the `<codex-entries>` `entryData` signal or similar. *needs review* with current behavior and possible extension to graceful adoption of signals, Context API pattern, or if attributes are enough.

## Core Architectural Pattern: Pretty much Model-View-ViewModel (MVVM) w/ Web Components
  - Model (i.e. Services): Pure TypeScript classes for data fetching, caching, business logic, exposing reactive state - signals
  - View (UI First Web Components): "Dumb" ingress components, concerned with rendering data received (signals, maybe props) and emitting user interaction events. Manage their own Shadow DOM and slots for composition.
  - ViewModel (Orchestrator/Stateful Web Components): Components that act as a bridge, they can map reactive UI state signals, orchestrate child components, encapsulate context, and interact with Services based on user input or data changing.

## Data Flow & Reactivity:
  - Signals and Effects: Services expose data as Signals. Components (Views and ViewModels) subscribe to these Signals using Effects, which trigger DOM updates.
  - Data Ingress (to components): Properties (complex data/signals), Attributes (for simple primitives), or direct Service Subscription (for components consuming Global Service data).
  - Data Egress (from components): Custom Events (for user interactions or to notify higher-level components/services)

## Service Architecture:
  - `ServiceRegistry`: Global singleton: `register`, `get`, `has`, manages services
  - `ServiceScope`: `provide` `get`, `has`, `delete`, `fork`, allows global or scoped services, will be part of Context API, constructor includes optional `private parent?: ServiceScope`. subscribes the service to it's *internal* services. `get` 'recurses' through parents. `has` return true if the service has the key or it's parent has the key. `fork` returns true if the service has the key or it's parent does.
  - Dedicated Services: Clear *seperation of concerns*; e.g
  - `EntryDataService` (for individual entry data or feed data)*to-implement*
  - `FeedManifestService` (for lists of entry slugs/metadata), Model: role is to fetch and manage the 'manifest' or list of entries. e.g., entry slugs, titles, brief summaries, metadata, etc, for feed or index. *to-implement* *Doesn't fetch the full content of entries*, that's `EntryDataService`.
  - Caching: `FeedManifesService` holds fetched manifest privately, checks if the data is already in memory and fresh, fetches new or serves cached data.

## Caching Strategies:
  - "Stale-While-Revalidate", immediately return the cached data, concurrently initiate a background network fetch, once data arrives, update the cache and trigger reactivity. Need to reason about "stale" and "fresh" data.

### Local Storage/IndexedDB *to-implement*
  - potentially theme preference, other user preferences, subsequent page navigations and other things without full refresh.
  - for services, on their initialization try to load
  - if present populate in-memory cache and display
  - perform background network fetch to update the persistent storage and in-memory cache, design around this to reduce/remove data sync complexity and hydration issues

## More on Data Persistence and Refreshing *to-implement*
  - `localStorage`: persistent user pref, cached data that can be stale, maybe full app state?
  - `sessionStorage`: ephemeral state that persists across *tab refreshes* but not closing, reopening, or other finangling of the browser. current scroll position in a feed, temporary form data, other widget up funsy data. Later, user sessions
  - *URL Search Params* filters, search queries, currently viewed entry's ID. "Bookmarkable" state, state is rehaydrated when page loads.
  - *app initialization* needs to check `localStorage` or `sessionStorage` for saved state. When state changes, *debounce* any writes to `localStorage`.
  - Loading states, skeleton loaders, error messages, etc *to-do*
  
## Error Handling
  - *to-do*
## Testing
  - *to-do*

## Web Component Design & Naming:
  - Componnent Templates: `[component]-stpl` (Shadow DOM content) and `[component]-ltpl` (for inititial Light DOM content—SSG, SSR, Hydration).
  - Mixins, interface `CustomElementLifecycleMethods` & type `WebComponentConstructor` for implementing web component mixins
  - `ReactiveWebComponentMixin`, for creating effect, effect cleanup
  - `BaseWebComponent` currently attaches an open shadow and appends a `*-stpl` template 
  - `[component]-provider` clear convention for components whose primary role is to establish a *Context API* (injecting scoped services or shared state) into their subtree.

## Context API:
  - Purpose: To prevent "prop drilling" and provide scoped, shared state/services
  - Mechanism: Uses a custom bubbling event (`ContextRequestEvent` with `bubbles: true`, `composed: true`) containing a unique `Symbol` (the `ContextKey`) and a callback function. The nearest ContextProvider responds by invoking the callback with the requested Signal/value and calls `event.stopPropagation()`. Consumers set up Effects to react to the received Context Signal.
  - Uses *Scoped Services*, `ServiceScope` in implementation(?)
  
## List Optimization (topics, moods, etc, later—component feeds, dynamic content and widgets, 'SPA' like behavior):
  - Keying: performance... List data should be arrays of objects, each with a *unique and stable ID (`data-key` attr on the rendered `<li>` elements).
  - Reconciliation: Start with simpler `O(N*M)`, later, *two-pointer algo* `O(N+M)` for diffing. Calculate full diff, minimize (add, remove, move, update)

## Complex data passing (i.e. Props)
  - formalize a plan for complex data passing or property passing
  - implement graceful and intuitive convention without too much setup
  - touch base with `data-bind` current implementation and ways to utilize, designate as idiom, or re-work into broader strategy if needed

## Build Step
  - To-do... `JSDOM` for constructing static markup `data-bind` attribute for content generation, etc,~