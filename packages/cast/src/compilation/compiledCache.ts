import type { Compiled } from "../types";
//Todo: consider wrapper API or factory for lifetime delegation
// and safe endpoint, would also enable per runtime or sandboxed caching (shadow dom, server side rendering, test isolation)
export const compiledCache = new WeakMap<TemplateStringsArray, Compiled>();