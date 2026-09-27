import { getUnreadEmails, markEmailRead, archiveEmail, fetchSession, fetchEmailBody } from './jmap';

const ALARM_NAME = 'POLL_FASTMAIL';

// Listen for messages from the UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TEST_AND_SAVE_TOKEN') {
    const token = message.token;
    // Temporarily save token to test
    chrome.storage.local.set({ access_token: token }, () => {
      fetchSession(true).then((session) => {
        if (session) {
          updateBadge();
          setupAlarm();
          sendResponse({ success: true });
        } else {
          // Revert / remove if invalid
          chrome.storage.local.remove(['access_token', 'api_url', 'account_id'], () => {
            sendResponse({ success: false });
          });
        }
      });
    });
    return true; // Indicates async response
  }
  
  if (message.type === 'FETCH_UNREAD') {
    getUnreadEmails().then(result => {
      sendResponse(result);
      if (result.emails) {
        updateBadgeCount(result.emails.length);
      }
    });
    return true;
  }

  if (message.type === 'MARK_READ') {
    markEmailRead(message.emailId).then(success => {
      if (success) updateBadge(); // Update badge count after marking read
      sendResponse({ success });
    });
    return true;
  }

  if (message.type === 'ARCHIVE') {
    archiveEmail(message.emailId).then(success => {
      if (success) updateBadge();
      sendResponse({ success });
    });
    return true;
  }

  if (message.type === 'FETCH_EMAIL_BODY') {
    fetchEmailBody(message.emailId).then(body => {
      sendResponse({ body });
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
  if (result.emails) {
    await updateBadgeCount(result.emails.length);
  }
}

// Polling setup
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
