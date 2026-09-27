import { getUnreadEmails, fetchSession, fetchEmailBody, clearSession } from './jmap';
import type { MessageRequest } from '../types';

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
          chrome.storage.local.remove(['inbox_id'], () => {
            chrome.storage.local.set(
              {
                access_token: token,
                api_url: session.apiUrl,
                account_id: session.accountId
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
          updateBadgeCount(result.emails.length);
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

export async function updateBadge(): Promise<void> {
  const result = await getUnreadEmails();
  if (!result) return;
  if (result.notAuthenticated) {
    await updateBadgeCount(0);
  } else if (!result.error && result.emails) {
    await updateBadgeCount(result.emails.length);
  }
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
  if (areaName === 'local' && 'access_token' in changes) {
    const newToken = changes.access_token.newValue;
    if (!newToken) {
      chrome.alarms.clear(ALARM_NAME);
      updateBadgeCount(0);
      chrome.storage.local.remove(['inbox_id', 'api_url', 'account_id']);
    } else {
      chrome.storage.local.remove(['inbox_id']);
      setupAlarm();
      updateBadge();
    }
  }
});

// Initial service worker startup
chrome.storage.local.get(['access_token'], (result) => {
  if (result?.access_token) {
    setupAlarm();
    updateBadge();
  }
});
