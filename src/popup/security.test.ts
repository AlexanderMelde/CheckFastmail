import { describe, it, expect } from 'vitest';
import { buildIframeContent, escapeHtml } from './format';
import type { EmailItem } from '../types';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Security: Untrusted and Malicious Email Rendering', () => {
  it('prevents XSS breakout in email header metadata (subject, sender, recipient)', () => {
    const maliciousEmail: EmailItem = {
      id: 'malicious-id-123" onclick="alert(\'pwned\')',
      subject: '<script>alert("xss-subject")</script>',
      from: [
        {
          name: '<img src=x onerror="alert(\'xss-name\')"> Alice',
          email: 'attacker" onmouseover="alert(\'xss-email\')@evil.com'
        }
      ],
      to: [
        {
          name: '"> <svg onload="alert(\'xss-recipient\')">',
          email: 'victim@example.com'
        }
      ],
      receivedAt: '2026-09-20T14:30:00Z',
      preview: 'malicious preview'
    };

    const output = buildIframeContent(maliciousEmail, '<p>Normal body</p>');

    // Subject must be escaped
    expect(output).not.toContain('<script>alert("xss-subject")</script>');
    expect(output).toContain('&lt;script&gt;alert(&quot;xss-subject&quot;)&lt;/script&gt;');

    // Sender name must be escaped
    expect(output).not.toContain('<img src=x onerror=');
    expect(output).toContain('&lt;img src=x onerror=&quot;alert(&#39;xss-name&#39;)&quot;&gt;');

    // Recipient must be escaped
    expect(output).not.toContain('<svg onload=');
    expect(output).toContain('&lt;svg onload=&quot;alert(&#39;xss-recipient&#39;)&quot;&gt;');

    // Email ID in the Open in Fastmail link must be URL-encoded and HTML-escaped to prevent attribute injection
    expect(output).not.toContain('onclick="alert(\'pwned\')"');
    expect(output).toContain(escapeHtml(encodeURIComponent('malicious-id-123" onclick="alert(\'pwned\')')));
  });

  it('mandates strict Content-Security-Policy blocking all scripts', () => {
    const email: EmailItem = {
      id: 'msg-csp-test',
      subject: 'Security Check',
      receivedAt: '2026-09-20T14:30:00Z'
    };

    const maliciousBody = `
      <div>
        <script>window.parent.postMessage('stolen', '*');</script>
        <p>Phishing content</p>
      </div>
    `;

    const output = buildIframeContent(email, maliciousBody);

    // Verify CSP meta is present at the very beginning
    expect(output).toContain('<meta http-equiv="Content-Security-Policy"');
    expect(output).toContain("default-src 'none'");
    // External images and data: allowed for inline icons, inline styles allowed for email rendering
    expect(output).toContain("img-src https: data:; style-src 'unsafe-inline';");
  });

  it('safely escapes plain text emails to neutralize HTML injection attacks', () => {
    const email: EmailItem = {
      id: 'msg-plain-attack',
      subject: 'Plain Text Invoice',
      receivedAt: '2026-09-20T14:30:00Z'
    };

    const maliciousPlainText = 'Click here: <a href="javascript:alert(document.cookie)">Login</a>\n<script>evil()</script>';
    const output = buildIframeContent(email, maliciousPlainText, true);

    expect(output).toContain('<pre style=');
    expect(output).not.toContain('<a href="javascript:alert(document.cookie)">');
    expect(output).toContain('&lt;a href=&quot;javascript:alert(document.cookie)&quot;&gt;Login&lt;/a&gt;');
    expect(output).not.toContain('<script>evil()</script>');
    expect(output).toContain('&lt;script&gt;evil()&lt;/script&gt;');
  });

  it('confirms the App.svelte iframe sandbox strictly prohibits allow-scripts and allow-same-origin', () => {
    const sveltePath = path.resolve(__dirname, 'App.svelte');
    const svelteContent = fs.readFileSync(sveltePath, 'utf-8');

    // Extract iframe sandbox attribute value
    const match = svelteContent.match(/sandbox="([^"]+)"/);
    expect(match).not.toBeNull();
    const sandboxValue = match![1];

    // Must not allow scripts to execute in the extension popup context
    expect(sandboxValue).not.toContain('allow-scripts');
    // Must not allow same-origin access to extension cookies, storage, or APIs
    expect(sandboxValue).not.toContain('allow-same-origin');
    // Must allow popups to escape sandbox for legitimate links opening in regular browser tabs
    expect(sandboxValue).toContain('allow-popups');
    expect(sandboxValue).toContain('allow-popups-to-escape-sandbox');
  });
});
