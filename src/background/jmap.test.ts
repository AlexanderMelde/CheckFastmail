import { describe, it, expect } from 'vitest';
import { extractBodyFromEmail } from './jmap';

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
});
