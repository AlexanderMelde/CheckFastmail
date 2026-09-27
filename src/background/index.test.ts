import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FetchUnreadResponse, JmapSession, FetchEmailBodyResponse } from '../types';

const mockAction = vi.hoisted(() => ({
  setBadgeText: vi.fn(),
  setBadgeBackgroundColor: vi.fn()
}));

const mockAlarms = vi.hoisted(() => ({
  create: vi.fn(),
  clear: vi.fn(),
  get: vi.fn((_name, cb) => cb(null)),
  onAlarm: { addListener: vi.fn() }
}));

const callbacks = vi.hoisted(() => ({
  storageListener: null as any,
  messageListener: null as any,
  contextMenuListener: null as any,
  onInstalledListener: null as any
}));

const mockContextMenus = vi.hoisted(() => ({
  create: vi.fn(),
  removeAll: vi.fn((cb) => cb?.()),
  onClicked: {
    addListener: vi.fn((cb) => {
      callbacks.contextMenuListener = cb;
    })
  }
}));

const mockTabs = vi.hoisted(() => ({
  create: vi.fn()
}));

const mockRuntime = vi.hoisted(() => ({
  onMessage: {
    addListener: vi.fn((cb) => {
      callbacks.messageListener = cb;
    })
  },
  onInstalled: {
    addListener: vi.fn((cb) => {
      callbacks.onInstalledListener = cb;
    })
  }
}));

const mockStorage = vi.hoisted(() => ({
  onChanged: {
    addListener: vi.fn((cb) => {
      callbacks.storageListener = cb;
    })
  },
  local: {
    get: vi.fn(async (_keys, cb) => {
      cb?.({});
      return {};
    }),
    set: vi.fn((_items, cb) => {
      cb?.();
    }),
    remove: vi.fn((_keys, cb) => {
      cb?.();
    })
  }
}));

const mockJmap = vi.hoisted(() => ({
  getUnreadEmails: vi.fn(async (): Promise<FetchUnreadResponse> => ({ emails: [] })),
  fetchSession: vi.fn(async (_force?: boolean, _tok?: string): Promise<JmapSession | null> => null),
  fetchEmailBody: vi.fn(async (_id: string): Promise<FetchEmailBodyResponse> => ({ body: null })),
  clearSession: vi.fn(async (): Promise<void> => {})
}));

vi.mock('./jmap', () => mockJmap);

vi.hoisted(() => {
  globalThis.chrome = {
    action: mockAction,
    alarms: mockAlarms,
    contextMenus: mockContextMenus,
    runtime: mockRuntime,
    storage: mockStorage,
    tabs: mockTabs
  } as any;
});

import { updateBadgeCount, updateBadge, setupAlarm, ALARM_NAME } from './index';

