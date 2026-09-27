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
  messageListener: null as any
}));

const mockRuntime = vi.hoisted(() => ({
  onMessage: {
    addListener: vi.fn((cb) => {
      callbacks.messageListener = cb;
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
    remove: vi.fn(async () => {})
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
    runtime: mockRuntime,
    storage: mockStorage
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
    });

    it('sets up alarm when access_token is set or updated', () => {
      expect(callbacks.storageListener).toBeDefined();
      mockAlarms.get.mockImplementationOnce((_name, cb) => cb(null));

      callbacks.storageListener({ access_token: { newValue: 'tok-new' } }, 'local');

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
});
