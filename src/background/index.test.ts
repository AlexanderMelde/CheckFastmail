import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockAction = vi.hoisted(() => ({
  setBadgeText: vi.fn(),
  setBadgeBackgroundColor: vi.fn()
}));

const mockAlarms = vi.hoisted(() => ({
  create: vi.fn(),
  clear: vi.fn(),
  onAlarm: { addListener: vi.fn() }
}));

const mockRuntime = vi.hoisted(() => ({
  onMessage: { addListener: vi.fn() }
}));

const callbacks = vi.hoisted(() => ({
  storageListener: null as any
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
    set: vi.fn(async () => {}),
    remove: vi.fn(async () => {})
  }
}));

vi.hoisted(() => {
  globalThis.chrome = {
    action: mockAction,
    alarms: mockAlarms,
    runtime: mockRuntime,
    storage: mockStorage
  } as any;
});

import { updateBadgeCount, setupAlarm, ALARM_NAME } from './index';

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

  describe('setupAlarm', () => {
    it('schedules periodic background alarm with 5-minute interval', () => {
      setupAlarm();
      expect(mockAlarms.create).toHaveBeenCalledWith(ALARM_NAME, { periodInMinutes: 5 });
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

      callbacks.storageListener({ access_token: { newValue: 'tok-new' } }, 'local');

      expect(mockAlarms.create).toHaveBeenCalledWith(ALARM_NAME, { periodInMinutes: 5 });
    });
  });
});
