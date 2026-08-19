// src/background/jmap.ts
import { refreshToken } from './auth';

const SESSION_URL = 'https://api.fastmail.com/.well-known/jmap';

interface JmapSession {
  apiUrl: string;
  accountId: string;
}

async function getAccessToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(['access_token']);
  return result.access_token || null;
}

export async function fetchSession(): Promise<JmapSession | null> {
  const result = await chrome.storage.local.get(['api_url', 'account_id']);
  if (result.api_url && result.account_id) {
    return { apiUrl: result.api_url, accountId: result.account_id };
  }

  const token = await getAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(SESSION_URL, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        return fetchSession(); // Retry with new token
      }
      return null;
    }

    if (!response.ok) {
      console.error('Failed to fetch JMAP session');
      return null;
    }

    const data = await response.json();
    const accountId = data.primaryAccounts['urn:ietf:params:jmap:mail'];
    const apiUrl = data.apiUrl;

    await chrome.storage.local.set({
      api_url: apiUrl,
      account_id: accountId
    });

    return { apiUrl, accountId };
  } catch (err) {
    console.error('Session fetch error:', err);
    return null;
  }
}

export async function getUnreadEmails(): Promise<any[]> {
  const session = await fetchSession();
  if (!session) return [];

  let token = await getAccessToken();
  if (!token) return [];

  try {
    // Phase 1: Query for unread email IDs
    const queryResponse = await fetch(session.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        using: ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
        methodCalls: [
          [
            "Email/query",
            {
              accountId: session.accountId,
              filter: { unread: true }
            },
            "0"
          ]
        ]
      })
    });

    if (queryResponse.status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        return getUnreadEmails(); // Retry with new token
      }
      return [];
    }

    const queryData = await queryResponse.json();
    const emailIds = queryData.methodResponses[0][1].ids;

    if (!emailIds || emailIds.length === 0) {
      return [];
    }

    // Phase 2: Get details for those IDs
    const getResponse = await fetch(session.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        using: ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
        methodCalls: [
          [
            "Email/get",
            {
              accountId: session.accountId,
              ids: emailIds,
              properties: ["id", "threadId", "subject", "from", "receivedAt"]
            },
            "0"
          ]
        ]
      })
    });

    const getData = await getResponse.json();
    return getData.methodResponses[0][1].list;

  } catch (err) {
    console.error('JMAP query error:', err);
    return [];
  }
}

async function getInboxId(session: JmapSession, token: string): Promise<string | null> {
  const result = await chrome.storage.local.get(['inbox_id']);
  if (result.inbox_id) return result.inbox_id;

  try {
    const response = await fetch(session.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        using: ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
        methodCalls: [
          [
            "Mailbox/query",
            {
              accountId: session.accountId,
              filter: { role: "inbox" }
            },
            "0"
          ]
        ]
      })
    });

    const data = await response.json();
    const inboxId = data.methodResponses[0][1].ids[0];
    
    if (inboxId) {
      await chrome.storage.local.set({ inbox_id: inboxId });
      return inboxId;
    }
  } catch (err) {
    console.error('Error fetching inbox id:', err);
  }
  return null;
}

async function performEmailSet(updateParams: any): Promise<boolean> {
  const session = await fetchSession();
  if (!session) return false;

  let token = await getAccessToken();
  if (!token) return false;

  try {
    const response = await fetch(session.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        using: ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
        methodCalls: [
          [
            "Email/set",
            {
              accountId: session.accountId,
              update: updateParams
            },
            "0"
          ]
        ]
      })
    });

    if (response.status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        return performEmailSet(updateParams); // Retry
      }
      return false;
    }

    return response.ok;
  } catch (err) {
    console.error('Email/set error:', err);
    return false;
  }
}

export async function markEmailRead(emailId: string): Promise<boolean> {
  return performEmailSet({
    [emailId]: { isUnread: false }
  });
}

export async function archiveEmail(emailId: string): Promise<boolean> {
  const session = await fetchSession();
  if (!session) return false;
  
  const token = await getAccessToken();
  if (!token) return false;

  const inboxId = await getInboxId(session, token);
  if (!inboxId) return false;

  return performEmailSet({
    [emailId]: { [`mailboxIds/${inboxId}`]: null }
  });
}
