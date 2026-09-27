# Checker for Fastmail

A lightning-fast, lightweight Chrome Extension for Fastmail users. Check and preview unread Fastmail emails directly from your browser toolbar via a secure two-pane layout without opening a new tab.

Built with **Svelte 5**, **Vite**, and **TypeScript**, running on Chrome Manifest V3 (MV3). It uses Fastmail's standard **JMAP API** (RFC 8620 / RFC 8621) and securely stores a Fastmail API Token locally in the browser.

## Features

- **Blazing Fast & Lightweight:** Opens instantly with zero bloat, communicating directly with Fastmail for near-instant message loading.
- **Privacy & Security First:** No added third-party servers, tracking scripts or zero analytics. Emails render inside an isolated viewer.
- **Live Toolbar Badge:** Always know when you have incoming mail with an automatic, low-power unread badge right on your extension icon.
- **Clean, Distraction-Free UI:** A modern, uncluttered interface built to let you check and read unread messages quickly without losing your workflow.

## Project Structure

- `src/background/`: Service Worker handling JMAP queries, token validation, and background alarm polling.
- `src/popup/`: Svelte 5 application rendering the toolbar popup interface.
- `src/options/`: Svelte 5 application for managing the Fastmail API token connection.
- `src/types.ts`: Central TypeScript definitions and messaging contracts.
- `src/styles/`: Global styles.

## Local Development & Testing

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run automated tests:
   ```bash
   npm test
   ```

3. Type check:
   ```bash
   npm run check
   ```

4. Start Vite development server (with HMR via `@crxjs/vite-plugin`):
   ```bash
   npm run dev
   ```

5. Load in Chrome:
   - Navigate to `chrome://extensions/`.
   - Enable **Developer mode** (top right).
   - Click **Load unpacked** and select the `dist/` directory.

## Production Build

```bash
npm run build
```
Minifies and bundles all assets into `dist/`. Zip the `dist/` directory contents for Chrome Web Store submission.

## Security & Guidelines

See [DEVELOPMENT.md](DEVELOPMENT.md) for our development philosophy, "The Ladder", and Chrome Extension security standards.
