import type {
  EmailItem,
  FetchUnreadResponse,
  FetchEmailBodyResponse,
  SaveTokenResponse,
  MessageRequest
} from '../../shared/types';
import { STORAGE_KEYS, ALL_AUTH_KEYS } from '../../shared/types';

export const extensionClient = {
  async getCachedUnread(): Promise<{ emails: EmailItem[]; totalCount?: number }> {
    const result = (await chrome.storage.local.get([
      STORAGE_KEYS.CACHED_EMAILS,
      STORAGE_KEYS.CACHED_TOTAL_COUNT
    ])) || {};
    const emails = Array.isArray(result[STORAGE_KEYS.CACHED_EMAILS])
      ? (result[STORAGE_KEYS.CACHED_EMAILS] as EmailItem[])
      : [];
    const totalCount =
      typeof result[STORAGE_KEYS.CACHED_TOTAL_COUNT] === 'number'
        ? (result[STORAGE_KEYS.CACHED_TOTAL_COUNT] as number)
        : undefined;
    return { emails, totalCount };
  },
  fetchUnread(): Promise<FetchUnreadResponse> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'FETCH_UNREAD' } satisfies MessageRequest,
        (response: FetchUnreadResponse) => {
          if (chrome.runtime.lastError) {
            resolve({
              emails: [],
              error: 'Error communicating with background script.'
            });
            return;
          }
          resolve(response || { emails: [], error: 'Failed to fetch emails.' });
        }
      );
    });
  },

  fetchEmailBody(emailId: string): Promise<FetchEmailBodyResponse> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'FETCH_EMAIL_BODY', emailId } satisfies MessageRequest,
        (response: FetchEmailBodyResponse) => {
          if (chrome.runtime.lastError) {
            resolve({
              body: null,
              error: 'Error communicating with background script.'
            });
            return;
          }
          resolve(response || { body: null, error: 'Could not load email content.' });
        }
      );
    });
  },

  testAndSaveToken(token: string): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'TEST_AND_SAVE_TOKEN', token: token.trim() } satisfies MessageRequest,
        (response: SaveTokenResponse) => {
          if (chrome.runtime.lastError || !response) {
            resolve(false);
            return;
          }
          resolve(Boolean(response.success));
        }
      );
    });
  },

  async disconnect(): Promise<void> {
    await chrome.storage.local.remove([...ALL_AUTH_KEYS]);
  },

  async getStoredToken(): Promise<string | null> {
    const result = (await chrome.storage.local.get([STORAGE_KEYS.ACCESS_TOKEN])) || {};
    const token = result[STORAGE_KEYS.ACCESS_TOKEN];
    return typeof token === 'string' && token.trim() ? token.trim() : null;
  },

  onTokenChanged(callback: (token: string | null) => void): () => void {
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && STORAGE_KEYS.ACCESS_TOKEN in changes) {
        const newVal = changes[STORAGE_KEYS.ACCESS_TOKEN].newValue;
        callback(typeof newVal === 'string' && newVal.trim() ? newVal.trim() : null);
      }
    };

    chrome.storage?.onChanged?.addListener(listener);
    return () => {
      chrome.storage?.onChanged?.removeListener(listener);
    };
  },

  openOptionsPage(): void {
    if (typeof chrome.runtime?.openOptionsPage === 'function') {
      chrome.runtime.openOptionsPage();
    }
  }
};
