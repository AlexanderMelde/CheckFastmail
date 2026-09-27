import type { EmailItem } from '../types';

const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const fullDateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function formatTime(dateString: string): string {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';

  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  return isToday ? timeFormatter.format(d) : dateFormatter.format(d);
}

export function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name.trim().substring(0, 2) || '?').toUpperCase();
}

export function escapeHtml(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildIframeContent(email: EmailItem, bodyContent: string, isPlainText = false): string {
  const subject = email.subject || '(No Subject)';
  const fromNameOnly = email.from?.[0]?.name || email.from?.[0]?.email || 'Unknown';
  const fromEmailOnly = email.from?.[0]?.name && email.from?.[0]?.email ? `<${email.from[0].email}>` : '';
  const toNameOnly = email.to?.[0]?.name || email.to?.[0]?.email || 'you';
  const initials = getInitials(email.from?.[0]?.name || email.from?.[0]?.email);

  const receivedDate = new Date(email.receivedAt);
  const dateFormatted = !isNaN(receivedDate.getTime())
    ? fullDateTimeFormatter.format(receivedDate)
    : '';

  const openUrl = 'https://www.fastmail.com/mail/Message/' + encodeURIComponent(email.id);

  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline';">`;

  const headerHtml = `
    <style>
      .ext-open-btn {
        all: initial !important; box-sizing: border-box !important; position: absolute !important; top: 9px !important; right: 18px !important; display: inline-flex !important; padding: 6px !important; background: transparent !important; color: #47515a !important; border-radius: 6px !important; text-decoration: none !important; cursor: pointer !important; transition: all 0.15s ease !important; height: 28px !important; width: 28px !important; align-items: center !important; justify-content: center !important; margin: 0 !important;
      }
      .ext-open-btn:hover {
        background: rgba(51, 62, 72, .05) !important; color: #2d3236 !important;
      }
      .ext-open-btn:active {
        background: rgba(51, 62, 72, .1) !important;
      }
      .ext-open-btn svg {
        width: 17px !important; height: 17px !important; display: block !important; margin: 0 !important; padding: 0 !important;
      }
      
      ::-webkit-scrollbar {
        width: 6px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background-color: #cbd5e1;
        border-radius: 10px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background-color: #94a3b8;
      }
    </style>
    <div style="all: initial !important; display: block !important; box-sizing: border-box !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; padding: 9px 18px !important; border-bottom: 1px solid #e2e8f0 !important; background: #fff !important; position: relative !important; margin: 0 !important;">
      <a href="${escapeHtml(openUrl)}" target="_blank" rel="noopener noreferrer" title="Open in Fastmail" class="ext-open-btn">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
      </a>
      <h2 style="all: initial !important; display: block !important; box-sizing: border-box !important; color: #1e293b !important; margin: 0 0 12px 0 !important; padding: 0 40px 0 0 !important; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif !important; font-size: 17px !important; font-weight: 700 !important; line-height: 24px !important; text-align: left !important;">
        ${escapeHtml(subject)}
      </h2>
      <div style="all: initial !important; display: flex !important; box-sizing: border-box !important; align-items: center !important; gap: 16px !important; font-family: inherit !important; margin: 0 !important; padding: 0 !important; flex-direction: row !important;">
        <div style="all: initial !important; display: flex !important; box-sizing: border-box !important; width: 40px !important; height: 40px !important; border-radius: 50% !important; background: linear-gradient(to top right, #7c33e8, #ab65ff) !important; color: #fff !important; align-items: center !important; justify-content: center !important; font-size: 15px !important; font-weight: 500 !important; letter-spacing: 0.5px !important; box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important; font-family: inherit !important; flex-shrink: 0 !important; margin: 0 !important; padding: 0 !important;">
          ${escapeHtml(initials)}
        </div>
        <div style="all: initial !important; display: flex !important; box-sizing: border-box !important; flex-direction: column !important; min-width: 0 !important; font-family: inherit !important; margin: 0 !important; padding: 0 !important; justify-content: center !important; width: 100% !important;">
          <div style="all: initial !important; display: flex !important; box-sizing: border-box !important; align-items: center !important; font-family: inherit !important; margin: 0 !important; padding: 0 !important; width: 100% !important; gap: 6px !important;">
            <span style="all: initial !important; font-family: inherit !important; font-size: 14px !important; font-weight: 600 !important; color: #1e293b !important; height: 20px !important; line-height: 20px !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; flex-shrink: 0 !important;">
              ${escapeHtml(fromNameOnly)}
            </span>
            ${
              fromEmailOnly
                ? `<span title="${escapeHtml(email.from?.[0]?.email)}" style="all: initial !important; font-family: inherit !important; font-size: 14px !important; color: #94a3b8 !important; height: 20px !important; line-height: 20px !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; flex-shrink: 1 !important;">${escapeHtml(fromEmailOnly)}</span>`
                : ''
            }
            <span style="all: initial !important; font-family: inherit !important; font-size: 14px !important; color: #1e293b !important; height: 20px !important; line-height: 20px !important; white-space: nowrap !important; flex-shrink: 0 !important;">
              ${escapeHtml(dateFormatted)}
            </span>
          </div>
          <div style="all: initial !important; display: flex !important; box-sizing: border-box !important; font-family: inherit !important; margin: 0 !important; padding: 0 !important; gap: 6px !important;">
            <span style="all: initial !important; font-family: inherit !important; font-size: 13px !important; color: #64748b !important; height: 20px !important; line-height: 20px !important; white-space: nowrap !important;">
              to ${escapeHtml(toNameOnly)}
            </span>
          </div>
        </div>
      </div>
    </div>
  `;

  const trackerFixStyle = `<style>img[width="1"][height="1"], img[width="0"][height="0"] { display: none !important; position: absolute !important; }</style>`;

  let renderedBody = bodyContent;
  if (isPlainText) {
    renderedBody = `<pre style="white-space: pre-wrap; word-break: break-word; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; padding: 18px; margin: 0; color: #1e293b;">${escapeHtml(bodyContent)}</pre>`;
  }

  const bodyTagMatch = renderedBody.match(/<body[^>]*>/i);
  if (bodyTagMatch) {
    return cspMeta + renderedBody.replace(bodyTagMatch[0], bodyTagMatch[0] + trackerFixStyle + headerHtml);
  } else {
    return cspMeta + trackerFixStyle + headerHtml + renderedBody;
  }
}
