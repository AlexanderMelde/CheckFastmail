import { describe, it, expect, beforeEach, vi } from 'vitest';
import { extensionClient } from './extensionClient';
import { STORAGE_KEYS, ALL_AUTH_KEYS } from '../types';

describe('extensionClient Service', () => {
  let mockStorageData: Record<string, any>;
  let mockStorageChangedCallbacks: ((changes: any, area: string) => void)[];
  let mockMessageResponder: ((message: any, cb: (res: any) => void) => void) | null;
  let mockLastError: chrome.runtime.LastError | null = null;

  beforeEach(() => {
    mockStorageData = {};
    mockStorageChangedCallbacks = [];
    mockMessageResponder = null;
    mockLastError = null;

    globalThis.chrome = {
      runtime: {
        get lastError() {
          return mockLastError;
        },
        sendMessage: vi.fn((msg, cb) => {
          if (mockMessageResponder) {
            mockMessageResponder(msg, cb);
          } else {
            cb(null);
          }
        }),
        openOptionsPage: vi.fn()
      },
      storage: {
        local: {
          get: vi.fn(async (keys?: string[]) => {
            if (!keys) return { ...mockStorageData };
            const res: Record<string, any> = {};
            for (const k of keys) {
              if (k in mockStorageData) res[k] = mockStorageData[k];
            }
            return res;
          }),
          remove: vi.fn(async (keys: string[]) => {
            for (const k of keys) {
              delete mockStorageData[k];
            }
          })
        },
        onChanged: {
          addListener: vi.fn((cb) => {
            mockStorageChangedCallbacks.push(cb);
          }),
          removeListener: vi.fn((cb) => {
            const idx = mockStorageChangedCallbacks.indexOf(cb);
            if (idx >= 0) mockStorageChangedCallbacks.splice(idx, 1);
          })
        }
      }
    } as any;
  });

  describe('fetchUnread', () => {
    it('sends FETCH_UNREAD message and resolves with response', async () => {
      mockMessageResponder = (msg, cb) => {
        if (msg.type === 'FETCH_UNREAD') {
          cb({ emails: [{ id: '1', receivedAt: '2026-09-28T00:00:00Z' }] });
        }
      };

      const res = await extensionClient.fetchUnread();
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'FETCH_UNREAD' }, expect.any(Function));
      expect(res.emails).toHaveLength(1);
      expect(res.emails[0].id).toBe('1');
    });

    it('handles chrome.runtime.lastError cleanly', async () => {
      mockLastError = { message: 'Extension context invalidated' };
      mockMessageResponder = (_msg, cb) => {
        cb(undefined);
      };

      const res = await extensionClient.fetchUnread();
      expect(res.emails).toEqual([]);
      expect(res.error).toBe('Error communicating with background script.');
    });

    it('handles null response cleanly', async () => {
      mockMessageResponder = (_msg, cb) => {
        cb(null);
      };

      const res = await extensionClient.fetchUnread();
      expect(res.emails).toEqual([]);
      expect(res.error).toBe('Failed to fetch emails.');
    });
  });

  describe('fetchEmailBody', () => {
    it('sends FETCH_EMAIL_BODY message and resolves with response', async () => {
      mockMessageResponder = (msg, cb) => {
        if (msg.type === 'FETCH_EMAIL_BODY' && msg.emailId === 'msg-42') {
          cb({ body: '<p>Content</p>', isPlainText: false });
        }
      };

      const res = await extensionClient.fetchEmailBody('msg-42');
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        { type: 'FETCH_EMAIL_BODY', emailId: 'msg-42' },
        expect.any(Function)
      );
      expect(res.body).toBe('<p>Content</p>');
      expect(res.isPlainText).toBe(false);
    });

    it('handles chrome.runtime.lastError when fetching body', async () => {
      mockLastError = { message: 'Could not establish connection' };
      mockMessageResponder = (_msg, cb) => cb(undefined);

      const res = await extensionClient.fetchEmailBody('msg-err');
      expect(res.body).toBeNull();
      expect(res.error).toBe('Error communicating with background script.');
    });
  });

  describe('testAndSaveToken', () => {
    it('sends TEST_AND_SAVE_TOKEN with trimmed token and returns true on success', async () => {
      mockMessageResponder = (msg, cb) => {
        if (msg.type === 'TEST_AND_SAVE_TOKEN' && msg.token === 'token-valid') {
          cb({ success: true });
        }
      };

      const success = await extensionClient.testAndSaveToken('  token-valid  ');
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        { type: 'TEST_AND_SAVE_TOKEN', token: 'token-valid' },
        expect.any(Function)
      );
      expect(success).toBe(true);
    });

    it('returns false on failure or lastError', async () => {
      mockLastError = { message: 'Worker inactive' };
      const success = await extensionClient.testAndSaveToken('bad-tok');
      expect(success).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('removes all auth and session keys from local storage', async () => {
      for (const k of ALL_AUTH_KEYS) {
        mockStorageData[k] = 'val';
      }

      await extensionClient.disconnect();
      expect(chrome.storage.local.remove).toHaveBeenCalledWith(expect.arrayContaining([...ALL_AUTH_KEYS]));
      for (const k of ALL_AUTH_KEYS) {
        expect(mockStorageData[k]).toBeUndefined();
      }
    });
  });

  describe('getStoredToken', () => {
    it('returns stored trimmed token when present', async () => {
      mockStorageData[STORAGE_KEYS.ACCESS_TOKEN] = '  my-tok  ';
      const tok = await extensionClient.getStoredToken();
      expect(tok).toBe('my-tok');
    });

    it('returns null when access_token is empty or unset', async () => {
      mockStorageData[STORAGE_KEYS.ACCESS_TOKEN] = '   ';
      expect(await extensionClient.getStoredToken()).toBeNull();

      delete mockStorageData[STORAGE_KEYS.ACCESS_TOKEN];
      expect(await extensionClient.getStoredToken()).toBeNull();
    });
  });

  describe('onTokenChanged', () => {
    it('calls callback when access_token in local storage changes and returns unsubscribe function', () => {
      const cb = vi.fn();
      const unsub = extensionClient.onTokenChanged(cb);

      expect(mockStorageChangedCallbacks).toHaveLength(1);

      // Trigger change with new token
      mockStorageChangedCallbacks[0]({ [STORAGE_KEYS.ACCESS_TOKEN]: { newValue: 'new-tok' } }, 'local');
      expect(cb).toHaveBeenCalledWith('new-tok');

      // Trigger change with token removal
      mockStorageChangedCallbacks[0]({ [STORAGE_KEYS.ACCESS_TOKEN]: { newValue: undefined } }, 'local');
      expect(cb).toHaveBeenCalledWith(null);

      // Ignore changes in other storage areas
      cb.mockClear();
      mockStorageChangedCallbacks[0]({ [STORAGE_KEYS.ACCESS_TOKEN]: { newValue: 'sync-tok' } }, 'sync');
      expect(cb).not.toHaveBeenCalled();

      // Unsubscribe
      unsub();
      expect(chrome.storage.onChanged.removeListener).toHaveBeenCalled();
    });
  });

  describe('openOptionsPage', () => {
    it('calls chrome.runtime.openOptionsPage', () => {
      extensionClient.openOptionsPage();
      expect(chrome.runtime.openOptionsPage).toHaveBeenCalled();
    });
  });

  describe('getCachedUnread (SWR Instant Cache)', () => {
    it('returns cached emails and total count from local storage', async () => {
      mockStorageData[STORAGE_KEYS.CACHED_EMAILS] = [{ id: 'cached-1', subject: 'Offline email' }];
      mockStorageData[STORAGE_KEYS.CACHED_TOTAL_COUNT] = 42;

      const result = await extensionClient.getCachedUnread();
      expect(result.emails).toHaveLength(1);
      expect(result.emails[0].id).toBe('cached-1');
      expect(result.totalCount).toBe(42);
    });

    it('returns empty emails array when no cache exists', async () => {
      const result = await extensionClient.getCachedUnread();
      expect(result.emails).toEqual([]);
      expect(result.totalCount).toBeUndefined();
    });
  });
});
