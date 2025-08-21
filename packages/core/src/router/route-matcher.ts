import { RouteConfig } from "./types";

interface MatchedRouteResult {
  route: RouteConfig;
  params: Record<string, string>;
}

/**
 * Matches a given URL path against a list of RouteConfigs.
 * Returns the first matchign RouteConfig and extracted parameters.
 * Handles dynamic segments (e.g., /:slug) and wildcards (*).
 * 
 * @param path The URL path to match (e.g., "/entry/my-zoomzoom");
 * @param routes The array of RouteConfig objects.
 * @returns MatchedRouteResult if a route is found, otherwise null.
 */
export function matchRoute(path: string, routes: RouteConfig[]): MatchedRouteResult | null {
  const normalizedPath = path === '/' ? '/'
    : path.endsWith('/') ? path.slice(0, -1)
    : path;

  for (const route of routes) {
    
    const routePattern = route.path
      .replace(/\//g, '\\/') //escape forward slashes
      .replace(/:([a-zA-Z0-9_]+)/g, '(?<param_$1>[^/]+)') //capture dynamic segments
      .replace(/\*/g, '(?<wildcard>.*)'); //Capturewildcard(e.g. /*)

    const regex = new RegExp(`^${routePattern}$`);
    const match = normalizedPath.match(regex);

    if (match) {
      const params: Record<string, string> = {};

      if (match.groups) {
        for (const key in match.groups) {
          if (key.startsWith('param_')) {
            params[key.substring('param_'.length)] = match.groups[key];
          } else if (key === 'wildcard' && match.groups[key]) {
            //wildcard handled as special parameter if needed maybe later. consume now
            params['wildcard'] = match.groups[key];
          }
        }
      }

      return { route, params };
    }
  }

  return null;
}