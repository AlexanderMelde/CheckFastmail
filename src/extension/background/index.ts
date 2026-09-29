import { getUnreadEmails, fetchSession, fetchEmailBody } from './jmap';
import type { MessageRequest, FetchUnreadResponse } from '../../shared/types';
import { STORAGE_KEYS } from '../../shared/types';
import { isDemoToken, getDemoEmails } from '../../shared/demoData';

export const ALARM_NAME = 'POLL_FASTMAIL';
export const POLL_INTERVAL_MINUTES = 1;
export const BADGE_COLOR = '#4b1e8b';
export const CONTEXT_MENU_OPEN_FASTMAIL = 'OPEN_FASTMAIL';
export const FASTMAIL_WEB_URL = 'https://app.fastmail.com/mail/';

export function setupContextMenu(): void {
  if (typeof chrome.contextMenus?.removeAll === 'function') {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: CONTEXT_MENU_OPEN_FASTMAIL,
        title: 'Open Fastmail',
        contexts: ['action']
      });
    });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenu();
});

if (typeof chrome.contextMenus?.onClicked?.addListener === 'function') {
  chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === CONTEXT_MENU_OPEN_FASTMAIL) {
      chrome.tabs.create({ url: FASTMAIL_WEB_URL });
    }
  });
}

export function applyUnreadResult(result: FetchUnreadResponse): void {
  if (result.notAuthenticated) {
    updateBadgeCount(0);
    chrome.storage.local.remove([STORAGE_KEYS.CACHED_EMAILS, STORAGE_KEYS.CACHED_TOTAL_COUNT]);
  } else if (!result.error && result.emails) {
    const count = typeof result.totalCount === 'number' ? result.totalCount : result.emails.length;
    updateBadgeCount(count);
    chrome.storage.local.set({
      [STORAGE_KEYS.CACHED_EMAILS]: result.emails,
      [STORAGE_KEYS.CACHED_TOTAL_COUNT]: count
    });
  }
}

