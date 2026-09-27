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
  notAuthenticated?: boolean;
  error?: string;
}

export interface FetchEmailBodyResponse {
  body: string | null;
  isPlainText?: boolean;
  error?: string;
}

