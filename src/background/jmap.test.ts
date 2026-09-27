import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  extractBodyFromEmail,
  fetchSession,
  clearSession,
  getInboxId,
  getUnreadEmails,
  fetchEmailBody
} from './jmap';
import type { JmapSession } from '../types';

describe('extractBodyFromEmail', () => {
  it('extracts HTML body when present and sets isPlainText to false', () => {
    const email = {
      htmlBody: [{ partId: 'part-html-1', type: 'text/html' }],
      textBody: [{ partId: 'part-text-1', type: 'text/plain' }],
      bodyValues: {
        'part-html-1': { value: '<p>Hello <strong>World</strong></p>' },
        'part-text-1': { value: 'Hello World' }
      }
    };

    const result = extractBodyFromEmail(email);
    expect(result).toEqual({
      content: '<p>Hello <strong>World</strong></p>',
      isPlainText: false
    });
  });

  it('falls back to plain text body when HTML body is missing', () => {
    const email = {
      htmlBody: [],
      textBody: [{ partId: 'part-text-2', type: 'text/plain' }],
      bodyValues: {
        'part-text-2': { value: 'Plain text message content' }
      }
    };

    const result = extractBodyFromEmail(email);
    expect(result).toEqual({
      content: 'Plain text message content',
      isPlainText: true
    });
  });

  it('iterates through parts to find the first valid part with content', () => {
    const email = {
      htmlBody: [
        { partId: 'missing-part', type: 'text/html' },
        { partId: 'valid-part', type: 'text/html' }
      ],
      bodyValues: {
        'valid-part': { value: '<p>Fallback valid HTML</p>' }
      }
    };

    const result = extractBodyFromEmail(email);
    expect(result).toEqual({
      content: '<p>Fallback valid HTML</p>',
      isPlainText: false
    });
  });

  it('returns null if partId is not found in bodyValues', () => {
    const email = {
      htmlBody: [{ partId: 'missing-part', type: 'text/html' }],
      bodyValues: {
        'other-part': { value: 'Different content' }
      }
    };

    const result = extractBodyFromEmail(email);
    expect(result).toBeNull();
  });

  it('returns null if bodyValues is missing or email is null', () => {
    expect(extractBodyFromEmail(null)).toBeNull();
    expect(extractBodyFromEmail(undefined)).toBeNull();
    expect(extractBodyFromEmail({})).toBeNull();
    expect(extractBodyFromEmail({ htmlBody: [] })).toBeNull();
  });

  it('concatenates multiple HTML body parts in order per RFC 8621 §4.1.4', () => {
    const email = {
      htmlBody: [
        { partId: 'part-1' },
        { partId: 'part-2' }
      ],
      bodyValues: {
        'part-1': { value: '<p>Part 1</p>' },
        'part-2': { value: '<p>Part 2</p>' }
      }
    };
    const result = extractBodyFromEmail(email);
    expect(result).toEqual({
      content: '<p>Part 1</p><p>Part 2</p>',
      isPlainText: false
    });
  });

  it('concatenates multiple plain text body parts in order per RFC 8621 §4.1.4', () => {
    const email = {
      textBody: [
        { partId: 'text-1' },
        { partId: 'text-2' }
      ],
      bodyValues: {
        'text-1': { value: 'Line 1\n' },
        'text-2': { value: 'Line 2' }
      }
    };
    const result = extractBodyFromEmail(email);
    expect(result).toEqual({
      content: 'Line 1\nLine 2',
      isPlainText: true
    });
  });

  it('correctly extracts an empty string body instead of treating it as missing/null', () => {
    const email = {
      htmlBody: [{ partId: 'empty-html' }],
      bodyValues: {
        'empty-html': { value: '' }
      }
    };
    const result = extractBodyFromEmail(email);
    expect(result).toEqual({
      content: '',
      isPlainText: false
    });
  });
});

