import { describe, it, expect } from 'vitest';
import { formatTime, getInitials, escapeHtml, buildIframeContent } from './format';
import type { EmailItem } from '../types';

describe('formatTime', () => {
  it('formats today timestamp as time', () => {
    const now = new Date();
    const result = formatTime(now.toISOString());
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('formats older date timestamp as month and day', () => {
    const pastDate = new Date(2025, 0, 15, 10, 30);
    const result = formatTime(pastDate.toISOString());
    expect(result).toMatch(/Jan|15/);
  });

  it('handles invalid date strings gracefully', () => {
    expect(formatTime('invalid-date')).toBe('');
    expect(formatTime('')).toBe('');
  });
});

describe('getInitials', () => {
  it('extracts two letters for full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('Alexander Melde')).toBe('AM');
  });

  it('handles single word names', () => {
    expect(getInitials('Fastmail')).toBe('FA');
    expect(getInitials('X')).toBe('X');
  });

  it('handles missing or empty names', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials(undefined)).toBe('?');
  });

  it('handles excessive spaces', () => {
    expect(getInitials('   Jane    Smith   ')).toBe('JS');
  });
});

describe('escapeHtml', () => {
  it('escapes dangerous HTML characters', () => {
    const input = '<script>alert("XSS" & \'test\')</script>';
    const expected = '&lt;script&gt;alert(&quot;XSS&quot; &amp; &#39;test&#39;)&lt;/script&gt;';
    expect(escapeHtml(input)).toBe(expected);
  });

  it('handles empty or undefined input', () => {
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('leaves safe characters unmodified', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });
});

describe('buildIframeContent', () => {
  const sampleEmail: EmailItem = {
    id: 'msg-123',
    subject: 'Project Update',
    from: [{ name: 'Alice Smith', email: 'alice@example.com' }],
    to: [{ name: 'Bob Jones', email: 'bob@example.com' }],
    receivedAt: '2026-09-20T14:30:00Z',
    preview: 'Here is the weekly update...'
  };

  it('injects Content Security Policy and email header', () => {
    const htmlBody = '<div><p>Meeting notes enclosed.</p></div>';
    const result = buildIframeContent(sampleEmail, htmlBody);

    expect(result).toContain('Content-Security-Policy');
    expect(result).toContain("default-src 'none'");
    expect(result).toContain('Project Update');
    expect(result).toContain('Alice Smith');
    expect(result).toContain('Meeting notes enclosed.');
    expect(result).toContain('https://www.fastmail.com/mail/Message/msg-123');
  });

  it('wraps plain text content safely in a pre tag', () => {
    const plainText = 'Line 1\nLine 2 & <tags>';
    const result = buildIframeContent(sampleEmail, plainText, true);

    expect(result).toContain('<pre style=');
    expect(result).toContain('Line 1\nLine 2 &amp; &lt;tags&gt;');
  });

  it('injects header after existing body tag when present', () => {
    const fullHtml = '<!DOCTYPE html><html><body class="custom-body"><p>Content</p></body></html>';
    const result = buildIframeContent(sampleEmail, fullHtml);

    expect(result).toContain('<body class="custom-body">');
    expect(result).toContain('Project Update');
    expect(result).toContain('<p>Content</p>');
  });
});
