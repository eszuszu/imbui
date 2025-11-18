import {
  die, cast,
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ImbuedWebComponentMixin,
  ReactiveWebComponentMixin,
  infuse,
  attributeSignal,
  ROUTER_SERVICE_KEY,
  DisposableMixin,
  signal,
} from "@imbui/core";
import type { RouterService } from "@imbui/core";

const LinkInfusion = infuse(
  HTMLElement,
  BaseWebComponentMixin,
  ElementalWebComponentMixin,
  ImbuedWebComponentMixin,
  ReactiveWebComponentMixin,
  DisposableMixin
);

type LinkState = 'active' | 'visited' | '';

const template = (
  to: string | null,
  handler: (event: MouseEvent) => void,
  state: LinkState,
  content: string,
) => die`<a href="${to}" onclick="${handler}" class="${state}">${content}</a>`

export class Link extends LinkInfusion {
  static observedAttribues = ['to', 'replace', 'exact'];

  @attributeSignal('to', { typeHint: 'string', reflect: false })
  accessor to: string | null;

  @attributeSignal('replace', { typeHint: 'boolean' })
  accessor replace: boolean = false;

  @attributeSignal('exact', { typeHint: 'boolean' })
  accessor exact: boolean = false;

  prettyName: string;
  state = signal<LinkState>('');
  anchor!: HTMLAnchorElement;
  private router!: RouterService;
  
  constructor() {
    super();
    this.prettyName = `[${this.tagName}]: `;
    this.to = this.getAttribute('to');
  }

  connectedCallback(): void {
    super.connectedCallback();
    const slot = document.createElement('slot');
    this.shadowRoot.append(slot);

    this.getService<RouterService>(ROUTER_SERVICE_KEY).then((service: RouterService) => {
      const a = this.querySelector('a') as HTMLAnchorElement;

      if (!a) {
        cast(template(this.to, this.onNavigate, this.state.get(), this.textContent), this.shadowRoot)
      } else {
        this.anchor = a;
        this.anchor.addEventListener('click', this.onNavigate);
      }

      this.router = service;
      this.createEffect(() => {
        this.updateState(this.router);
      });
    }).catch(error => {
      this.logger?.error(`[${this.tagName}] Failed to get RouterService: `, error);
    })
  }

  onNavigate = (event: MouseEvent) => {
    event.preventDefault();

    if (!this.router) {
      this.logger?.warn(`${this.prettyName}RouterService not available for navigation. Allowing default link behavior.`);
      return;
    }

    const targetPath = this.to;

    if(!targetPath) {
      this.logger?.warn(`${this.prettyName}'to' attribute is missing. Not navigating.`);
      return;
    }

    const targetUrl = new URL(targetPath, window.location.href);

    if (targetUrl.hostname !== window.location.hostname) {
      this.logger.log(`${this.prettyName} External link detected: ${targetPath}. Allowing default browser behavior.`);
      window.open(targetUrl.href, this.anchor.target || '_self');
      return;
    }
    // mailto, tel, etc.
    if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
      this.logger?.log(`${this.prettyName} Special protocol link detected: ${targetPath}. Allowing default browser behavior.`);
      return;
    }
    if (targetUrl.pathname === window.location.pathname && targetUrl.hash) {
      this.logger?.log(`${this.prettyName} Same-page hash link detected: ${targetPath}. Allowing default browser behavior.`);
      return;
    }
    if (this.anchor.target === '_blank') {
      this.logger?.log(`${this.prettyName}Link with target="_blank" detected: ${targetPath}. Allowing default browser behavior.`);
      window.open(targetUrl.href, '_blank');
      return;
    }
    this.logger.log(`${this.prettyName}Navigating to: ${targetPath}`);
    this.router.navigate(targetPath, this.replace || false);
  }

  private updateState(router: RouterService | null = null): void {
    if (!router) return;
    const currentPath = router.currentRoute.get().path || '';
    const linkPath = this.to;

    if (!linkPath) this.state.set('');

    let isActive = false;
    if (this.exact) {
      isActive = currentPath === linkPath;
    } else {
      if (linkPath){ 
        isActive = currentPath.startsWith(linkPath) && (currentPath.length === linkPath.length || currentPath[linkPath.length] === '/');
      }
    }
    if (isActive) {
      this.state.set('active');
    } else {
      this.state.set('');
    }

    cast(template(this.to, this.onNavigate, this.state.get(), this.textContent), this.shadowRoot)
  }
  disconnectedCallback() {
    super.disconnectedCallback?.();
  }
}

