import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from './router.svelte';

describe('Shared Router', () => {
  let mockLocation: {
    hash: string;
    search: string;
    pathname: string;
  };

  let mockHistory: {
    replaceState: ReturnType<typeof vi.fn>;
    pushState: ReturnType<typeof vi.fn>;
  };

  let listeners: Record<string, ((event: any) => void)[]>;

  beforeEach(() => {
    mockLocation = {
      hash: '',
      search: '',
      pathname: '/',
    };

    mockHistory = {
      replaceState: vi.fn((_state, _title, url: string) => {
        const parsed = new URL(url, 'https://example.com');
        mockLocation.pathname = parsed.pathname;
        mockLocation.search = parsed.search;
        mockLocation.hash = parsed.hash;
      }),
      pushState: vi.fn((_state, _title, url: string) => {
        const parsed = new URL(url, 'https://example.com');
        mockLocation.pathname = parsed.pathname;
        mockLocation.search = parsed.search;
        mockLocation.hash = parsed.hash;
      }),
    };

    listeners = {};

    (globalThis as any).window = {
      location: mockLocation,
      history: mockHistory,
      addEventListener: vi.fn((event: string, handler: (e: any) => void) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(handler);
      }),
      removeEventListener: vi.fn((event: string, handler: (e: any) => void) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((h) => h !== handler);
        }
      }),
    };
  });

  afterEach(() => {
    delete (globalThis as any).window;
  });

  describe('Hash Mode (Options Page)', () => {
    let router: Router;

    afterEach(() => {
      router?.destroy();
    });

    it('initializes with default route when hash is empty', () => {
      mockLocation.hash = '';
      router = new Router({ mode: 'hash', defaultRoute: 'connection' });
      expect(router.current).toBe('connection');
    });

    it('initializes with route from existing hash', () => {
      mockLocation.hash = '#/privacy';
      router = new Router({ mode: 'hash', defaultRoute: 'connection' });
      expect(router.current).toBe('privacy');
    });

    it('updates current route and window.location.hash on navigate', () => {
      router = new Router({ mode: 'hash', defaultRoute: 'connection' });
      router.navigate('terms');
      expect(router.current).toBe('terms');
      expect(mockLocation.hash).toBe('#terms');
    });

    it('clears hash when navigating to default route', () => {
      mockLocation.hash = '#/imprint';
      router = new Router({ mode: 'hash', defaultRoute: 'connection' });
      router.navigate('connection');
      expect(router.current).toBe('connection');
      expect(mockLocation.hash).toBe('');
    });
  });

  describe('Path Mode (Website)', () => {
    let router: Router;

    afterEach(() => {
      router?.destroy();
    });

    it('initializes with default route on root path', () => {
      mockLocation.pathname = '/';
      router = new Router({ mode: 'path', defaultRoute: 'features', basePath: '/' });
      expect(router.current).toBe('features');
    });

    it('extracts route from pathname', () => {
      mockLocation.pathname = '/installation';
      router = new Router({ mode: 'path', defaultRoute: 'features', basePath: '/' });
      expect(router.current).toBe('installation');
    });

    it('handles base subpaths (e.g. GitHub Pages repo root)', () => {
      mockLocation.pathname = '/CheckFastmail/privacy';
      router = new Router({ mode: 'path', defaultRoute: 'features', basePath: '/CheckFastmail/' });
      expect(router.current).toBe('privacy');
    });

    it('handles GitHub Pages 404 redirect query (?p=...) and cleans URL', () => {
      mockLocation.pathname = '/';
      mockLocation.search = '?p=develop';
      router = new Router({ mode: 'path', defaultRoute: 'features', basePath: '/' });
      expect(router.current).toBe('develop');
      expect(mockHistory.replaceState).toHaveBeenCalledWith(null, '', '/develop');
      expect(mockLocation.pathname).toBe('/develop');
    });

    it('navigates using pushState', () => {
      router = new Router({ mode: 'path', defaultRoute: 'features', basePath: '/' });
      router.navigate('installation');
      expect(router.current).toBe('installation');
      expect(mockHistory.pushState).toHaveBeenCalledWith(null, '', '/installation');
    });
  });
});
