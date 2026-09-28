import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PopupState } from './popupState.svelte';
import type { EmailItem, FetchUnreadResponse, FetchEmailBodyResponse } from '../../shared/types';
import type { extensionClient } from '../services/extensionClient';

describe('PopupState Model & SWR Lifecycle', () => {
  let mockClient: typeof extensionClient;
  let tokenListener: ((token: string | null) => void) | null;

  const mockEmail1: EmailItem = {
    id: 'email-1',
    subject: 'First Email',
    receivedAt: '2026-09-28T10:00:00Z',
    from: [{ name: 'Alice', email: 'alice@example.com' }]
  };

  const mockEmail2: EmailItem = {
    id: 'email-2',
    subject: 'Second Email',
    receivedAt: '2026-09-28T11:00:00Z',
    from: [{ name: 'Bob', email: 'bob@example.com' }]
  };

  beforeEach(() => {
    tokenListener = null;

    mockClient = {
      getCachedUnread: vi.fn(async () => ({ emails: [], totalCount: undefined })),
      fetchUnread: vi.fn(async (): Promise<FetchUnreadResponse> => ({ emails: [] })),
      fetchEmailBody: vi.fn(async (_id: string): Promise<FetchEmailBodyResponse> => ({ body: '<p>Body</p>', isPlainText: false })),
      testAndSaveToken: vi.fn(async () => true),
      disconnect: vi.fn(async () => {}),
      getStoredToken: vi.fn(async () => 'mock-token'),
      onTokenChanged: vi.fn((cb) => {
        tokenListener = cb;
        return () => {
          tokenListener = null;
        };
      }),
      openOptionsPage: vi.fn()
    };
  });

  it('initializes with default loading states', () => {
    const state = new PopupState({ client: mockClient, minSpinnerDurationMs: 0 });
    expect(state.unreadEmails).toEqual([]);
    expect(state.isLoading).toBe(true);
    expect(state.hasInitialized).toBe(false);
    expect(state.isAuthenticated).toBe(true);
    expect(state.selectedEmail).toBeNull();
  });

  describe('SWR Cache Hydration & Silent Revalidation', () => {
    it('instantly renders cached emails (0ms) and silently revalidates in the background', async () => {
      vi.mocked(mockClient.getCachedUnread).mockResolvedValueOnce({
        emails: [mockEmail1],
        totalCount: 1
      });

      vi.mocked(mockClient.fetchUnread).mockResolvedValueOnce({
        emails: [mockEmail1, mockEmail2],
        totalCount: 2
      });

      const state = new PopupState({ client: mockClient, minSpinnerDurationMs: 0 });
      await state.init();

      expect(mockClient.getCachedUnread).toHaveBeenCalled();
      expect(mockClient.fetchUnread).toHaveBeenCalled();
      expect(state.unreadEmails).toHaveLength(2);
      expect(state.totalCount).toBe(2);
      expect(state.hasInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.selectedEmail?.id).toBe('email-1');
    });

    it('performs standard fetch when no cached emails exist', async () => {
      vi.mocked(mockClient.getCachedUnread).mockResolvedValueOnce({
        emails: [],
        totalCount: 0
      });

      vi.mocked(mockClient.fetchUnread).mockResolvedValueOnce({
        emails: [mockEmail2],
        totalCount: 1
      });

      const state = new PopupState({ client: mockClient, minSpinnerDurationMs: 0 });
      await state.init();

      expect(state.unreadEmails).toHaveLength(1);
      expect(state.unreadEmails[0].id).toBe('email-2');
      expect(state.selectedEmail?.id).toBe('email-2');
      expect(state.hasInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Authentication & Error States', () => {
    it('transitions isAuthenticated to false when response indicates notAuthenticated', async () => {
      vi.mocked(mockClient.fetchUnread).mockResolvedValueOnce({
        emails: [],
        notAuthenticated: true
      });

      const state = new PopupState({ client: mockClient, minSpinnerDurationMs: 0 });
      await state.init();

      expect(state.isAuthenticated).toBe(false);
      expect(state.hasInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('captures network or server errorMsg without clearing authenticated state', async () => {
      vi.mocked(mockClient.fetchUnread).mockResolvedValueOnce({
        emails: [],
        error: 'Fastmail gateway timeout (504)'
      });

      const state = new PopupState({ client: mockClient, minSpinnerDurationMs: 0 });
      await state.init();

      expect(state.isAuthenticated).toBe(true);
      expect(state.errorMsg).toBe('Fastmail gateway timeout (504)');
      expect(state.hasInitialized).toBe(true);
    });
  });

  describe('Email Selection & Race Condition Guards', () => {
    it('fetches email body and sets HTML content', async () => {
      vi.mocked(mockClient.fetchEmailBody).mockResolvedValueOnce({
        body: '<div>Message content</div>',
        isPlainText: false
      });

      const state = new PopupState({ client: mockClient, minSpinnerDurationMs: 0 });
      await state.selectEmail(mockEmail1);

      expect(state.selectedEmail).toEqual(mockEmail1);
      expect(state.emailBody).toBe('<div>Message content</div>');
      expect(state.isPlainText).toBe(false);
      expect(state.emailBodyError).toBe(false);
      expect(state.isLoadingBody).toBe(false);
    });

    it('handles plain text bodies correctly', async () => {
      vi.mocked(mockClient.fetchEmailBody).mockResolvedValueOnce({
        body: 'Plain text note',
        isPlainText: true
      });

      const state = new PopupState({ client: mockClient, minSpinnerDurationMs: 0 });
      await state.selectEmail(mockEmail1);

      expect(state.emailBody).toBe('Plain text note');
      expect(state.isPlainText).toBe(true);
    });

    it('handles body fetch failures with error state', async () => {
      vi.mocked(mockClient.fetchEmailBody).mockResolvedValueOnce({
        body: null,
        error: 'Network timeout'
      });

      const state = new PopupState({ client: mockClient, minSpinnerDurationMs: 0 });
      await state.selectEmail(mockEmail1);

      expect(state.emailBody).toBe('Error: Network timeout');
      expect(state.emailBodyError).toBe(true);
      expect(state.isPlainText).toBe(true);
    });

    it('prevents race conditions when user rapidly selects email 1 then email 2', async () => {
      let resolveFirst!: (res: FetchEmailBodyResponse) => void;
      const firstPromise = new Promise<FetchEmailBodyResponse>((resolve) => {
        resolveFirst = resolve;
      });

      vi.mocked(mockClient.fetchEmailBody).mockReturnValueOnce(firstPromise);
      vi.mocked(mockClient.fetchEmailBody).mockResolvedValueOnce({
        body: '<p>Email 2 content</p>',
        isPlainText: false
      });

      const state = new PopupState({ client: mockClient, minSpinnerDurationMs: 0 });

      // Click email 1 (slow)
      const select1 = state.selectEmail(mockEmail1);
      // Immediately click email 2 (fast)
      const select2 = state.selectEmail(mockEmail2);

      await select2;
      expect(state.selectedEmail?.id).toBe('email-2');
      expect(state.emailBody).toBe('<p>Email 2 content</p>');

      // Now slow email 1 finally resolves late
      resolveFirst({
        body: '<p>Outdated email 1</p>',
        isPlainText: false
      });
      await select1;

      // Email 2 must NOT be overwritten by the delayed Email 1 response
      expect(state.selectedEmail?.id).toBe('email-2');
      expect(state.emailBody).toBe('<p>Email 2 content</p>');
    });
  });

  describe('Selection Maintenance Across Refreshes', () => {
    it('preserves existing selection when selected email is still in refreshed list', async () => {
      vi.mocked(mockClient.fetchUnread).mockResolvedValueOnce({
        emails: [mockEmail1, mockEmail2]
      });

      const state = new PopupState({ client: mockClient, minSpinnerDurationMs: 0 });
      await state.init();

      // User selects second email
      await state.selectEmail(mockEmail2);
      expect(state.selectedEmail?.id).toBe('email-2');

      // Now background refresh runs, returning both emails
      vi.mocked(mockClient.fetchUnread).mockResolvedValueOnce({
        emails: [mockEmail1, mockEmail2]
      });
      await state.refresh();

      // Selection must remain on email-2
      expect(state.selectedEmail?.id).toBe('email-2');
    });

    it('falls back to first email when previously selected email was removed/read', async () => {
      vi.mocked(mockClient.fetchUnread).mockResolvedValueOnce({
        emails: [mockEmail1, mockEmail2]
      });

      const state = new PopupState({ client: mockClient, minSpinnerDurationMs: 0 });
      await state.init();

      await state.selectEmail(mockEmail2);
      expect(state.selectedEmail?.id).toBe('email-2');

      // Refresh runs where email-2 has been marked as read in another tab
      vi.mocked(mockClient.fetchUnread).mockResolvedValueOnce({
        emails: [mockEmail1]
      });
      await state.refresh();

      // Must fall back to email-1
      expect(state.selectedEmail?.id).toBe('email-1');
    });

    it('resets selection and body to null on inbox zero', async () => {
      vi.mocked(mockClient.fetchUnread).mockResolvedValueOnce({
        emails: [mockEmail1]
      });

      const state = new PopupState({ client: mockClient, minSpinnerDurationMs: 0 });
      await state.init();
      expect(state.selectedEmail).not.toBeNull();

      // Refresh returns empty list
      vi.mocked(mockClient.fetchUnread).mockResolvedValueOnce({
        emails: []
      });
      await state.refresh();

      expect(state.unreadEmails).toEqual([]);
      expect(state.selectedEmail).toBeNull();
      expect(state.emailBody).toBeNull();
      expect(state.emailBodyError).toBe(false);
    });
  });

  describe('Options and Destroy Lifecycle', () => {
    it('delegates openOptions to extensionClient', () => {
      const state = new PopupState({ client: mockClient, minSpinnerDurationMs: 0 });
      state.openOptions();
      expect(mockClient.openOptionsPage).toHaveBeenCalled();
    });

    it('re-fetches emails when storage access_token changes', async () => {
      const state = new PopupState({ client: mockClient, minSpinnerDurationMs: 0 });
      await state.init();

      expect(tokenListener).toBeDefined();
      vi.mocked(mockClient.fetchUnread).mockClear();

      tokenListener?.('new-token');
      expect(mockClient.fetchUnread).toHaveBeenCalled();
    });

    it('unsubscribes token listener on destroy', async () => {
      const state = new PopupState({ client: mockClient, minSpinnerDurationMs: 0 });
      await state.init();
      expect(tokenListener).toBeDefined();

      state.destroy();
      expect(tokenListener).toBeNull();
    });
  });
});