describe('JMAP Client & Spec Compliance (RFC 8620 / RFC 8621)', () => {
  let mockStorage: Record<string, any>;

  beforeEach(() => {
    mockStorage = {};
    vi.restoreAllMocks();

    globalThis.chrome = {
      storage: {
        local: {
          get: vi.fn(async (keys?: string | string[]) => {
            if (!keys) return { ...mockStorage };
            if (typeof keys === 'string') return { [keys]: mockStorage[keys] };
            const result: Record<string, any> = {};
            for (const k of keys) {
              if (k in mockStorage) result[k] = mockStorage[k];
            }
            return result;
          }),
          set: vi.fn(async (items: Record<string, any>) => {
            Object.assign(mockStorage, items);
          }),
          remove: vi.fn(async (keys: string | string[]) => {
            const list = Array.isArray(keys) ? keys : [keys];
            for (const k of list) {
              delete mockStorage[k];
            }
          })
        }
      }
    } as any;
  });

  describe('clearSession', () => {
    it('removes all auth and session keys from local storage', async () => {
      mockStorage = {
        access_token: 'tok-123',
        api_url: 'https://api.fastmail.com/jmap/api',
        account_id: 'acc-123',
        inbox_id: 'inbox-123'
      };

      await clearSession();

      expect(mockStorage.access_token).toBeUndefined();
      expect(mockStorage.api_url).toBeUndefined();
      expect(mockStorage.account_id).toBeUndefined();
      expect(mockStorage.inbox_id).toBeUndefined();
    });
  });

  describe('fetchSession', () => {
    it('returns cached session when available and forceRefresh is false', async () => {
      mockStorage = {
        access_token: 'tok-123',
        api_url: 'https://api.fastmail.com/jmap/api',
        account_id: 'acc-cached'
      };

      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const session = await fetchSession(false);

      expect(session).toEqual({
        apiUrl: 'https://api.fastmail.com/jmap/api',
        accountId: 'acc-cached'
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('returns null if access_token is not present even when forceRefresh is false', async () => {
      mockStorage = {
        api_url: 'https://api.fastmail.com/jmap/api',
        account_id: 'acc-stale'
      };
      const session = await fetchSession(false);
      expect(session).toBeNull();
    });

    it('returns null if access_token is not present', async () => {
      const session = await fetchSession(true);
      expect(session).toBeNull();
    });

    it('queries Fastmail session URL and stores primary mail account', async () => {
      mockStorage = { access_token: 'tok-valid' };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          apiUrl: 'https://api.fastmail.com/jmap/api/',
          primaryAccounts: {
            'urn:ietf:params:jmap:mail': 'acc-primary-mail'
          }
        })
      } as Response);

      const session = await fetchSession(true);

      expect(session).toEqual({
        apiUrl: 'https://api.fastmail.com/jmap/api/',
        accountId: 'acc-primary-mail'
      });
      expect(mockStorage.api_url).toBe('https://api.fastmail.com/jmap/api/');
      expect(mockStorage.account_id).toBe('acc-primary-mail');
    });

    it('falls back to accounts map if primaryAccounts mail capability is unset', async () => {
      mockStorage = { access_token: 'tok-valid' };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          apiUrl: 'https://api.fastmail.com/jmap/api/',
          primaryAccounts: {},
          accounts: {
            'acc-fallback': {
              accountCapabilities: {
                'urn:ietf:params:jmap:mail': {}
              }
            }
          }
        })
      } as Response);

      const session = await fetchSession(true);
      expect(session?.accountId).toBe('acc-fallback');
    });

    it('clears session and returns null on 401 Unauthorized', async () => {
      mockStorage = {
        access_token: 'expired-token',
        api_url: 'https://api.fastmail.com/jmap/api',
        account_id: 'acc-123'
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401
      } as Response);

      const session = await fetchSession(true);
      expect(session).toBeNull();
      expect(mockStorage.access_token).toBeUndefined();
    });

    it('returns null on network error', async () => {
      mockStorage = { access_token: 'tok-valid' };
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network offline'));

      const session = await fetchSession(true);
      expect(session).toBeNull();
    });

    it('sends Accept: application/json header per RFC 8620 §2', async () => {
      mockStorage = { access_token: 'tok-123' };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          apiUrl: 'https://api.fastmail.com/jmap/api',
          primaryAccounts: { 'urn:ietf:params:jmap:mail': 'acc-1' }
        })
      } as Response);

      await fetchSession(true);

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.fastmail.com/jmap/session',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer tok-123',
            Accept: 'application/json'
          })
        })
      );
    });

    it('supports tokenOverride for in-memory validation without mutating storage on failure', async () => {
      mockStorage = { access_token: 'existing-valid-token' };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401
      } as Response);

      const result = await fetchSession(true, 'tentative-bad-token');
      expect(result).toBeNull();
      expect(mockStorage.access_token).toBe('existing-valid-token');
    });
  });

  describe('getInboxId', () => {
    const session: JmapSession = {
      apiUrl: 'https://api.fastmail.com/jmap/api/',
      accountId: 'acc-123'
    };

    it('returns cached inbox_id if present', async () => {
      mockStorage = { inbox_id: 'inbox-cached' };
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      const inboxId = await getInboxId(session, 'tok-123');
      expect(inboxId).toBe('inbox-cached');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('queries JMAP for Mailbox with role inbox and caches it', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          methodResponses: [
            ['Mailbox/query', { ids: ['inbox-remote-456'] }, '0']
          ]
        })
      } as Response);

      const inboxId = await getInboxId(session, 'tok-123');
      expect(inboxId).toBe('inbox-remote-456');
      expect(mockStorage.inbox_id).toBe('inbox-remote-456');
    });

    it('clears session on 401 Unauthorized', async () => {
      mockStorage = { access_token: 'tok-123' };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401
      } as Response);

      const inboxId = await getInboxId(session, 'tok-123');
      expect(inboxId).toBeNull();
      expect(mockStorage.access_token).toBeUndefined();
    });
  });

  describe('getUnreadEmails (Single Round-Trip RFC 8620 §3.7 Back-Reference)', () => {
    it('returns notAuthenticated when access_token is missing', async () => {
      const result = await getUnreadEmails();
      expect(result).toEqual({ emails: [], notAuthenticated: true });
    });

    it('executes single JMAP batch combining Email/query and Email/get via #ids back-reference', async () => {
      mockStorage = {
        access_token: 'valid-token',
        api_url: 'https://api.fastmail.com/jmap/api/',
        account_id: 'acc-mail',
        inbox_id: 'inbox-id'
      };

      let sentPayload: any = null;

      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
        sentPayload = JSON.parse(init?.body as string);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            methodResponses: [
              ['Email/query', { ids: ['msg-1', 'msg-2'] }, 'q'],
              [
                'Email/get',
                {
                  list: [
                    { id: 'msg-1', subject: 'First Unread', receivedAt: '2026-09-27T10:00:00Z' },
                    { id: 'msg-2', subject: 'Second Unread', receivedAt: '2026-09-27T11:00:00Z' }
                  ]
                },
                'g'
              ]
            ]
          })
        } as Response;
      });

      const result = await getUnreadEmails();

      // Verify single request structure with RFC 8620 §3.7 back-reference
      expect(sentPayload).not.toBeNull();
      expect(sentPayload.using).toContain('urn:ietf:params:jmap:core');
      expect(sentPayload.using).toContain('urn:ietf:params:jmap:mail');
      expect(sentPayload.methodCalls).toHaveLength(2);

      const [queryCall, getCall] = sentPayload.methodCalls;
      expect(queryCall[0]).toBe('Email/query');
      expect(queryCall[1].filter).toEqual({ notKeyword: '$seen', inMailbox: 'inbox-id' });
      expect(queryCall[2]).toBe('q');

      expect(getCall[0]).toBe('Email/get');
      expect(getCall[1]['#ids']).toEqual({
        resultOf: 'q',
        name: 'Email/query',
        path: '/ids'
      });
      expect(getCall[2]).toBe('g');

      // Verify returned email items
      expect(result.emails).toHaveLength(2);
      expect(result.emails[0].subject).toBe('First Unread');
      expect(result.emails[1].subject).toBe('Second Unread');
    });

    it('returns empty emails array when query returns 0 matches (true Inbox Zero)', async () => {
      mockStorage = {
        access_token: 'valid-token',
        api_url: 'https://api.fastmail.com/jmap/api/',
        account_id: 'acc-mail',
        inbox_id: 'inbox-id'
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          methodResponses: [
            ['Email/query', { ids: [] }, 'q'],
            ['Email/get', { list: [] }, 'g']
          ]
        })
      } as Response);

      const result = await getUnreadEmails();
      expect(result.emails).toEqual([]);
      expect(result.error).toBeUndefined();
      expect(result.notAuthenticated).toBeUndefined();
    });

    it('clears session and returns notAuthenticated on 401 response', async () => {
      mockStorage = {
        access_token: 'invalid-token',
        api_url: 'https://api.fastmail.com/jmap/api/',
        account_id: 'acc-mail',
        inbox_id: 'inbox-id'
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401
      } as Response);

      const result = await getUnreadEmails();
      expect(result).toEqual({ emails: [], notAuthenticated: true });
      expect(mockStorage.access_token).toBeUndefined();
    });

    it('surfaces HTTP server error without masking as empty inbox', async () => {
      mockStorage = {
        access_token: 'valid-token',
        api_url: 'https://api.fastmail.com/jmap/api/',
        account_id: 'acc-mail',
        inbox_id: 'inbox-id'
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 503
      } as Response);

      const result = await getUnreadEmails();
      expect(result.emails).toEqual([]);
      expect(result.error).toBe('Server error (503)');
    });

    it('surfaces JMAP method-level error without masking as empty inbox', async () => {
      mockStorage = {
        access_token: 'valid-token',
        api_url: 'https://api.fastmail.com/jmap/api/',
        account_id: 'acc-mail',
        inbox_id: 'inbox-id'
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          methodResponses: [
            ['error', { type: 'accountNotFound' }, 'q']
          ]
        })
      } as Response);

      const result = await getUnreadEmails();
      expect(result.emails).toEqual([]);
      expect(result.error).toBe('JMAP error: accountNotFound');
    });

    it('surfaces network fetch rejection error cleanly', async () => {
      mockStorage = {
        access_token: 'valid-token',
        api_url: 'https://api.fastmail.com/jmap/api/',
        account_id: 'acc-mail',
        inbox_id: 'inbox-id'
      };

      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const result = await getUnreadEmails();
      expect(result.emails).toEqual([]);
      expect(result.error).toContain('Failed to fetch');
    });

    it('sends Accept: application/json in JMAP API POST requests per RFC 8620 §3.3', async () => {
      mockStorage = {
        access_token: 'tok-123',
        api_url: 'https://api.fastmail.com/jmap/api',
        account_id: 'acc-1',
        inbox_id: 'inbox-1'
      };

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ methodResponses: [['Email/get', { list: [] }, 'g']] })
      } as Response);

      await getUnreadEmails();

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.fastmail.com/jmap/api',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer tok-123',
            'Content-Type': 'application/json',
            Accept: 'application/json'
          })
        })
      );
    });
  });

  describe('fetchEmailBody', () => {
    it('returns HTML content when available', async () => {
      mockStorage = {
        access_token: 'valid-token',
        api_url: 'https://api.fastmail.com/jmap/api/',
        account_id: 'acc-mail'
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          methodResponses: [
            [
              'Email/get',
              {
                list: [
                  {
                    id: 'msg-body-1',
                    htmlBody: [{ partId: 'h1' }],
                    bodyValues: {
                      h1: { value: '<div>Body message</div>' }
                    }
                  }
                ]
              },
              '0'
            ]
          ]
        })
      } as Response);

      const result = await fetchEmailBody('msg-body-1');
      expect(result).toEqual({
        body: '<div>Body message</div>',
        isPlainText: false
      });
    });

    it('specifies maxBodyValueBytes in Email/get request per RFC 8621 §4.1.4', async () => {
      mockStorage = {
        access_token: 'valid-token',
        api_url: 'https://api.fastmail.com/jmap/api/',
        account_id: 'acc-mail'
      };

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          methodResponses: [
            ['Email/get', { list: [{ id: 'msg-1', htmlBody: [{ partId: 'h' }], bodyValues: { h: { value: 'Hi' } } }] }, '0']
          ]
        })
      } as Response);

      await fetchEmailBody('msg-1');

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.fastmail.com/jmap/api/',
        expect.objectContaining({
          body: expect.stringContaining('"maxBodyValueBytes":1048576')
        })
      );
    });

    it('handles 401 Unauthorized by clearing session and reporting error', async () => {
      mockStorage = {
        access_token: 'valid-token',
        api_url: 'https://api.fastmail.com/jmap/api/',
        account_id: 'acc-mail'
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401
      } as Response);

      const result = await fetchEmailBody('msg-123');
      expect(result).toEqual({ body: null, error: 'Authentication expired' });
      expect(mockStorage.access_token).toBeUndefined();
    });

    it('rejects invalid or empty emailId without executing network fetch', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const result = await fetchEmailBody('');
      expect(result).toEqual({ body: null, error: 'Invalid email ID' });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('falls back to email.preview when HTML and text body parts are absent', async () => {
      mockStorage = {
        access_token: 'valid-token',
        api_url: 'https://api.fastmail.com/jmap/api/',
        account_id: 'acc-mail'
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          methodResponses: [
            [
              'Email/get',
              {
                list: [
                  {
                    id: 'msg-preview-only',
                    htmlBody: [],
                    textBody: [],
                    preview: 'Short snippet from preview.'
                  }
                ]
              },
              '0'
            ]
          ]
        })
      } as Response);

      const result = await fetchEmailBody('msg-preview-only');
      expect(result).toEqual({
        body: 'Short snippet from preview.',
        isPlainText: true
      });
    });

    it('surfaces JMAP method error description when provided', async () => {
      mockStorage = {
        access_token: 'valid-token',
        api_url: 'https://api.fastmail.com/jmap/api/',
        account_id: 'acc-mail'
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          methodResponses: [
            ['error', { type: 'invalidArguments', description: 'Invalid property requested' }, '0']
          ]
        })
      } as Response);

      const result = await fetchEmailBody('msg-err');
      expect(result).toEqual({
        body: null,
        error: 'JMAP error: invalidArguments: Invalid property requested'
      });
    });
  });
});
