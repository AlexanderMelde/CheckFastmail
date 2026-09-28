# Contributing to Checker for Fastmail

Thank you for your interest in contributing to **Checker for Fastmail**! We welcome community contributions, bug reports, and suggestions.

---

## Core Philosophy

Before submitting new code, please review our engineering principles in [DEVELOPMENT.md](DEVELOPMENT.md). In short:

1. **Does this need to exist?** Avoid speculative complexity (YAGNI).
2. **Reuse existing patterns:** Leverage established helpers, types, and components.
3. **Security first:** Never violate the security invariants (minimal permissions, token isolation, iframe sandboxing).
4. **Shortest working diff wins:** Clean, focused additions with accompanying tests.

---

## Getting Started

1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/<your-username>/CheckFastmail.git
   cd CheckFastmail
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start local development:**
   - **Chrome Extension (with HMR):**
     ```bash
     npm run dev
     ```
     Load `dist/` as an unpacked extension in `chrome://extensions/` with Developer Mode enabled.
   - **Project Website:**
     ```bash
     npm run dev:site
     ```
     Access local preview at `http://localhost:5173/`.

---

## Pre-Commit Verification

Before submitting a pull request, ensure all quality gates pass locally:

```bash
# 1. Run unit and security test suites
npm test

# 2. Check TypeScript and Svelte diagnostics
npm run check

# 3. Build both targets
npm run build:all
```

---

## Pull Request Guidelines

1. **Create a topic branch:**
   ```bash
   git checkout -b feature/my-enhancement
   ```
2. **Include regression tests:**
   Every bug fix or feature addition must include accompanying Vitest unit tests asserting expected behavior.
3. **Commit clearly:**
   Use conventional, descriptive commit messages (e.g., `feat: ...`, `fix: ...`, `docs: ...`).
4. **Submit your PR:**
   Open a pull request against the `main` branch with a clear description of the problem solved and testing performed.

---

## Security Inquiries

If you find a security vulnerability, please do **not** open a public issue. Follow our [Security Policy](SECURITY.md) to report it privately.
