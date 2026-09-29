import { describe, it, expect } from 'vitest';
import { isDemoToken, getDemoEmails, getDemoEmailBody, DEMO_BODIES, DEMO_TOKEN } from './demoData';

describe('demoData', () => {
  describe('isDemoToken', () => {
    it('recognizes exact demo token regardless of casing', () => {
      expect(isDemoToken('demo')).toBe(true);
      expect(isDemoToken('DEMO')).toBe(true);
      expect(isDemoToken('Demo')).toBe(true);
      expect(isDemoToken('  demo  ')).toBe(true);
      expect(isDemoToken(DEMO_TOKEN)).toBe(true);
    });

    it('recognizes demo prefixed and variant tokens', () => {
      expect(isDemoToken('demo-token')).toBe(true);
      expect(isDemoToken('demo-review-mode')).toBe(true);
      expect(isDemoToken('fm1-demo')).toBe(true);
      expect(isDemoToken('fm1-demo-token')).toBe(true);
      expect(isDemoToken('fmfp-demo-credentials')).toBe(true);
    });

    it('rejects non-demo and empty tokens', () => {
      expect(isDemoToken('fmu1-live-secret-token-12345')).toBe(false);
      expect(isDemoToken('fm1-production-token')).toBe(false);
      expect(isDemoToken('my-token-demo')).toBe(false);
      expect(isDemoToken('')).toBe(false);
      expect(isDemoToken('   ')).toBe(false);
      expect(isDemoToken(null)).toBe(false);
      expect(isDemoToken(undefined)).toBe(false);
    });
  });

  describe('getDemoEmails', () => {
    it('returns all 7 demo emails with valid structures and relative timestamps', () => {
      const emails = getDemoEmails();
      expect(emails).toHaveLength(7);

      const ids = emails.map((e) => e.id);
      expect(ids).toEqual(['demo-1', 'demo-2', 'demo-3', 'demo-4', 'demo-5', 'demo-6', 'demo-7']);

      const now = Date.now();
      for (const email of emails) {
        expect(email.id).toBeTruthy();
        expect(email.subject).toBeTruthy();
        expect(email.from).toBeDefined();
        expect(email.from?.length).toBeGreaterThan(0);
        expect(email.to).toBeDefined();
        expect(email.preview).toBeTruthy();

        const time = new Date(email.receivedAt).getTime();
        expect(Number.isNaN(time)).toBe(false);
        // Ensure relative dates are within 48 hours of now
        expect(time).toBeLessThanOrEqual(now);
        expect(time).toBeGreaterThan(now - 1000 * 60 * 60 * 48);
      }
    });
  });

  describe('getDemoEmailBody', () => {
    it('returns rich HTML content for HTML demo emails', () => {
      const demo1 = getDemoEmailBody('demo-1');
      expect(demo1).not.toBeNull();
      expect(demo1?.isPlainText).toBe(false);
      expect(demo1?.body).toContain('apple crumble');

      const demo5 = getDemoEmailBody('demo-5');
      expect(demo5).not.toBeNull();
      expect(demo5?.isPlainText).toBe(false);
      expect(demo5?.body).toContain('check-fastmail.melde.net');
    });

    it('returns plain text content for plain text demo email', () => {
      const demo6 = getDemoEmailBody('demo-6');
      expect(demo6).not.toBeNull();
      expect(demo6?.isPlainText).toBe(true);
      expect(demo6?.body).toContain('open-air festival');
    });

    it('returns null for unknown email ID', () => {
      expect(getDemoEmailBody('unknown-id')).toBeNull();
      expect(getDemoEmailBody('')).toBeNull();
    });

    it('contains bodies for all 7 demo emails', () => {
      for (let i = 1; i <= 7; i++) {
        const id = `demo-${i}`;
        expect(DEMO_BODIES[id]).toBeDefined();
        expect(DEMO_BODIES[id].body.length).toBeGreaterThan(10);
      }
    });
  });
});
