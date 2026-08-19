// ============================================================================
// 1. JMAP Protocol Spec Models (RFC 8620 & RFC 8621)
// ============================================================================

/** JMAP EmailAddress object (RFC 8621 §4.1.2) */
export interface EmailAddress {
  name?: string;
  email?: string;
}

/** Summarized JMAP Email object for unread inbox listing (RFC 8621 §4.1.4) */
export interface EmailItem {
  id: string;
  threadId?: string;
  subject?: string;
  from?: EmailAddress[];
  to?: EmailAddress[];
  receivedAt: string;
  preview?: string;
}

/** JMAP Session discovery state (RFC 8620 §2) */
export interface JmapSession {
  apiUrl: string;
  accountId: string;
  isReadOnly?: boolean;
}

/** Single body part descriptor within an Email (RFC 8621 §4.1.4) */
export interface EmailBodyPart {
  partId?: string;
  type?: string;
}

/** Extracted text/html body value (RFC 8621 §4.1.4) */
export interface EmailBodyValue {
  value?: string;
  isTruncated?: boolean;
}

/** Detailed Email object requested during body fetch */
export interface EmailDetail {
  id?: string;
  htmlBody?: EmailBodyPart[];
  textBody?: EmailBodyPart[];
  bodyValues?: Record<string, EmailBodyValue>;
  preview?: string;
}

// ============================================================================
// 2. Chrome Extension Messaging Protocol (Runtime RPC)
// ============================================================================

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

// ============================================================================
// 3. Extension Local Storage Contract (MV3 Token & Cache Isolation)
// ============================================================================

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  API_URL: 'api_url',
  ACCOUNT_ID: 'account_id',
  IS_READ_ONLY: 'is_read_only',
  INBOX_ID: 'inbox_id',
  CACHED_EMAILS: 'cached_emails',
  CACHED_TOTAL_COUNT: 'cached_total_count'
} as const;

export const ALL_AUTH_KEYS = [
  STORAGE_KEYS.ACCESS_TOKEN,
  STORAGE_KEYS.API_URL,
  STORAGE_KEYS.ACCOUNT_ID,
  STORAGE_KEYS.IS_READ_ONLY,
  STORAGE_KEYS.INBOX_ID,
  STORAGE_KEYS.CACHED_EMAILS,
  STORAGE_KEYS.CACHED_TOTAL_COUNT
] as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ============================================================================
// 4. UI, Routing & Navigation Models
// ============================================================================

export type OptionsTab = 'connection' | 'privacy' | 'terms' | 'imprint';

export type SiteTab = 'features' | 'installation' | 'develop' | 'privacy' | 'terms' | 'imprint';

export type RouteName = OptionsTab | SiteTab;

export type NavIcon =
  | 'connection'
  | 'sparkles'
  | 'download'
  | 'code'
  | 'shield'
  | 'doc'
  | 'info'
  | 'settings';

export interface NavItem {
  id: string;
  label: string;
  icon: NavIcon;
  badge?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}
