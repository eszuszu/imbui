export interface RouteConfig {
  path: string; //url path pattern, can include dynamic segments and wildcard segments
  componentTag: string | ((params: Record<string, string>) => string); //the custom element tag name of the primary view compnent that corresponds to this route.., rendered by the view orchestrator
  dataServiceKey?: symbol | string; // A unique key (symbol or string) for a ServiceScope-provided data service responsible for fetching specific data for the route/view, the view orchestrator or the component can use this key
  title?: string | ((params: Record<string, string>) => string); //the title for the document (document.title) when this route is active, can be a static string or a function that generates the title based on route params
  isSSRReady?: boolean; //indicates if the route is expected to have pre-rendered HTML
  roles?: string[]; //placeholder for future auth logic
}