export interface EmailAddress {
  name?: string;
  email?: string;
}

export interface EmailItem {
  id: string;
  threadId?: string;
  subject?: string;
  from?: EmailAddress[];
  to?: EmailAddress[];
  receivedAt: string;
  preview?: string;
}

export interface JmapSession {
  apiUrl: string;
  accountId: string;
}

export type MessageRequest =
  | { type: 'TEST_AND_SAVE_TOKEN'; token: string }
  | { type: 'FETCH_UNREAD' }
  | { type: 'FETCH_EMAIL_BODY'; emailId: string };

export interface SaveTokenResponse {
  success: boolean;
}

export interface FetchUnreadResponse {
  emails: EmailItem[];
  totalCount?: number;
  notAuthenticated?: boolean;
  error?: string;
}

export interface FetchEmailBodyResponse {
  body: string | null;
  isPlainText?: boolean;
  error?: string;
}

export interface EmailBodyPart {
  partId?: string;
  type?: string;
}

export interface EmailBodyValue {
  value?: string;
  isTruncated?: boolean;
}

export interface EmailDetail {
  id?: string;
  htmlBody?: EmailBodyPart[];
  textBody?: EmailBodyPart[];
  bodyValues?: Record<string, EmailBodyValue>;
  preview?: string;
}

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  API_URL: 'api_url',
  ACCOUNT_ID: 'account_id',
  INBOX_ID: 'inbox_id',
  CACHED_EMAILS: 'cached_emails',
  CACHED_TOTAL_COUNT: 'cached_total_count'
} as const;

export const ALL_AUTH_KEYS = [
  STORAGE_KEYS.ACCESS_TOKEN,
  STORAGE_KEYS.API_URL,
  STORAGE_KEYS.ACCOUNT_ID,
  STORAGE_KEYS.INBOX_ID,
  STORAGE_KEYS.CACHED_EMAILS,
  STORAGE_KEYS.CACHED_TOTAL_COUNT
] as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export type OptionsTab = 'connection' | 'privacy' | 'terms' | 'imprint';

