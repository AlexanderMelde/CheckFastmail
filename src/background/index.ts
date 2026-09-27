import { getUnreadEmails, fetchSession, fetchEmailBody, clearSession } from './jmap';
import type { MessageRequest } from '../types';

const ALARM_NAME = 'POLL_FASTMAIL';

// Listen for messages from the UI
chrome.runtime.onMessage.addListener((message: MessageRequest, _sender, sendResponse) => {
  if (message.type === 'TEST_AND_SAVE_TOKEN') {
    const token = message.token;
    chrome.storage.local.set({ access_token: token }, () => {
      fetchSession(true).then((session) => {
        if (session) {
          updateBadge();
          setupAlarm();
          sendResponse({ success: true });
        } else {
          clearSession().then(() => {
            sendResponse({ success: false });
          });
        }
      });
    });
    return true; // Indicates async response
  }

  if (message.type === 'FETCH_UNREAD') {
    getUnreadEmails().then((result) => {
      sendResponse(result);
      if (result.notAuthenticated) {
        updateBadgeCount(0);
      } else if (result.emails) {
        updateBadgeCount(result.emails.length);
      }
    });
    return true;
  }

  if (message.type === 'FETCH_EMAIL_BODY') {
    fetchEmailBody(message.emailId).then((result) => {
      sendResponse(result);
    });
    return true;
  }
});

async function updateBadgeCount(count: number) {
  if (count > 0) {
    await chrome.action.setBadgeText({ text: count.toString() });
    await chrome.action.setBadgeBackgroundColor({ color: '#2563eb' }); // Fastmail Blue
  } else {
    await chrome.action.setBadgeText({ text: '' });
  }
}

async function updateBadge() {
  const result = await getUnreadEmails();
  if (result.notAuthenticated) {
    await updateBadgeCount(0);
  } else if (result.emails) {
    await updateBadgeCount(result.emails.length);
  }
}

function setupAlarm() {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 5 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    updateBadge();
  }
});

// Initial startup
chrome.storage.local.get(['access_token'], (result) => {
  if (result.access_token) {
    setupAlarm();
    updateBadge();
  }
});
