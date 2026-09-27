# Checker for Fastmail

A lightning-fast, lightweight Chrome Extension for Fastmail users. Check and preview unread Fastmail emails directly from your browser toolbar via a secure two-pane layout without opening a new tab.

Built with **Svelte 5**, **Vite**, and **TypeScript**, running on Chrome Manifest V3 (MV3). It uses Fastmail's standard **JMAP API** (RFC 8620 / RFC 8621) and securely stores a Fastmail API Token locally in the browser.

## Features

- **Two-Pane Layout:** View unread emails in a sidebar and preview full email content in a sandboxed viewport.
- **Unified Scrolling:** Email headers and bodies scroll naturally together inside the sandboxed view.
- **Hardened Security:** Email bodies run with strict sandboxing (`sandbox="allow-popups allow-popups-to-escape-sandbox"`), with `allow-scripts` and `allow-same-origin` omitted. A strict Content Security Policy (`default-src 'none'; img-src https: data:; style-src 'unsafe-inline';`) prevents malicious script execution.
- **Smart Background Polling:** A background Service Worker polls Fastmail every 5 minutes to keep the toolbar unread badge updated.
- **Privacy First:** 0% external data collection. Direct communication strictly between your browser and Fastmail (`api.fastmail.com`).

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
