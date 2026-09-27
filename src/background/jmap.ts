import type { EmailItem, JmapSession, FetchEmailBodyResponse, FetchUnreadResponse, EmailDetail } from '../types';

const SESSION_URL = 'https://api.fastmail.com/jmap/session';

async function getAccessToken(): Promise<string | null> {
  const result = (await chrome.storage.local.get(['access_token'])) || {};
  return typeof result.access_token === 'string' ? result.access_token.trim() || null : null;
}

export async function clearSession(): Promise<void> {
  await chrome.storage.local.remove(['access_token', 'api_url', 'account_id', 'inbox_id']);
}

export async function fetchSession(forceRefresh = false, tokenOverride?: string): Promise<JmapSession | null> {
  const token = tokenOverride || (await getAccessToken());
  if (!token) return null;

  const isTestingToken = Boolean(tokenOverride);

  if (!forceRefresh && !isTestingToken) {
    const result = (await chrome.storage.local.get(['api_url', 'account_id'])) || {};
    if (result.api_url && result.account_id) {
      return { apiUrl: result.api_url as string, accountId: result.account_id as string };
    }
  }

  try {
    const response = await fetch(SESSION_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    if (response.status === 401) {
      if (!isTestingToken) {
        await clearSession();
      }
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    let accountId = data.primaryAccounts?.['urn:ietf:params:jmap:mail'];
    
    // Fallback: search accounts map for mail capability if primaryAccounts is unset
    if (!accountId && data.accounts) {
      for (const [id, acc] of Object.entries(data.accounts as Record<string, { accountCapabilities?: Record<string, unknown> }>)) {
        if (acc?.accountCapabilities?.['urn:ietf:params:jmap:mail']) {
          accountId = id;
          break;
        }
      }
    }

    const apiUrl = data.apiUrl;

    if (!accountId || !apiUrl) {
      return null;
    }

    if (!isTestingToken) {
      await chrome.storage.local.set({
        api_url: apiUrl,
        account_id: accountId
      });
    }

    return { apiUrl, accountId };
  } catch {
    return null;
  }
}

export async function getInboxId(session: JmapSession, token: string): Promise<string | null> {
  const result = (await chrome.storage.local.get(['inbox_id'])) || {};
  if (result.inbox_id) return result.inbox_id as string;

  try {
    const response = await fetch(session.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
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

export async function getUnreadEmails(): Promise<FetchUnreadResponse> {
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

    // RFC 8620 §3.7: Single HTTP round-trip combining Email/query and Email/get via back-reference
    const response = await fetch(session.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
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
            'q'
          ],
          [
            'Email/get',
            {
              accountId: session.accountId,
              '#ids': {
                resultOf: 'q',
                name: 'Email/query',
                path: '/ids'
              },
              properties: ['id', 'threadId', 'subject', 'from', 'to', 'receivedAt', 'preview']
            },
            'g'
          ]
        ]
      })
    });

    if (response.status === 401) {
      await clearSession();
      return { emails: [], notAuthenticated: true };
    }

    if (!response.ok) {
      return { emails: [], error: `Server error (${response.status})` };
    }

    const data = await response.json();
    const methodResponses = data.methodResponses || [];

    // Check for method-level errors
    for (const [name, resp] of methodResponses) {
      if (name === 'error') {
        const errorType = (resp as { type?: string })?.type || 'unknown';
        return { emails: [], error: `JMAP error: ${errorType}` };
      }
    }

    // Find Email/get response ('g')
    const getResponse = methodResponses.find(
      ([name, _resp, id]: [string, unknown, string]) => name === 'Email/get' && id === 'g'
    );
    if (getResponse && (getResponse[1] as { list?: EmailItem[] })?.list) {
      return { emails: (getResponse[1] as { list: EmailItem[] }).list };
    }

    return { emails: [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { emails: [], error: `Network error: ${message}` };
  }
}

export function extractBodyFromEmail(email: EmailDetail | null | undefined): { content: string; isPlainText: boolean } | null {
  if (!email || !email.bodyValues) return null;
  const bodyValues = email.bodyValues;

  // RFC 8621 §4.1.4: Concatenate body parts in order to reconstruct the message content
  if (Array.isArray(email.htmlBody) && email.htmlBody.length > 0) {
    const parts = email.htmlBody
      .map((part) => (part?.partId && part.partId in bodyValues ? bodyValues[part.partId]?.value : undefined))
      .filter((v): v is string => typeof v === 'string');
    if (parts.length > 0) {
      return { content: parts.join(''), isPlainText: false };
    }
  }

  // Fallback to plain text body parts
  if (Array.isArray(email.textBody) && email.textBody.length > 0) {
    const parts = email.textBody
      .map((part) => (part?.partId && part.partId in bodyValues ? bodyValues[part.partId]?.value : undefined))
      .filter((v): v is string => typeof v === 'string');
    if (parts.length > 0) {
      return { content: parts.join(''), isPlainText: true };
    }
  }

  return null;
}

export async function fetchEmailBody(emailId: string): Promise<FetchEmailBodyResponse> {
  if (!emailId || typeof emailId !== 'string') {
    return { body: null, error: 'Invalid email ID' };
  }

  const token = await getAccessToken();
  if (!token) return { body: null, error: 'Not authenticated' };
  const session = await fetchSession();
  if (!session) return { body: null, error: 'Not authenticated' };

  try {
    const response = await fetch(session.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
        methodCalls: [
          [
            'Email/get',
            {
              accountId: session.accountId,
              ids: [emailId],
              properties: ['bodyValues', 'htmlBody', 'textBody', 'preview'],
              fetchTextBodyValues: true,
              fetchHTMLBodyValues: true,
              maxBodyValueBytes: 1048576
            },
            '0'
          ]
        ]
      })
    });

    if (response.status === 401) {
      await clearSession();
      return { body: null, error: 'Authentication expired' };
    }

    if (!response.ok) {
      return { body: null, error: `Server error (${response.status})` };
    }

    const data = await response.json();
    const methodResponse = data.methodResponses?.[0];
    if (methodResponse?.[0] === 'error') {
      const errInfo = methodResponse[1] as { type?: string; description?: string } | undefined;
      const typeStr = errInfo?.type || 'unknown';
      const descStr = errInfo?.description ? `: ${errInfo.description}` : '';
      return { body: null, error: `JMAP error: ${typeStr}${descStr}` };
    }

    const email = methodResponse?.[1]?.list?.[0];
    if (!email) return { body: null, error: 'Email not found' };

    const extracted = extractBodyFromEmail(email);
    if (extracted) {
      return { body: extracted.content, isPlainText: extracted.isPlainText };
    }

    if (typeof email.preview === 'string' && email.preview.length > 0) {
      return { body: email.preview, isPlainText: true };
    }

    return { body: null, error: 'This email has no readable content.' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { body: null, error: `Network error: ${message}` };
  }
}
