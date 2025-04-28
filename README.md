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


## Components
`<codex-entry>`
This is the first component I'm going to get up and running, it represents any entry in the grove.