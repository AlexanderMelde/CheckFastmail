import { getUnreadEmails, fetchSession, fetchEmailBody } from './jmap';
import type { MessageRequest } from '../types';
import { STORAGE_KEYS } from '../types';

export const ALARM_NAME = 'POLL_FASTMAIL';
export const POLL_INTERVAL_MINUTES = 5;
export const BADGE_COLOR = '#2563eb'; // Fastmail Blue
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

// Listen for messages from popup or options UI
chrome.runtime.onMessage.addListener((message: MessageRequest, _sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') return;

  if (message.type === 'TEST_AND_SAVE_TOKEN') {
    const token = message.token?.trim();
    if (!token) {
      sendResponse({ success: false });
      return;
    }

    // Verify token in-memory before writing to local storage
    fetchSession(true, token)
      .then((session) => {
        if (session) {
          chrome.storage.local.remove([STORAGE_KEYS.INBOX_ID], () => {
            chrome.storage.local.set(
              {
                [STORAGE_KEYS.ACCESS_TOKEN]: token,
                [STORAGE_KEYS.API_URL]: session.apiUrl,
                [STORAGE_KEYS.ACCOUNT_ID]: session.accountId
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
        if (result.notAuthenticated) {
          updateBadgeCount(0);
        } else if (!result.error && result.emails) {
          const count = typeof result.totalCount === 'number' ? result.totalCount : result.emails.length;
          updateBadgeCount(count);
        }
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
      if (result.notAuthenticated) {
        await updateBadgeCount(0);
      } else if (!result.error && result.emails) {
        const count = typeof result.totalCount === 'number' ? result.totalCount : result.emails.length;
        await updateBadgeCount(count);
      }
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
    updateBadge();
  }
});

// Single root-cause lifecycle listener for token additions and removals
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && STORAGE_KEYS.ACCESS_TOKEN in changes) {
    const newToken = changes[STORAGE_KEYS.ACCESS_TOKEN].newValue;
    if (!newToken) {
      chrome.alarms.clear(ALARM_NAME);
      updateBadgeCount(0);
      chrome.storage.local.remove([
        STORAGE_KEYS.INBOX_ID,
        STORAGE_KEYS.API_URL,
        STORAGE_KEYS.ACCOUNT_ID
      ]);
    } else {
      chrome.storage.local.remove([STORAGE_KEYS.INBOX_ID]);
      setupAlarm();
      updateBadge();
    }
  }
});

// Initial service worker startup
chrome.storage.local.get([STORAGE_KEYS.ACCESS_TOKEN], (result) => {
  if (result?.[STORAGE_KEYS.ACCESS_TOKEN]) {
    setupAlarm();
    updateBadge();
  }
});
