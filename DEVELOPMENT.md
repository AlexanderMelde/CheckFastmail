# Development & Security Guidelines

This document outlines the architectural philosophy, coding standards, and security invariants for **Checker for Fastmail**.

---

## 1. Philosophy: The Lazy Senior Developer

> *Lazy means efficient, not careless. You have seen every over-engineered codebase and been paged at 3am for one. The best code is the code never written.*

- **Deletion over addition.**
- **Boring over clever.** Clever is what someone has to decode at 3am.
- **Shortest working diff wins** — but only once the real problem is understood.
- **Fewest files possible.** Don't scatter logic across trivial single-line files.
- **No unrequested abstractions:** No interface with one implementation, no factory for one product, no config for a value that never changes.
- **No scaffolding "for later":** Later can scaffold for itself.

---

## 2. The Ladder

When writing or changing code, **stop at the first rung that holds**:

1. **Does this need to exist at all?** Speculative need = skip it (YAGNI).
2. **Already in this codebase?** Reuse existing helpers, types, or patterns. Re-implementing existing code is the most common slop.
3. **Stdlib does it?** Use the runtime or language built-in.
4. **Native platform feature covers it?** CSS over JS, native HTML elements over custom libraries.
5. **Already-installed dependency solves it?** Use it. Never introduce a new package for what a few lines of code can do.
6. **Can it be one line?** Make it one line.
7. **Only then:** Write the minimum code that works.

---

## 3. Bug Fixing: Root Cause, Not Symptoms

- A bug report names a symptom, not the root cause.
- **Before editing:** Grep every caller of the function you are about to touch.
- **The lazy fix IS the root-cause fix:** One guard or listener in the shared core is a smaller diff than patching every caller — and fixing only the symptom leaves sibling paths broken.
- **Example in this codebase:** Session and alarm lifecycle cleanup is handled via a single `chrome.storage.onChanged` listener in the background worker. Options disconnect, 401 token revocation, and badge resets all route through this single source of truth.

---

## 4. Secure Development Standards

### A. Minimal Privileges (Manifest V3)
- Request only strictly necessary permissions:
  - `storage`: Store Fastmail API token and cached session endpoints locally.
  - `alarms`: Periodic background polling (minimum 5-minute interval).
  - `host_permissions`: Strictly limited to `https://api.fastmail.com/*`.
- Never request broad web access (`<all_urls>`) or unnecessary intrusive permissions (`tabs`, `cookies`, `webRequest`).

### B. Secret & Token Management
- **Local Storage Only:** Fastmail API tokens must be saved exclusively in `chrome.storage.local`. Never use `chrome.storage.sync` (which transmits credentials across Google accounts).
- **Zero Third-Party Transmission:** Tokens and email data are transmitted solely to `https://api.fastmail.com/`. Zero telemetry, zero analytics, zero external logging.
- **Immediate Invalidation:** Any `401 Unauthorized` response immediately invokes `clearSession()`, removing tokens and cached endpoints from storage and resetting extension badges.

### C. Email Body Rendering & Sandbox Isolation
- **Strict Iframe Sandbox:** All email bodies must render in a sandboxed iframe with:
  ```html
  sandbox="allow-popups allow-popups-to-escape-sandbox"
  ```
  - **No `allow-scripts`:** Prevents JavaScript execution inside untrusted email bodies.
  - **No `allow-same-origin`:** Prevents sandboxed content from accessing extension storage, cookies, or Chrome APIs.
- **Content Security Policy (CSP):** Every rendered email preview must enforce:
  ```html
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline';">
  ```
- **Link Isolation:** Inject `<base target="_blank">` before rendering any email HTML. This ensures clicking any link inside an email opens safely in an external browser tab rather than navigating or hijacking the preview frame.
- **Metadata Escaping:** All dynamic values (subject, sender names, emails, dates) must be passed through `escapeHtml()` before insertion into HTML structures.

### D. JMAP Protocol Compliance (RFC 8620 / RFC 8621)
- **Single-Flight Requests:** Group related operations using RFC 8620 §3.7 back-references (`#ids`) to fetch unread IDs and message details in a single HTTP POST round-trip.
- **Explicit Error Boundaries:** Never swallow fetch errors into empty arrays. Differentiate:
  - `notAuthenticated` (HTTP 401)
  - `error: 'Server error (5xx)'` (HTTP failures)
  - `error: 'JMAP error: ...'` (Method-level protocol errors)
  - `error: 'Network error'` (Offline / connectivity dropouts)
  - True Inbox Zero (empty successful response)

---

## 5. Testing & Code Quality

- **Zero Heavy Test Dependencies:** Use existing Vitest runners and standard mocks. Do not pull in heavyweight browser automation when clean unit and contract tests suffice.
- **Pre-Commit Verification:**
  - `npm test`: All unit, security, and JMAP spec tests must pass.
  - `npm run check`: Svelte and TypeScript checks must report 0 errors and 0 warnings.
  - `npm run build`: Production bundle must compile cleanly.
