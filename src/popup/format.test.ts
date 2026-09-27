import { describe, it, expect } from 'vitest';
import { formatTime, getInitials, escapeHtml, buildIframeContent } from './format';
import type { EmailItem } from '../types';

describe('formatTime', () => {
  it('formats today timestamp as time', () => {
    const now = new Date();
    const result = formatTime(now.toISOString());
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('formats older date timestamp as month and day when in current year', () => {
    const thisYear = new Date().getFullYear();
    const thisYearDate = new Date(thisYear, 0, 15, 10, 30);
    const targetDate = new Date().getMonth() === 0 && new Date().getDate() === 15 ? new Date(thisYear, 1, 15) : thisYearDate;
    const result = formatTime(targetDate.toISOString());
    expect(result).toMatch(/Jan|Feb|15/);
    expect(result).not.toContain(thisYear.toString());
  });

  it('formats dates from prior years with the year included', () => {
    const priorYearDate = new Date(2020, 4, 12, 10, 30);
    const result = formatTime(priorYearDate.toISOString());
    expect(result).toContain('2020');
    expect(result).toMatch(/May|12/);
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

  it('handles unicode and emoji characters without surrogate pair truncation', () => {
    expect(getInitials('🎉 Party')).toBe('🎉P');
    expect(getInitials('🚀')).toBe('🚀');
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
    expect(result).toContain('https://app.fastmail.com/mail/Message/msg-123');
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

  it('renders safe HTML when subject or sender contains special replace patterns like $&, $\', and $100', () => {
    const specialEmail: EmailItem = {
      id: 'msg-special',
      subject: 'Special offer: $100 off & $& discount with $\' bonus!',
      from: [{ name: 'Deals & $1 team', email: 'deals$@example.com' }],
      receivedAt: '2026-09-20T14:30:00Z'
    };

    const fullHtml = '<!DOCTYPE html><html><body><p>Exclusive body content</p></body></html>';
    const result = buildIframeContent(specialEmail, fullHtml);

    // Verifies that $& is not interpreted as replacing matched substring with <body>
    expect(result).not.toContain('&lt;body&gt;');
    expect(result).toContain('Special offer: $100 off &amp; $&amp; discount with $&#39; bonus!');
    expect(result).toContain('Deals &amp; $1 team');
    // Verifies that $' did not duplicate the rest of the email body into the subject header
    const occurrences = (result.match(/Exclusive body content/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('injects CSP into head when head and body are both present', () => {
    const fullHtml = '<!DOCTYPE html><html><head><title>Email</title></head><body><p>Content</p></body></html>';
    const result = buildIframeContent(sampleEmail, fullHtml);

    expect(result).toContain('<head><meta http-equiv="Content-Security-Policy"');
    expect(result).toContain('<body>');
    expect(result).toContain('Project Update');
  });

  it('handles non-string escapeHtml gracefully', () => {
    expect(escapeHtml(123 as any)).toBe('');
    expect(escapeHtml(null as any)).toBe('');
  });

  it('injects tracker pixel hiding styles (trackerFixStyle)', () => {
    const result = buildIframeContent(sampleEmail, '<p>Body</p>');
    expect(result).toContain('img[width="1"][height="1"]');
    expect(result).toContain('display: none !important');
  });

  it('handles HTML with head tag but no body tag correctly', () => {
    const headOnlyHtml = '<html><head><title>Test</title></head><div>No body tag</div></html>';
    const result = buildIframeContent(sampleEmail, headOnlyHtml);
    expect(result).toContain('<head><meta http-equiv="Content-Security-Policy"');
    expect(result).toContain('</head>');
    expect(result).toContain('Project Update');
    expect(result).toContain('<div>No body tag</div>');
  });
});
