# Security Policy

Security and data privacy are core pillars of **Checker for Fastmail**. We prioritize secure credential storage, strict iframe sandboxing, and minimal permissions.

---

## Supported Versions

Only the latest released version of Checker for Fastmail receives security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

---

## Security Invariants

The codebase enforces strict security invariants (detailed in [DEVELOPMENT.md](DEVELOPMENT.md)):
- **Zero Host Permissions:** Uses Fastmail's open CORS JMAP API without broad `<all_urls>` or domain-level host permissions.
- **Token Isolation:** Fastmail API tokens are stored strictly in `chrome.storage.local` (never synchronized across devices via cloud accounts).
- **Iframe Sandboxing:** Email bodies render within an isolated `<iframe sandbox="allow-popups allow-popups-to-escape-sandbox">` with `default-src 'none'; img-src https: data:; style-src 'unsafe-inline';` and no script execution.
- **HTML Escaping:** All message header metadata (subject, sender, date) is sanitized before DOM injection.

---

## Reporting a Vulnerability

If you discover a potential security vulnerability in this project, **please do not report it in a public GitHub issue.**

Instead, please report security concerns privately using one of the following methods:

1. **Email:** Send a detailed report to **[check-fastmail@melde.net](mailto:check-fastmail@melde.net)**.
2. **GitHub Security Advisory:** Submit a private advisory via GitHub's **Security** tab under **Report a vulnerability**.

### What to Include in Your Report
- A description of the vulnerability and its potential impact.
- Step-by-step instructions or proof-of-concept (PoC) to reproduce the issue.
- Details about your environment (browser version, OS, extension version).

### What to Expect
- Reports will be reviewed and investigated on a best-effort basis as time permits.
- Once a fix is verified, an updated release will be published and you will be credited (unless you prefer anonymity).
