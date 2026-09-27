export interface RouterOptions {
  mode: 'path' | 'hash';
  defaultRoute: string;
  basePath?: string;
}

export class Router {
  readonly mode: 'path' | 'hash';
  readonly defaultRoute: string;
  readonly basePath: string;
  current = $state<string>('');

  private cleanupListener?: () => void;

  constructor(options: RouterOptions) {
    this.mode = options.mode;
    this.defaultRoute = options.defaultRoute;
    this.basePath = this.normalizeBasePath(options.basePath || '/');
    this.init();
  }

  private normalizeBasePath(base: string): string {
    if (!base || base === './') return '/';
    let normalized = base;
    if (!normalized.startsWith('/')) normalized = '/' + normalized;
    if (!normalized.endsWith('/')) normalized = normalized + '/';
    return normalized;
  }

  private resolveCurrentRoute(): string {
    if (typeof window === 'undefined') {
      return this.defaultRoute;
    }

    if (this.mode === 'hash') {
      const rawHash = window.location.hash.replace(/^#\/?/, '');
      return rawHash.trim() || this.defaultRoute;
    }

    // Path mode: Check for GitHub Pages 404 redirect query parameter (?p=...)
    const urlParams = new URLSearchParams(window.location.search);
    const redirectPath = urlParams.get('p');
    if (redirectPath) {
      const cleanPath = redirectPath.replace(/^\//, '');
      // Restore clean URL in browser address bar without reload
      const cleanUrl = this.basePath + cleanPath + window.location.hash;
      window.history.replaceState(null, '', cleanUrl);
      return cleanPath || this.defaultRoute;
    }

    // Standard pathname parsing
    let pathname = window.location.pathname;
    if (pathname.startsWith(this.basePath)) {
      pathname = pathname.slice(this.basePath.length);
    }
    const cleanRoute = pathname.replace(/^\/+|\/+$/g, '');
    return cleanRoute || this.defaultRoute;
  }

  init() {
    this.current = this.resolveCurrentRoute();

    if (typeof window !== 'undefined') {
      const handleStateChange = () => {
        this.current = this.resolveCurrentRoute();
      };

      window.addEventListener('popstate', handleStateChange);
      if (this.mode === 'hash') {
        window.addEventListener('hashchange', handleStateChange);
      }

      this.cleanupListener = () => {
        window.removeEventListener('popstate', handleStateChange);
        if (this.mode === 'hash') {
          window.removeEventListener('hashchange', handleStateChange);
        }
      };
    }
  }

  navigate(route: string) {
    const targetRoute = route || this.defaultRoute;
    this.current = targetRoute;

    if (typeof window === 'undefined') return;

    if (this.mode === 'hash') {
      const targetHash = targetRoute === this.defaultRoute ? '' : '#' + targetRoute;
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    } else {
      const targetPath = targetRoute === this.defaultRoute ? this.basePath : `${this.basePath}${targetRoute}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  }

  destroy() {
    if (this.cleanupListener) {
      this.cleanupListener();
    }
  }
}