// Listen for messages from popup or options UI
chrome.runtime.onMessage.addListener((message: MessageRequest, _sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') return;

  if (message.type === 'TEST_AND_SAVE_TOKEN') {
    let token = message.token?.trim();
    if (token && token.toLowerCase().startsWith('bearer ')) {
      token = token.slice(7).trim();
    }
    if (!token) {
      sendResponse({ success: false });
      return;
    }

    if (isDemoToken(token)) {
      const emails = getDemoEmails();
      chrome.storage.local.remove([
        STORAGE_KEYS.INBOX_ID,
        STORAGE_KEYS.CACHED_EMAILS,
        STORAGE_KEYS.CACHED_TOTAL_COUNT
      ], () => {
        chrome.storage.local.set(
          {
            [STORAGE_KEYS.ACCESS_TOKEN]: token,
            [STORAGE_KEYS.API_URL]: 'https://api.fastmail.com/jmap/session',
            [STORAGE_KEYS.ACCOUNT_ID]: 'demo-account',
            [STORAGE_KEYS.IS_READ_ONLY]: true,
            [STORAGE_KEYS.CACHED_EMAILS]: emails,
            [STORAGE_KEYS.CACHED_TOTAL_COUNT]: emails.length
          },
          () => {
            updateBadgeCount(emails.length).catch(() => {});
            sendResponse({ success: true });
          }
        );
      });
      return true;
    }

    // Verify token in-memory before writing to local storage
    fetchSession(true, token)
      .then((session) => {
        if (session) {
          chrome.storage.local.remove([
            STORAGE_KEYS.INBOX_ID,
            STORAGE_KEYS.CACHED_EMAILS,
            STORAGE_KEYS.CACHED_TOTAL_COUNT
          ], () => {
            chrome.storage.local.set(
              {
                [STORAGE_KEYS.ACCESS_TOKEN]: token,
                [STORAGE_KEYS.API_URL]: session.apiUrl,
                [STORAGE_KEYS.ACCOUNT_ID]: session.accountId,
                ...(typeof session.isReadOnly === 'boolean' ? { [STORAGE_KEYS.IS_READ_ONLY]: session.isReadOnly } : {})
              },
              () => {
                sendResponse({ success: true });
              }
            );
          });
        } else {
          sendResponse({ success: false });
        }
      })
      .catch(() => {
        sendResponse({ success: false });
      });
    return true; // Indicates async response
  }

  if (message.type === 'FETCH_UNREAD') {
    getUnreadEmails()
      .then((result) => {
        sendResponse(result);
        applyUnreadResult(result);
      })
      .catch((err) => {
        sendResponse({
          emails: [],
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      });
    return true;
  }

  if (message.type === 'FETCH_EMAIL_BODY') {
    if (!message.emailId || typeof message.emailId !== 'string') {
      sendResponse({ body: null, error: 'Invalid email ID' });
      return;
    }

    fetchEmailBody(message.emailId)
      .then((result) => {
        sendResponse(result);
      })
      .catch((err) => {
        sendResponse({
          body: null,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      });
    return true;
  }
});

export async function updateBadgeCount(count: number): Promise<void> {
  if (count > 0) {
    await chrome.action.setBadgeText({ text: count.toString() });
    await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
  } else {
    await chrome.action.setBadgeText({ text: '' });
  }
}

let inFlightUpdateBadge: Promise<void> | null = null;

export async function updateBadge(): Promise<void> {
  if (inFlightUpdateBadge) return inFlightUpdateBadge;

  inFlightUpdateBadge = (async () => {
    try {
      const result = await getUnreadEmails();
      if (!result) return;
      applyUnreadResult(result);
    } catch {
      // Defensive boundary against unexpected worker lifecycle errors
    } finally {
      inFlightUpdateBadge = null;
    }
  })();

  return inFlightUpdateBadge;
}

export function setupAlarm(): void {
  if (typeof chrome.alarms?.get === 'function') {
    chrome.alarms.get(ALARM_NAME, (alarm) => {
      if (!alarm) {
        chrome.alarms.create(ALARM_NAME, { periodInMinutes: POLL_INTERVAL_MINUTES });
      }
    });
  } else {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: POLL_INTERVAL_MINUTES });
  }
}

// Background alarm listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    updateBadge().catch(() => {});
  }
});

// Single root-cause lifecycle listener for token additions and removals
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && STORAGE_KEYS.ACCESS_TOKEN in changes) {
    const rawVal = changes[STORAGE_KEYS.ACCESS_TOKEN].newValue;
    const newToken = typeof rawVal === 'string' && rawVal.trim() ? rawVal.trim() : null;
    if (!newToken) {
      chrome.alarms.clear(ALARM_NAME);
      updateBadgeCount(0);
      chrome.storage.local.remove([
        STORAGE_KEYS.INBOX_ID,
        STORAGE_KEYS.API_URL,
        STORAGE_KEYS.ACCOUNT_ID,
        STORAGE_KEYS.IS_READ_ONLY,
        STORAGE_KEYS.CACHED_EMAILS,
        STORAGE_KEYS.CACHED_TOTAL_COUNT
      ]);
    } else {
      const keysToRemove = isDemoToken(newToken)
        ? [STORAGE_KEYS.INBOX_ID]
        : [
            STORAGE_KEYS.INBOX_ID,
            STORAGE_KEYS.CACHED_EMAILS,
            STORAGE_KEYS.CACHED_TOTAL_COUNT
          ];
      chrome.storage.local.remove(keysToRemove);
      setupAlarm();
      updateBadge().catch(() => {});
    }
  }
});

// Initial service worker startup
chrome.storage.local.get([STORAGE_KEYS.ACCESS_TOKEN], (result) => {
  if (result?.[STORAGE_KEYS.ACCESS_TOKEN]) {
    setupAlarm();
    updateBadge().catch(() => {});
  }
});
