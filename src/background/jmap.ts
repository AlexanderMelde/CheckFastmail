// src/background/jmap.ts

const SESSION_URL = 'https://api.fastmail.com/jmap/session';

interface JmapSession {
  apiUrl: string;
  accountId: string;
}

async function getAccessToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(['access_token']);
  return result.access_token || null;
}

export async function fetchSession(forceRefresh: boolean = false): Promise<JmapSession | null> {
  if (!forceRefresh) {
    const result = await chrome.storage.local.get(['api_url', 'account_id']);
    if (result.api_url && result.account_id) {
      return { apiUrl: result.api_url, accountId: result.account_id };
    }
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
      // Invalid or revoked API token
      await chrome.storage.local.remove(['access_token', 'api_url', 'account_id']);
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

export async function getUnreadEmails(): Promise<{ emails: any[], notAuthenticated?: boolean }> {
  const token = await getAccessToken();
  if (!token) return { emails: [], notAuthenticated: true };

  const session = await fetchSession();
  if (!session) return { emails: [], notAuthenticated: true };

  try {
    const inboxId = await getInboxId(session, token);
    const filter: any = { notKeyword: "$seen" };
    if (inboxId) {
      filter.inMailbox = inboxId;
    }

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
              filter: filter,
              sort: [{ property: "receivedAt", isAscending: false }],
              limit: 30
            },
            "0"
          ]
        ]
      })
    });

    if (queryResponse.status === 401) {
      await chrome.storage.local.remove(['access_token', 'api_url', 'account_id']);
      return { emails: [], notAuthenticated: true };
    }

    const queryData = await queryResponse.json();
    const emailIds = queryData.methodResponses[0][1].ids;

    if (!emailIds || emailIds.length === 0) {
      return { emails: [] };
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
              properties: ["id", "threadId", "subject", "from", "to", "receivedAt", "preview"]
            },
            "0"
          ]
        ]
      })
    });

    const getData = await getResponse.json();
    return { emails: getData.methodResponses[0][1].list };

  } catch (err) {
    console.error('JMAP query error:', err);
    return { emails: [] };
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
      await chrome.storage.local.remove(['access_token', 'api_url', 'account_id']);
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
    [emailId]: { "keywords/$seen": true }
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

export async function fetchEmailBody(emailId: string): Promise<string | null> {
  const session = await fetchSession();
  if (!session) return null;
  const token = await getAccessToken();
  if (!token) return null;

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
            "Email/get",
            {
              accountId: session.accountId,
              ids: [emailId],
              properties: ["bodyValues", "htmlBody", "textBody"],
              fetchTextBodyValues: true,
              fetchHTMLBodyValues: true
            },
            "0"
          ]
        ]
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const email = data.methodResponses[0][1].list[0];
    if (!email) return null;

    // Try to get HTML body first, fallback to text body
    let partId = null;
    if (email.htmlBody && email.htmlBody.length > 0) {
      partId = email.htmlBody[0].partId;
    } else if (email.textBody && email.textBody.length > 0) {
      partId = email.textBody[0].partId;
    }

    if (partId && email.bodyValues && email.bodyValues[partId]) {
      return email.bodyValues[partId].value;
    }

    // DEBUG: Return the raw email object so we can see what's missing
    return `<pre>Failed to parse body. Raw email object:\n${JSON.stringify(email, null, 2)}</pre>`;
  } catch (err) {
    console.error('Error fetching email body:', err);
    return `<pre>Error fetching: ${err}</pre>`;
  }
}
