# Codex Grove, a Digital Garden, Library of Self, Observatory, and Workshop

## Ferments

> This part of the introduction is old and kept mostly for documenting my thought process:

> 04/26/2025
> - parse markdown using AST schema
> - decide on how build pipeline works e.g.
>  - run build commands/cli utils = Markdown -> parse -> GroveNode -> generate -> HTML and Web Components w/ slots in static HTML file.
>  - i want to avoid fetching content at build preferring to generate as part of build step
> - decide on how dev and preview pipeline works e.g.
>  - pnpm vite -> Markdown -> realtime parse -> GroveNode -> inject/fetch(?) -> Web Components
>  - is it possible to just generate code on change with HMR without it being too crazy, instead of having a dif preview & build pipeline?

> /End old documentation, things after are much more up to date.

05/22/2025 - 05/23/2025
- Starting to formalize API, architecture, and system
Recent code implementations ready to go-`reactive.ts` and `reactive-primitives.ts` containing signals and effects for reactivity.`ServiceScope`, `ServiceRegistry` (*update 6/10/2025* will be updated with ServicScope to use fork), general mixins, `EntryDataService`, with basic method for single entry.

Next steps: `<codex-grove>` and view swapping, Routing, Implement feed manifest service, SWR, other services and Models Refine Base Web Component to offer either light or shadow dom focused templating(?), `<codex-feed>`, Context API and provider pattern implementation.

Start to ideate on, make, and encourage patterns around routing, etc (this will often be dependent on which domain, e.g. dev, production, early build—and then, migrating to cloudflare D1 or KV, potentially later true backend). This is also to encourage parity—especially while iterating/developing—between static generation and enhancement/hydration behaviors. I want to look into edge functions, service workers, cloudflare workers, etc. Also, can I use the Navigation API, or stick with History API, a lot to think about.

## CI/CD and DevOps specifics (added 06/04/2025)
  Using node and Vite for dev server, HMC, bundling, building. Need to review cache busting strategies and package.json, typescript, and vite options and settings, some defaults seem to have disapeared.

  - Refine Vite's build output and options for optimal production build using Cloudflare, Github
  - start to research and learn more about Workers, edge functions, and capabilites here.

## Data Models, Types, Interfaces
  -...maybe `EntryData`, `ResourceMap`, `FeedManifest`(?), perhaps canonnical 'interface' structures for expected dom templates or content, certain signal types *mid-implementation*

## Core Architectural Pattern: Pretty much Model-View-ViewModel (MVVM) w/ Web Components
  - Model (i.e. Services): Pure TypeScript classes for data fetching, caching, business logic, exposing reactive state - signals
  - View (UI First Web Components): "Dumb" ingress components, concerned with rendering data received (signals, maybe props) and emitting user interaction events. Manage their own Shadow DOM and slots for composition.
  - ViewModel (Orchestrator/Stateful Web Components): Components that act as a bridge, they can map reactive UI state signals, orchestrate child components, encapsulate context, and interact with Services based on user input or data changing.

## Data Flow & Reactivity:
  - Signals and Effects: Services expose data as Signals. Components (Views and ViewModels) subscribe to these Signals using Effects, which trigger DOM updates.
  - Data Ingress (to components): Properties (complex data/signals), Attributes (for simple primitives), or direct Service Subscription (for components consuming Global Service data).
  - Data Egress (from components): Custom Events (for user interactions or to notify higher-level components/services)

## Service Architecture:
  - `ServiceRegistry`: Global singleton: `register`, `get`, `has`, manages services (*update 6/10/2025* this will be changed to just the ServiceScope, then I can fork for scoped services.)
  - `ServiceScope`: `provide` `get`, `has`, `delete`, `fork`, allows global or scoped services, will be part of Context API, constructor includes optional `private parent?: ServiceScope`. subscribes the service to it's *internal* services. `get` 'recurses' through parents. `has` return true if the service has the key or it's parent has the key. `fork` returns true if the service has the key or it's parent does.
  - Dedicated Services: Clear *seperation of concerns*; e.g
  - `EntryDataService` (for individual entry data or feed data)*touch base*
  - `FeedManifestService` (for lists of entry slugs/metadata), Model: role is to fetch and manage the 'manifest' or list of entries. e.g., entry slugs, titles, brief summaries, metadata, etc, for feed or index. *mid-implementation, touch-base* *Doesn't fetch the full content of entries*(?), that's `EntryDataService`.
  - Caching: `FeedManifesService` holds fetched manifest privately, checks if the data is already in memory and fresh, fetches new or serves cached data. *reworked to SWR fetcher*
  
