# Development & Security Guidelines

Core architecture, coding standards, and security invariants for **Checker for Fastmail**.

---

## 1. Philosophy: The Ladder

Stop at the first rung that holds:
1. **Does this need to exist?** Speculative need = skip it (YAGNI).
2. **Already in codebase?** Reuse existing helpers, types, and patterns.
3. **Stdlib/platform does it?** CSS over JS, native elements over custom components.
4. **Already-installed dependency?** Use it. Never add new packages for simple tasks.
5. **Shortest working diff wins.** Deletion over addition. Root-cause fixes over symptom patching.

---

## 2. Security & Lifecycle Invariants

- **Minimal Privileges (MV3):** Strictly `storage`, `alarms`, `contextMenus`, and host permission `https://api.fastmail.com/*`. Never request broad scopes (`<all_urls>`, `tabs`, `cookies`).
- **Token Isolation:** Tokens stored exclusively in `chrome.storage.local` (never `sync`). Verified in-memory via JMAP session endpoint before saving. Wiped immediately on `401 Unauthorized` or disconnect via `clearSession()`.
- **Iframe Sandbox & CSP:** Email bodies render in `<iframe sandbox="allow-popups allow-popups-to-escape-sandbox">`. Never permit `allow-scripts` or `allow-same-origin`. Enforce `default-src 'none'; img-src https: data:; style-src 'unsafe-inline';`. Inject `<base target="_blank">` to isolate link clicks.
- **Escape Metadata:** Always pass dynamic header fields (`subject`, `from`, `to`, `date`) through `escapeHtml()`. Avoid string replacement tokens (`$&`, `$'`) by using function replacers in `String.prototype.replace`.

---

## 3. JMAP Compliance (RFC 8620 / 8621)

- **Headers:** All session discovery and API requests must include `Accept: application/json`.
- **Single Round-Trip:** Batch `Email/query` and `Email/get` in a single POST via `#ids` back-references.
- **Multi-Part Concatenation:** Concatenate `htmlBody`/`textBody` parts in sequence per RFC 8621 §4.1.4. Fall back to plain-text `preview` if no body parts exist.
- **Error Boundaries:** Differentiate `notAuthenticated` (401), HTTP 5xx, and JMAP method errors (`resp.description`). Never wipe unread badge count on transient network dropouts.

---

## 4. Coding Standards

- **Zero Magic Numbers:** Extract intervals, limits, status codes, and timeouts into descriptive module constants with explicit units.
- **Mandatory Regression Tests:** Every bug fix, security patch, or edge-case remediation must include an accompanying Vitest unit test asserting the failure mode cannot regress.
- **Pre-Commit Verification:** Run `npm test` (all tests pass), `npm run check` (0 errors, 0 warnings), and `npm run build`.
