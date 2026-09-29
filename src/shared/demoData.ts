import type { EmailItem } from './types';

export const DEMO_TOKEN = 'demo';

/**
 * Checks whether a given token string represents the special reviewer demo mode token.
 * Matches case-insensitively for 'demo', tokens starting with 'demo', or 'fm1-demo'/'fmfp-demo'.
 */
export function isDemoToken(token?: string | null): boolean {
  if (!token) return false;
  const t = token.trim().toLowerCase();
  return (
    t === 'demo' ||
    t.startsWith('demo') ||
    t.startsWith('fm1-demo') ||
    t.startsWith('fmfp-demo')
  );
}

/**
 * Returns the demo emails list with freshly computed relative timestamps.
 * Preserves the rich demo items from the original repository history.
 */
export function getDemoEmails(): EmailItem[] {
  const now = Date.now();
  return [
    {
      id: 'demo-1',
      subject: 'Sunday family dinner & your favorite apple pie 🥧',
      from: [{ name: 'Mom', email: 'mom@family.net' }],
      to: [{ name: 'Alexander Melde', email: 'check-fastmail@melde.net' }],
      receivedAt: new Date(now - 1000 * 60 * 15).toISOString(),
      preview: "Hey Alex! Are you coming over this Sunday around 2pm? Dad is firing up the barbecue and I'm baking your favorite apple crumble..."
    },
    {
      id: 'demo-2',
      subject: 'Photos from our weekend hike in the Black Forest 🌲',
      from: [{ name: 'Sarah', email: 'sarah@family.org' }],
      to: [{ name: 'Alexander Melde', email: 'check-fastmail@melde.net' }],
      receivedAt: new Date(now - 1000 * 60 * 45).toISOString(),
      preview: 'Hey! Finally got around to sorting through the photos from Saturday. The weather at the summit was incredible! Are we still on for coffee...'
    },
    {
      id: 'demo-3',
      subject: 'Quick question about the bike rack / train tickets 🚲',
      from: [{ name: 'Dad', email: 'dad@family.net' }],
      to: [{ name: 'Alexander Melde', email: 'check-fastmail@melde.net' }],
      receivedAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      preview: "Hi Alex, do you still have my bicycle rack in your basement? Also let me know when your train arrives on Sunday and I'll pick you up..."
    },
    {
      id: 'demo-4',
      subject: "Secret plan for Grandma's 80th birthday party 🤫",
      from: [{ name: 'Uncle Thomas', email: 'thomas.k@mail.de' }],
      to: [{ name: 'Alexander Melde', email: 'check-fastmail@melde.net' }],
      receivedAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
      preview: 'Hey everyone, please keep this quiet around Grandma! We reserved the garden terrace for Saturday the 24th. Who has old photos...'
    },
    {
      id: 'demo-5',
      subject: 'GitHub Pages deployment succeeded: check-fastmail.melde.net',
      from: [{ name: 'GitHub', email: 'notifications@github.com' }],
      to: [{ name: 'Alexander Melde', email: 'check-fastmail@melde.net' }],
      receivedAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
      preview: 'Your GitHub Pages site is live and reachable at https://check-fastmail.melde.net/. All 123 automated test suites passed.'
    },
    {
      id: 'demo-6',
      subject: 'Concert tickets for next month — are you in? 🎸',
      from: [{ name: 'Julian', email: 'julian.m@outlook.com' }],
      to: [{ name: 'Alexander Melde', email: 'check-fastmail@melde.net' }],
      receivedAt: new Date(now - 1000 * 60 * 60 * 22).toISOString(),
      preview: "Hey Alex! Pre-sale starts tomorrow morning at 10 AM. Let me know if I should grab a ticket for you too before they sell out..."
    },
    {
      id: 'demo-7',
      subject: 'Welcome to Fastmail — API Token ready',
      from: [{ name: 'Fastmail Support', email: 'support@fastmail.com' }],
      to: [{ name: 'Alexander Melde', email: 'check-fastmail@melde.net' }],
      receivedAt: new Date(now - 1000 * 60 * 60 * 28).toISOString(),
      preview: 'Your personal API token for Checker for Fastmail is active. Fastmail supports the open JMAP protocol (RFC 8620 / 8621).'
    }
  ];
}