## Context API:
  - Purpose: To prevent "prop drilling" and provide scoped, shared state/services
  - Mechanism: Uses a custom bubbling event (`ContextRequestEvent` with `bubbles: true`, `composed: true`) containing a unique `Symbol` (the `ContextKey`) and a callback function. The nearest ContextProvider responds by invoking the callback with the requested Signal/value and calls `event.stopPropagation()`. Consumers set up Effects to react to the received Context Signal.
  - Uses *Scoped Services*, `ServiceScope` in implementation
  
## Components
`<codex-entry>` *touch base*
  - light ViewModel Orchestrator, ingress: signals, service injection?, uses `EntryDataService` to fetch the `entryData` for its slug. egress: manages `Signals` for child components.
  - methods: `connectedCallback` retrieves `EntryDataService`from the registry
  - Orchestrates child components to intelligently update based on fetched data. (for SSR, these elements are already there; for dynamic, they'll have been created by `codex-feed`)

`<codex-feed>` *to-implement*
  - ViewModel, Orchestrator, subscribes to a list of slugs (e.g., from `FeedManifestService` or attribute w/ string slug of the feed), manages a signal that represents the list of `EntryData`/`CodexItem`, whatever, *objects* it wants to display (e.g. feedEntries: `Signal<EntryData[]>`)(?).
  - When it's resource-map/feed-manifest changes (or it loads more slugs), it tells `EntryDataService` to `getEntries(newSlugs).` *touch base with new architecture*
  - it then populates/updates its feedEntries signal
  - it renders `<codex-entry>`or `<codex-item>`/summary elements based on the feedEntries signal, passing individual `EntryData` objects down to them (as a property or they subscribe to a signal directly).

  - methods: `connectedCallback` & `renderFeed` or similar for sure-> Identify existing static codex-entry or feed item elements, dynamically create new `<codex-entry>` or item
elements as needed, cloning `entry-ltpt` for their light DOM, append new `codex-entry` elements to it's own light DOM.

`<entry-header>`, `<entry-content`>, `<entry-footer>`
  - pure views
  - ingress: pieces of `EntryData` (e.g. headerData, contentData) as attributes/properties or by subscribing to the `<codex-entry>`s `entryData` signal or similar. *needs review* with current behavior and possible extension to graceful adoption of signals, Context API pattern, etc. 
  - *(update 06/04/2025)* These View components are ready, they recieve data from CodexEntry and propogate the data to their forecasted (*update 6/10/2025* this terminology is now legacy, forcasted referred to `<slot>` elements template cloned and appended to the shadow dom) elements.
  
`<codex-grove>`
  - right now this is my top level app component. Atm it mostly just orchestrates the apps slots for the main app view 'shapes' as hinted at by SSR(or the SSG output) content or routing. This is in an experimental state still and needs work. Right now is succesfully swaps out views, but doesn't seem to be mounting programmatically (well cloned templates) created nodes by slotting them. If I manually change 'data-view' in my markup to 'feed-view- the feed-view related template isn't being slotted as far as I can tell.
  - *(update o6/04/2025)* This 'view swapping/orchestration' logic will be lifted out to a dedicated service. slots, their types, current assignments, and things like that may still be invaluble as internal maps though, maybe exposed as signals?
## Web Component Design & Naming:
  - *(update 06/04/2025)* this is legacy terminology. This is some of the 'semantic primitives' and their reflection to markup that needs refinedment:
   > Componnent Templates: `[component]-stpl` (Shadow DOM content) and `[component]-ltpl` (for inititial Light DOM content—SSG, SSR, Hydration).
  - Mixins, interface `CustomElementLifecycleMethods` & type `WebComponentConstructor` for implementing web component mixins
  - `ImbuedWebComponentMixin`, for injecting common services or dependencies (like loading a template and appending it to the dom or exposing it to be programmatically adjusted); Can also be in charge of caching it's slots, slotted content, whatever needed.
  - `ReactiveWebComponentMixin`, for creating effect, effect cleanup, *consider a reative 'property' signal implementation for mixins
  - `BaseWebComponent` *(this is legacy, template loading is now in imbued)* currently attaches an open shadow and appends a `*-stpl`(-stpl is legacy, need to change naming convention) template *to-review* add options, *(updated 6/10/2025)* added ability to push down shadow dom instantion that resolves to default unless slot assignnment explicitly set to 'manual', can add options about appending the template either to it's light or shadow dom.
  - `[component]-provider` clear convention for components whose primary role is to establish a *Context API* (injecting scoped services or shared state) into their subtree, currently have an early component mixin that implements this. Prototyping and implementation patters will be helpful to explore.

## Caching Strategies:
  - "Stale-While-Revalidate", immediately return the cached data, concurrently initiate a background network fetch, once data arrives, update the cache and trigger reactivity. Need to reason about "stale" and "fresh" data.
  - (added early 06/2025) data-fetcher-utils.ts which exports `createSWRFetcher`, a function to create a new fetcher instance, takes fetcher options, returns fetcher state
  - `createSWRFetcher` can be used for FeedManifestService, other places when caching might come in handy layer.
  - 
### Local Storage/IndexedDB *to-implement*
  - potentially theme preference, other user preferences, subsequent page navigations and other things without full refresh.
  - for services, on their initialization try to load
  - if present populate in-memory cache and display
  - perform background network fetch to update the persistent storage and in-memory cache, design around this to reduce/remove data sync complexity and hydration issues
  - this might come later, currently the planned CodexRouter will take over routing client side on hydration, but as the Navigation API, and other edge case routing concerns or robust patterns begin to reveal themselves I'll look back into this.

## More on Data Persistence and Refreshing *to-implement*
  - `localStorage`: persistent user pref, cached data that can be stale, maybe full app state (theme, small state)?
  - `sessionStorage`: ephemeral state that persists across *tab refreshes* but not closing, reopening, or other finangling of the browser. current scroll position in a feed, temporary form data, other widget up funsy data. Later, user sessions, maybe for me to edit site content, even, from an admin panel... (way later).
  - *URL Search Params* filters, search queries, currently viewed entry's ID. "Bookmarkable" state, state is rehaydrated when page loads.
  - *app initialization* needs to check `localStorage` or `sessionStorage` for saved state. When state changes, *debounce* any writes to `localStorage`.
  - 
## Loading *implementing-ish*
  - refine skeletons and loaders for layout and UI. Includes loading states and error states.
  - Should I look into clearly defining these content states as types/interfaces or states? 
## Error Handling
  - *to-do*
  - Components need to know local erros too, possibly
  - Error service?
## Testing
  - *to-do*
  - *touch base on when implementing may be worth*
  
## List Optimization (topics, moods, etc, later—component feeds, dynamic content and widgets, 'SPA' like behavior) *to-do*:
  - Keying: performance... List data should be arrays of objects, each with a *unique and stable ID (`data-key` attr on the rendered `<li>` elements).
  - Reconciliation: Start with simpler `O(N*M)`, later, *two-pointer algo* `O(N+M)` for diffing. Calculate full diff, minimize (add, remove, move, update)

## Complex data passing (i.e. Props)
  - formalize a plan for complex data passing or property passing (mostly done now with signals, services, effects, data-attributes, and now the context api)
  - implement graceful and intuitive convention without too much setup
  - touch base with `data-bind` current implementation and ways to utilize, designate as idiom, or re-work into broader strategy if needed *(updated 06/10/2025 possibly being reworked to `data-ref` or other convention/semantic primitive. Will review)*

### *(updated 06/04/2025)*
  - complex data will be passed via signals/effects, primitive data with observed attributes and attributeChangeCallback. Context API pattern to avoid prop drilling.
  - `data-binds` are being registered in componets through BaseWebComponent method `scryBoundElements()`
  - *(06/10/2025)* I need to review theses data-attributes and update all the scry methods.
### *(updated 06/05/2025)*
  - Formalizing pattern for selecting either *light or shadow* DOM based elements. Suggested `data-forecast` for projected content. Currently using the `part` attribute as a selector for slotted/projected/light dom content. New experimental methods on `BaseWebComponentMixin`: `scryForecastedSlots`, `getForecastedElement`, and `getForecastedContainer`. "`getForecastedContainer`" returns the *light dom* elements currently assigned to the slot, which is retrieved with `getForecastedElement`. I'm wondering if it might be simpler to have another *light DOM focused* data-attribute to match `data-forecast`; Something like `data-ray`, `data-glimmer`, `data-trace`, etc. Even if the logic stays the same, using this attribute instead of '`part`' is more clear maybe?.
  
  ### *(updated 06/10/2025)* These conventions are now legacy, this is part of implementation that needs more clarity and refinement.
  > - This would then give me the conventions `data-bind`, `data-forecast`, and `data-ray(?)`, 
  > - where `data-bind` is an attribute on shadow DOM elements, for components to scry within their own shadow DOM.
  > - `data-forecast` is an attribute on `<slot>` elements, that suggests they will be part of a hydration rather than replacement funnel, and give access to the new methods.
  > - `data-ray` *Personal Note:* I'm thinking about how the data is 'projected' and the use of terms like 'hydration' I'm already leaning into 'scry' and 'bind', something with this vibe.

## Routing
  - *To-Do*: CodexRouter or similar, implement a RoutingService, utilize slots and  `slotAssignment: 'manual' for 'main view' swapping.
  - *(updated 06/05/2025)* I now have a `CodexGrove` component that is orchestrating the apps main 'views', island style. Implementation details are experimental. So far it utilizes new attributes `data-template` and `data-view`, changing `data-view`s value from 'entry-view' to 'feed-view', etc, should trigger `CodexGrove` to reactively orchestrate the DOM nodes to swap, replacing the currently slotted content. This has been tricky because the Site is SSG/SSR focused, where the initial content when navigating to the page is static and the components elegantly enhance them as they mount. But, upon app initialization, client side routing takes over, when the main view swaps i.e. from entry-view to feed-view, I need to replace it with new nodes. This means that my architecture so far utilizes *both ligh DOM content enhancement* with limited content hydration, *AND also shadow DOM content being a 'replacer'*
  - ### *AS AN EXAMPLE*
    Scenario 1: User navigates to a page that defaults with an entry-view on it's SSR page and markup.
      - The app gracefully takes over and hydrates, the SSR/SSG markup is the same as the mounting dynamic component so little changes, *important* unbeknowst to the user, *SSR content is projected/slotted* on component mount.
      - The user then uses the app to navigate to a *new* entry but with the same 'view'. Because `data-view` doesn't change, the new content *hydrates the existing Light DOM elements*. This works by targeting the Light DOM and changing (i.e. in EntryHeader, it reactively updates the *text content* of slotted Light DOM) content in it, this results in minimal DOM updates.

    Scenario 2: User navigates to a page that defaults with an entry-view on it's SSR page and markup.
      - The app gracefully takes over and hydrates, the SSR/staticgen markup is the same as the mounting dynamic component so little changes. SSR content is slotted/projected like before.
      - *this is where scenarios differ* the user navigates to 'home' but it has a 'feed-view'. The changing `data-view` causes `CodexGrove` to swap out the assigned slot.
      - The current-soon-to-be-previous static content is no longer of the same *'shape'* as the wanted 'feed-view', so *instead of hydration, we completely disconnect* the currently slotted main-view content, and then we reconnect new nodes in the 'shape' we need, which is done by cloning from templates that already exist in the DOM.
      - If we want to swap back to an 'entry-view' we need to, again, re-slot dom nodes *of the expected shape*. this likely will also be done by grabbing from templates, this also leads into a proposed Template registry service. *(update 06/10/2025 Template Registry Service mid implementation, Template registry copmponent implemented, currently prototyping)*
  - *To-Do*: formalize implementation details, types, interfaces, and function/class signatures and annotations. Utilize and incorporate Context API patterns, custom events, slotchange .upgrade().

  - CustomElementRegistry service. *(update 06/10/2025 implemented, helps with async weirdness)*
    - Centralized definition
    - Async loading/definitions
    - definition check
    - lifecycle management: i.e. expose hooks/signals for when an element *type* is defined, not just when an instance connects.
    - performance: map lookup
    - DevX



## Build Step
  - To-do... `JSDOM` for constructing SSG/SSR markup `data-bind` (legacy) attribute and/or other data-* attribute conventions for static content generation, etc,~ *To-do* need to formalize how this will be output. I plan to use canonical urls of .html pages (or whatever) with the static, ready to be enhanced, markup already there when delivered/on first paint.

## Styling
  - Vite raw CSS imported and use of AdoptedStylesheets for shadow dom styles especially. Custom CSS properties, psuedo selectors and selectors like ::part() ::sloted() ::has-slot(). Solid naming convention for CSS intended Globally, for the light dom, and for shadow dom. (e.g. \*-shadow.css, \*-light.css), Container queries to manage how slotted content/ or shadow content, assumes dimensions and other features from it's host or container elements. *To-do*, more broadly formalize a pattern around selecting or otherwise manipulating elements intended for certain behaviors, e.g. `data-layout` or something like this. `data-view`. Importantly, also design CSS classes and markup with these conventions in mind, to gracefully create a robust styling, animation, and transition system. Come up with explicit pattern around `parts` and `export parts`, whats should be encapsulated, what should be exposed, etc.
### more on styling
  - consider context/provider pattern for style specific dom manipulations, e.g. managing transitions, complex animations and API, functions, methods, services, for managing style compositing behavior, animation timelines, this will likely need to be well integrated with the apps general timing and stateful changing, this might even end up including queues, frame rate and other update logics, batching, complex element style transformations, and later maybe help to work in tandem with SVGs, Canvas, Transitions API, RouterService, etc. 

## 05/30/2025 - 06/04/2025
 - recent and ready: SWR fetcher, EntryDataService registering, caching, managing of multiple entries. Now managing async methods and custom element definitions gracefuly in main.ts and init.ts, as well as ViewModel logics, CodexEntry child components accepting data and propogating changes.

 To-do: CodexGrove as app 'view' (not to be confused with MVVM, this 'view' is the current apps pages layout) orchestrator/controller. RouterService and CodexRouter, Context API, revisit BaseWebComponent for integrating variable options and logical defaults *(updated 06/07/2025)* Created ImbuedWebComponentMixin, who's job is to inject Services or other dependencies used on most components (logging, templates, custom elements), formalize data and structure propogation through shadow DOMs in multi-layered projected/replaced content. *(update 06/05/2025 as of 06/10/2025 now legacy but the idea is still important conceptually)*, implemented these methods in BaseWebComponent mixin. Formalized standard around selecting (scrying) elements that are 'projected'/slotted (data-forecast is the slot, `getForcast()` returns the slotted container), specific elements part of that slotted content (data-ray), and elements that are in the ShadowDom and not projected (data-bind) I really need to also formalize a plan for where `<template>` element schemas will exist, this is also important for the proposed template registry service. (will likely be top level of app, if I end up having a lot I'll likely move them to modules that export HTMLTemplateElement and can utilize the SWRFetcher);

 ## 06/05/2025
  Other further things to consider, mostly in order of importance but all on my radar:
  - Router Params/Route Data: Router service needs to be able to parse URL parameters (e.g., /entry/:slug) and provide these params to the CodexGrove (or CodexViewController) and ultimately to CodexEntry.
  - Transitions API / Shared Element Transitions (Browser): also CSS Transitions/Animations.
  - Offline Support / Service Worker: offline caching, push notifications.
  - Content Security Policy (CSP): security header to prevent XSS attacks. (I need to research this more)
  - Web Vitals Monitoring: Tools to measure performance (LCP, FID, CLS) in production.
  - Analytics Integration: How to track user behavior...
  - I18n/L10n (Internationalization/Localization): Do I want to support multiple languages?