describe('Background Worker Lifecycle & Badge Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateBadgeCount', () => {
    it('sets badge text and color when unread count > 0', async () => {
      await updateBadgeCount(7);
      expect(mockAction.setBadgeText).toHaveBeenCalledWith({ text: '7' });
      expect(mockAction.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#2563eb' });
    });

    it('clears badge text when unread count is 0', async () => {
      await updateBadgeCount(0);
      expect(mockAction.setBadgeText).toHaveBeenCalledWith({ text: '' });
      expect(mockAction.setBadgeBackgroundColor).not.toHaveBeenCalled();
    });
  });

  describe('updateBadge error preservation', () => {
    it('preserves existing badge count when getUnreadEmails returns a network or server error', async () => {
      mockJmap.getUnreadEmails.mockResolvedValueOnce({
        emails: [],
        error: 'Network error: Failed to fetch'
      });

      await updateBadge();

      // Must not wipe the badge
      expect(mockAction.setBadgeText).not.toHaveBeenCalled();
      expect(mockAction.setBadgeBackgroundColor).not.toHaveBeenCalled();
    });

    it('clears badge when notAuthenticated is true', async () => {
      mockJmap.getUnreadEmails.mockResolvedValueOnce({
        emails: [],
        notAuthenticated: true
      });

      await updateBadge();

      expect(mockAction.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });

    it('updates badge to unread count on successful fetch', async () => {
      mockJmap.getUnreadEmails.mockResolvedValueOnce({
        emails: [
          { id: '1', receivedAt: '2026-09-20T00:00:00Z' },
          { id: '2', receivedAt: '2026-09-20T00:00:00Z' },
          { id: '3', receivedAt: '2026-09-20T00:00:00Z' }
        ]
      });

      await updateBadge();

      expect(mockAction.setBadgeText).toHaveBeenCalledWith({ text: '3' });
      expect(mockAction.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#2563eb' });
    });

    it('updates badge to totalCount when totalCount exceeds returned email items', async () => {
      mockJmap.getUnreadEmails.mockResolvedValueOnce({
        emails: [{ id: '1', receivedAt: '2026-09-20T00:00:00Z' }],
        totalCount: 452
      });

      await updateBadge();

      expect(mockAction.setBadgeText).toHaveBeenCalledWith({ text: '452' });
      expect(mockAction.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#2563eb' });
    });

    it('deduplicates concurrent updateBadge calls so only one getUnreadEmails runs', async () => {
      let resolveFetch!: (val: any) => void;
      const fetchPromise = new Promise<FetchUnreadResponse>((res) => {
        resolveFetch = res;
      });
      mockJmap.getUnreadEmails.mockReturnValueOnce(fetchPromise);

      const call1 = updateBadge();
      const call2 = updateBadge();

      resolveFetch({
        emails: [{ id: '1', receivedAt: '2026-09-28T00:00:00Z' }]
      });

      await Promise.all([call1, call2]);

      expect(mockJmap.getUnreadEmails).toHaveBeenCalledTimes(1);
      expect(mockAction.setBadgeText).toHaveBeenCalledWith({ text: '1' });
    });
  });

  describe('setupAlarm', () => {
    it('schedules periodic background alarm with 5-minute interval if none exists', () => {
      mockAlarms.get.mockImplementationOnce((_name, cb) => cb(null));
      setupAlarm();
      expect(mockAlarms.create).toHaveBeenCalledWith(ALARM_NAME, { periodInMinutes: 5 });
    });

    it('does not recreate alarm if an alarm is already scheduled', () => {
      mockAlarms.get.mockImplementationOnce((_name, cb) => cb({ name: ALARM_NAME, scheduledTime: 12345 }));
      setupAlarm();
      expect(mockAlarms.create).not.toHaveBeenCalled();
    });
  });

  describe('Root-Cause Storage Change Listener', () => {
    it('clears alarm and badge immediately when access_token is removed (e.g. disconnect)', () => {
      expect(callbacks.storageListener).toBeDefined();

      callbacks.storageListener({ access_token: { oldValue: 'tok-123' } }, 'local');

      expect(mockAlarms.clear).toHaveBeenCalledWith(ALARM_NAME);
      expect(mockAction.setBadgeText).toHaveBeenCalledWith({ text: '' });
      expect(mockStorage.local.remove).toHaveBeenCalledWith(['inbox_id', 'api_url', 'account_id']);
    });

    it('sets up alarm and clears cached inbox_id when access_token is set or updated', () => {
      expect(callbacks.storageListener).toBeDefined();
      mockAlarms.get.mockImplementationOnce((_name, cb) => cb(null));

      callbacks.storageListener({ access_token: { newValue: 'tok-new' } }, 'local');

      expect(mockStorage.local.remove).toHaveBeenCalledWith(['inbox_id']);
      expect(mockAlarms.create).toHaveBeenCalledWith(ALARM_NAME, { periodInMinutes: 5 });
    });
  });

  describe('TEST_AND_SAVE_TOKEN Message Handler', () => {
    it('verifies token in-memory and writes credentials atomically when valid', async () => {
      expect(callbacks.messageListener).toBeDefined();
      mockJmap.fetchSession.mockResolvedValueOnce({
        apiUrl: 'https://api.fastmail.com/jmap/api',
        accountId: 'acc-mail-1'
      });

      const sendResponse = vi.fn();
      callbacks.messageListener(
        { type: 'TEST_AND_SAVE_TOKEN', token: 'valid-test-token' },
        {},
        sendResponse
      );

      await vi.waitFor(() => {
        expect(sendResponse).toHaveBeenCalledWith({ success: true });
      });

      expect(mockJmap.fetchSession).toHaveBeenCalledWith(true, 'valid-test-token');
      expect(mockStorage.local.remove).toHaveBeenCalledWith(['inbox_id'], expect.any(Function));
      expect(mockStorage.local.set).toHaveBeenCalledWith(
        {
          access_token: 'valid-test-token',
          api_url: 'https://api.fastmail.com/jmap/api',
          account_id: 'acc-mail-1'
        },
        expect.any(Function)
      );
    });

    it('rejects and does NOT write to local storage when token is invalid', async () => {
      expect(callbacks.messageListener).toBeDefined();
      mockJmap.fetchSession.mockResolvedValueOnce(null);

      const sendResponse = vi.fn();
      callbacks.messageListener(
        { type: 'TEST_AND_SAVE_TOKEN', token: 'invalid-token' },
        {},
        sendResponse
      );

      await vi.waitFor(() => {
        expect(sendResponse).toHaveBeenCalledWith({ success: false });
      });

      expect(mockStorage.local.set).not.toHaveBeenCalled();
    });
  });

  describe('FETCH_EMAIL_BODY Message Handler', () => {
    it('returns error when emailId is missing or empty', () => {
      const sendResponse = vi.fn();
      callbacks.messageListener({ type: 'FETCH_EMAIL_BODY', emailId: '' }, {}, sendResponse);
      expect(sendResponse).toHaveBeenCalledWith({ body: null, error: 'Invalid email ID' });
      expect(mockJmap.fetchEmailBody).not.toHaveBeenCalled();
    });

    it('delegates to fetchEmailBody and replies with response when emailId is valid', async () => {
      mockJmap.fetchEmailBody.mockResolvedValueOnce({
        body: '<p>Content</p>',
        isPlainText: false
      });

      const sendResponse = vi.fn();
      callbacks.messageListener({ type: 'FETCH_EMAIL_BODY', emailId: 'msg-valid' }, {}, sendResponse);

      await vi.waitFor(() => {
        expect(sendResponse).toHaveBeenCalledWith({
          body: '<p>Content</p>',
          isPlainText: false
        });
      });

      expect(mockJmap.fetchEmailBody).toHaveBeenCalledWith('msg-valid');
    });
  });

  describe('Right-Click Context Menu ("Open Fastmail")', () => {
    it('sets up "Open Fastmail" context menu with contexts: ["action"]', () => {
      mockContextMenus.create.mockClear();
      mockContextMenus.removeAll.mockClear();

      callbacks.onInstalledListener?.();

      expect(mockContextMenus.removeAll).toHaveBeenCalled();
      expect(mockContextMenus.create).toHaveBeenCalledWith({
        id: 'OPEN_FASTMAIL',
        title: 'Open Fastmail',
        contexts: ['action']
      });
    });

    it('opens Fastmail web interface in new tab when context menu item is clicked', () => {
      expect(callbacks.contextMenuListener).toBeDefined();

      callbacks.contextMenuListener({ menuItemId: 'OPEN_FASTMAIL' });

      expect(mockTabs.create).toHaveBeenCalledWith({ url: 'https://app.fastmail.com/mail/' });
    });

    it('ignores clicks from unrecognized context menu items', () => {
      mockTabs.create.mockClear();

      callbacks.contextMenuListener({ menuItemId: 'OTHER_ITEM' });

      expect(mockTabs.create).not.toHaveBeenCalled();
    });
  });
});