export const DEMO_BODIES: Record<string, { body: string; isPlainText: boolean }> = {
  'demo-1': {
    isPlainText: false,
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 580px; margin: 0 auto; padding: 16px 0;">
        <p style="font-size: 14px; margin: 0 0 14px 0;">
          Hey Alex,
        </p>
        <p style="font-size: 14px; margin: 0 0 14px 0;">
          Are you joining us for dinner this Sunday? We're planning to eat around 2:00 PM out on the patio if the sun stays out!
        </p>
        <div style="background: #fdf4ff; border: 1px solid #f5d0fe; border-radius: 8px; padding: 14px 18px; margin: 18px 0;">
          <strong style="color: #86198f; font-size: 13px; display: block; margin-bottom: 6px;">Sunday Menu:</strong>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #4a044e; line-height: 1.5;">
            <li>Dad's homemade rosemary roast potatoes & barbecue skewers</li>
            <li>Fresh garden salad</li>
            <li>Warm cinnamon apple crumble (your recipe request!) with vanilla ice cream 🍨</li>
          </ul>
        </div>
        <p style="font-size: 14px; margin: 0 0 14px 0;">
          Could you bring that new board game you mentioned last time? Sarah and Julian are coming too, so we'll have a full table.
        </p>
        <p style="font-size: 14px; margin: 0 0 14px 0;">
          Let me know by Friday so I can buy enough ingredients!
        </p>
        <p style="font-size: 14px; margin: 20px 0 0 0; color: #334155;">
          Love,<br>
          <strong>Mom</strong>
        </p>
      </div>
    `
  },
  'demo-2': {
    isPlainText: false,
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 580px; margin: 0 auto; padding: 16px 0;">
        <p style="font-size: 14px; margin: 0 0 14px 0;">
          Hey Alex!
        </p>
        <p style="font-size: 14px; margin: 0 0 14px 0;">
          Finally got around to uploading the photos from our weekend hike in the Black Forest 🌲. The view from the summit at sunset was absolutely worth the steep climb!
        </p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #166534;">
          <strong>Trail stats:</strong> 14.2 km &bull; 480m elevation gain &bull; 3h 45m walking time
        </div>
        <p style="font-size: 14px; margin: 0 0 14px 0;">
          Are we still on for coffee this Wednesday afternoon? I found a cozy new place near the park with great espresso.
        </p>
        <p style="font-size: 14px; margin: 18px 0 0 0; color: #334155;">
          Talk soon,<br>
          <strong>Sarah</strong>
        </p>
      </div>
    `
  },
  'demo-3': {
    isPlainText: false,
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; padding: 16px 0;">
        <p style="font-size: 14px; margin: 0 0 14px 0;">
          Hi Alex,
        </p>
        <p style="font-size: 14px; margin: 0 0 14px 0;">
          Quick question &mdash; do you still have my bicycle rack in your basement, or did Thomas borrow it for his camping trip?
        </p>
        <p style="font-size: 14px; margin: 0 0 14px 0;">
          Also, if you're taking the regional train on Sunday, let me know which arrival time and I'll pick you up from the station so you don't have to walk in the heat.
        </p>
        <p style="font-size: 14px; margin: 16px 0 0 0; color: #334155;">
          Best,<br>
          <strong>Dad</strong>
        </p>
      </div>
    `
  },
  'demo-4': {
    isPlainText: false,
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; padding: 16px 0;">
        <p style="font-size: 14px; margin: 0 0 14px 0;">
          Hey everyone,
        </p>
        <p style="font-size: 14px; margin: 0 0 14px 0;">
          Please remember to keep this thread quiet around Grandma! 🤫
        </p>
        <p style="font-size: 14px; margin: 0 0 14px 0;">
          We booked the covered terrace at the lake restaurant for Saturday the 24th at 5:00 PM. Sarah is putting together the photo book from the past decade. If you have any scanned pictures of Grandma, please send them over by next Tuesday.
        </p>
        <p style="font-size: 14px; margin: 0 0 14px 0;">
          Looking forward to seeing everyone!
        </p>
        <p style="font-size: 14px; margin: 16px 0 0 0; color: #334155;">
          Best,<br>
          <strong>Thomas</strong>
        </p>
      </div>
    `
  },
  'demo-5': {
    isPlainText: false,
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 580px; margin: 0 auto; padding: 16px 0;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="display: inline-block; width: 10px; height: 10px; background: #22c55e; border-radius: 50%;"></span>
            <strong style="font-size: 15px; color: #0f172a;">Deployment Successful</strong>
          </div>
          <p style="margin: 0; font-size: 13px; color: #475569;">
            Your GitHub Pages site is live and secure over HTTPS.
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 130px;">Repository:</td>
            <td style="padding: 6px 0; font-weight: 500; color: #0f172a;">AlexanderMelde/CheckFastmail</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Custom Domain:</td>
            <td style="padding: 6px 0; font-weight: 500;"><a href="https://check-fastmail.melde.net/" style="color: #6366f1; text-decoration: none;">check-fastmail.melde.net</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Quality Gates:</td>
            <td style="padding: 6px 0; color: #16a34a; font-weight: 600;">123 tests passed (0 errors, 0 warnings)</td>
          </tr>
        </table>

        <a href="https://check-fastmail.melde.net/" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500;">
          Visit Website &rarr;
        </a>
      </div>
    `
  },
  'demo-6': {
    isPlainText: true,
    body: "Hey Alex,\n\nPre-sale for the open-air festival starts tomorrow morning at 10:00 AM!\n\nTickets are €45 and include the train pass. Let me know if you want to join and I'll buy two tickets together so we get spots in the same section.\n\nCheers,\nJulian"
  },
  'demo-7': {
    isPlainText: false,
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; padding: 16px 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #0f172a;">Welcome to Fastmail API</h3>
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #475569;">
          Your personal API token for Checker for Fastmail is now active. Fastmail supports the open JMAP protocol (RFC 8620 / RFC 8621) with CORS support.
        </p>
        <p style="margin: 0; font-size: 13px; color: #475569;">
          You can revoke or manage your tokens at any time under Fastmail Settings &gt; Password &amp; Security.
        </p>
      </div>
    `
  }
};

export function getDemoEmailBody(id: string): { body: string; isPlainText: boolean } | null {
  if (id in DEMO_BODIES) {
    return DEMO_BODIES[id];
  }
  return null;
}
