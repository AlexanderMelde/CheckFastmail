import type { EmailItem, JmapSession, FetchEmailBodyResponse } from '../types';

const SESSION_URL = 'https://api.fastmail.com/jmap/session';

async function getAccessToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(['access_token']);
  return (result.access_token as string) || null;
}

export async function clearSession(): Promise<void> {
  await chrome.storage.local.remove(['access_token', 'api_url', 'account_id', 'inbox_id']);
}

export async function fetchSession(forceRefresh = false): Promise<JmapSession | null> {
  if (!forceRefresh) {
    const result = await chrome.storage.local.get(['api_url', 'account_id']);
    if (result.api_url && result.account_id) {
      return { apiUrl: result.api_url as string, accountId: result.account_id as string };
    }
  }

  const token = await getAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(SESSION_URL, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      await clearSession();
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const accountId = data.primaryAccounts?.['urn:ietf:params:jmap:mail'];
    const apiUrl = data.apiUrl;

    if (!accountId || !apiUrl) {
      return null;
    }

    await chrome.storage.local.set({
      api_url: apiUrl,
      account_id: accountId
    });

    return { apiUrl, accountId };
  } catch {
    return null;
  }
}

export async function getInboxId(session: JmapSession, token: string): Promise<string | null> {
  const result = await chrome.storage.local.get(['inbox_id']);
  if (result.inbox_id) return result.inbox_id as string;

  try {
    const response = await fetch(session.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
        methodCalls: [
          [
            'Mailbox/query',
            {
              accountId: session.accountId,
              filter: { role: 'inbox' }
            },
            '0'
          ]
        ]
      })
    });

    if (response.status === 401) {
      await clearSession();
      return null;
    }

    if (!response.ok) return null;

    const data = await response.json();
    const inboxId = data.methodResponses?.[0]?.[1]?.ids?.[0];

    if (inboxId) {
      await chrome.storage.local.set({ inbox_id: inboxId });
      return inboxId as string;
    }
  } catch {
    // Return null on failure; queries will fall back to filtering without mailbox restriction
  }
  return null;
}

export async function getUnreadEmails(): Promise<{ emails: EmailItem[]; notAuthenticated?: boolean }> {
  const token = await getAccessToken();
  if (!token) return { emails: [], notAuthenticated: true };

  const session = await fetchSession();
  if (!session) return { emails: [], notAuthenticated: true };

  try {
    const inboxId = await getInboxId(session, token);
    const filter: Record<string, string> = { notKeyword: '$seen' };
    if (inboxId) {
      filter.inMailbox = inboxId;
    }

    // # ponytail: two-stage query/get fetch, back-reference single round-trip if latency matters
    // Phase 1: Query for unread email IDs
    const queryResponse = await fetch(session.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
        methodCalls: [
          [
            'Email/query',
            {
              accountId: session.accountId,
              filter,
              sort: [{ property: 'receivedAt', isAscending: false }],
              limit: 30
            },
            '0'
          ]
        ]
      })
    });

    if (queryResponse.status === 401) {
      await clearSession();
      return { emails: [], notAuthenticated: true };
    }

    if (!queryResponse.ok) {
      return { emails: [] };
    }

    const queryData = await queryResponse.json();
    const emailIds = queryData.methodResponses?.[0]?.[1]?.ids as string[] | undefined;

    if (!emailIds || emailIds.length === 0) {
      return { emails: [] };
    }

    // Phase 2: Get details for those IDs
    const getResponse = await fetch(session.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
        methodCalls: [
          [
            'Email/get',
            {
              accountId: session.accountId,
              ids: emailIds,
              properties: ['id', 'threadId', 'subject', 'from', 'to', 'receivedAt', 'preview']
            },
            '0'
          ]
        ]
      })
    });

    if (getResponse.status === 401) {
      await clearSession();
      return { emails: [], notAuthenticated: true };
    }

    if (!getResponse.ok) {
      return { emails: [] };
    }

    const getData = await getResponse.json();
    const list = (getData.methodResponses?.[0]?.[1]?.list as EmailItem[]) || [];
    return { emails: list };
  } catch {
    return { emails: [] };
  }
}

export function extractBodyFromEmail(email: any): { content: string; isPlainText: boolean } | null {
  if (!email || !email.bodyValues) return null;

  // Try HTML body first
  if (Array.isArray(email.htmlBody) && email.htmlBody.length > 0) {
    const partId = email.htmlBody[0]?.partId;
    if (partId && email.bodyValues[partId]?.value) {
      return { content: email.bodyValues[partId].value, isPlainText: false };
    }
  }

  // Fallback to plain text body
  if (Array.isArray(email.textBody) && email.textBody.length > 0) {
    const partId = email.textBody[0]?.partId;
    if (partId && email.bodyValues[partId]?.value) {
      return { content: email.bodyValues[partId].value, isPlainText: true };
    }
  }

  return null;
}

export async function fetchEmailBody(emailId: string): Promise<FetchEmailBodyResponse> {
  const session = await fetchSession();
  if (!session) return { body: null };
  const token = await getAccessToken();
  if (!token) return { body: null };

  try {
    const response = await fetch(session.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
        methodCalls: [
          [
            'Email/get',
            {
              accountId: session.accountId,
              ids: [emailId],
              properties: ['bodyValues', 'htmlBody', 'textBody'],
              fetchTextBodyValues: true,
              fetchHTMLBodyValues: true
            },
            '0'
          ]
        ]
      })
    });

    if (response.status === 401) {
      await clearSession();
      return { body: null };
    }

    if (!response.ok) return { body: null };

    const data = await response.json();
    const email = data.methodResponses?.[0]?.[1]?.list?.[0];
    if (!email) return { body: null };

    const extracted = extractBodyFromEmail(email);
    if (extracted) {
      return { body: extracted.content, isPlainText: extracted.isPlainText };
    }

    return { body: null };
  } catch {
    return { body: null };
  }
}
