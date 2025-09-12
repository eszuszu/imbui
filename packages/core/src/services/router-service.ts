import type { Signal } from "@imbui/pulse";
import { signal } from "@imbui/pulse";

import type { LoggerService } from "./logger-service";
import { RouteConfig } from "../router/types";
import { matchRoute } from "../router/route-matcher";

interface CurrentRouteState {
  config: RouteConfig | null;
  params: Record<string, string>;
  path: string;
}

export class RouterService {
  public readonly currentRoute: Signal<CurrentRouteState>;
  public readonly isLoading: Signal<boolean>;

  private _logger: LoggerService;
  private _routesDefinition: RouteConfig[];

  constructor(logger: LoggerService, routes: RouteConfig[]) {
    this._logger = logger;
    this._routesDefinition = routes
    this.currentRoute = signal<CurrentRouteState>({ config: null, params: {}, path: '' });
    this.isLoading = signal(false);
    this._handlePopState = this._handlePopState.bind(this);
  }

  // --- Public API ---

  /**
   * Initializes the router and sets up event listeners. Performs initial route check.
   * should be called once by top-level RouterProvider.
   */
  public init(): void {
    window.addEventListener('popstate', this._handlePopState);

    this._logger.log('RouterServiceInitialized');
    this._handleLocationChange(window.location.pathname); //initial route check
  }

  /**
   * programmatically navigates to a new path.
   * @param to The URL path to navigate to.
   * @param replaceState If true, replaces the current history entry instead of pushing a new one.
   */
  public navigate(to: string, replaceState: boolean = false): void {
    const { path } = this.currentRoute.get();
    if (path === to) {
      this._logger.log(`Already at ${to}. Not navigating.`);
      return;
    }

    if (replaceState) {
      window.history.replaceState(null, '', to);
    } else {
      window.history.pushState(null, '', to);
    }

    this._logger.log(`Navigating to : ${to} (Programmatic)`);
    this._handleLocationChange(to);
  }

  /**
   * Cleans up even listeners when the router is no longer needed e.g. app teardownsies).
   */
  public destroy(): void {
    window.removeEventListener('popstate', this._handlePopState);
    this._logger.log('RouterService destroyed.');
  }

  // --- private methods

  private _handlePopState(): void {
    this._logger.log('Popstate event triggered. Handling location change.');
    this._handleLocationChange(window.location.pathname);
  }


  /**
   * The core logic to process a new URL path, match a route, and update state.
   * @param path The URL path to process
   */
  private _handleLocationChange(path: string): void {
    this.isLoading.set(true);

    const matched = matchRoute(path, this._routesDefinition);

    if (matched) {
      this._logger.warn(`Matched route: ${matched.route.path}`, JSON.stringify(matched.params));
      this.currentRoute.set({
        config: matched.route,
        params: matched.params,
        path: path
      });
    } else {
      // No route matched, fallback to 404 or default
      this._logger.warn(`No route matched for path: ${path}. Falling back to 404.`);
      // ensure APP_ROUTES_DEFINITION has a * fallback.
      const notFoundRoute = this._routesDefinition.find(r => r.path === '*');
      this.currentRoute.set({
        config: notFoundRoute || null,
        params: {},
        path: path
      });
    }
    this.isLoading.set(false); // matching complete
  }
}