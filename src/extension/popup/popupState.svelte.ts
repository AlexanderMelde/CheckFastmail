import type { EmailItem } from '../../shared/types';
import { extensionClient } from '../services/extensionClient';

export interface PopupStateDependencies {
  client?: typeof extensionClient;
  minSpinnerDurationMs?: number;
}

export class PopupState {
  private client: typeof extensionClient;
  private minSpinnerDurationMs: number;
  private unsubscribeTokenListener?: () => void;
  private selectionSequenceId = 0;

  unreadEmails = $state<EmailItem[]>([]);
  totalCount = $state<number | undefined>(undefined);
  isLoading = $state(true);
  hasInitialized = $state(false);
  errorMsg = $state('');
  isAuthenticated = $state(true);

  selectedEmail = $state<EmailItem | null>(null);
  emailBody = $state<string | null>(null);
  emailBodyError = $state(false);
  isPlainText = $state(false);
  isLoadingBody = $state(false);

  constructor(deps: PopupStateDependencies = {}) {
    this.client = deps.client ?? extensionClient;
    this.minSpinnerDurationMs = deps.minSpinnerDurationMs ?? 300;
  }

  async init(): Promise<void> {
    try {
      const cached = await this.client.getCachedUnread();
      if (cached.emails && cached.emails.length > 0) {
        this.unreadEmails = cached.emails;
        this.totalCount = cached.totalCount;
        this.hasInitialized = true;
        this.isLoading = false;
        await this.selectEmail(cached.emails[0]);
        // Silently revalidate fresh state in background
        await this.fetchEmails(true);
      } else {
        await this.fetchEmails(false);
      }
    } catch {
      await this.fetchEmails(false);
    }

    this.unsubscribeTokenListener = this.client.onTokenChanged(() => {
      this.fetchEmails(false);
    });
  }

  async fetchEmails(isSilentRevalidate = false): Promise<void> {
    if (!isSilentRevalidate) {
      this.isLoading = true;
    }
    this.errorMsg = '';

    const startTime = Date.now();
    const finishLoading = async () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < this.minSpinnerDurationMs && !isSilentRevalidate) {
        await new Promise((resolve) => setTimeout(resolve, this.minSpinnerDurationMs - elapsed));
      }
      this.isLoading = false;
    };

    try {
      const response = await this.client.fetchUnread();
      this.hasInitialized = true;

      if (response.notAuthenticated) {
        this.isAuthenticated = false;
      } else if (response.error) {
        this.errorMsg = response.error;
      } else if (response.emails) {
        this.isAuthenticated = true;
        this.unreadEmails = response.emails;
        this.totalCount =
          typeof response.totalCount === 'number'
            ? response.totalCount
            : response.emails.length;

        if (this.unreadEmails.length > 0) {
          const stillSelected =
            this.selectedEmail && this.unreadEmails.find((e) => e.id === this.selectedEmail?.id);
          if (!stillSelected) {
            await this.selectEmail(this.unreadEmails[0]);
          }
        } else {
          this.selectedEmail = null;
          this.emailBody = null;
          this.emailBodyError = false;
        }
      } else {
        this.errorMsg = 'Failed to fetch emails. Please check your connection in Options.';
      }
    } finally {
      await finishLoading();
    }
  }

  async selectEmail(email: EmailItem): Promise<void> {
    if (this.selectedEmail?.id === email.id && this.emailBody !== null && !this.emailBodyError) {
      return;
    }
    if (this.selectedEmail?.id === email.id && this.isLoadingBody) {
      return;
    }

    const requestId = ++this.selectionSequenceId;
    this.selectedEmail = email;
    this.emailBody = null;
    this.emailBodyError = false;
    this.isPlainText = false;
    this.isLoadingBody = true;

    const response = await this.client.fetchEmailBody(email.id);

    if (requestId === this.selectionSequenceId) {
      this.isLoadingBody = false;
      if (response && response.body !== null) {
        this.emailBody = response.body;
        this.emailBodyError = false;
        this.isPlainText = Boolean(response.isPlainText);
      } else {
        this.emailBody = response?.error
          ? `Error: ${response.error}`
          : 'Could not load email content.';
        this.emailBodyError = true;
        this.isPlainText = true;
      }
    }
  }

  async refresh(): Promise<void> {
    await this.fetchEmails(false);
  }

  openOptions(): void {
    this.client.openOptionsPage();
  }

  destroy(): void {
    if (this.unsubscribeTokenListener) {
      this.unsubscribeTokenListener();
      this.unsubscribeTokenListener = undefined;
    }
  }
}
