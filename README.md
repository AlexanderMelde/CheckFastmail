# Fastmail Checker Extension

A lightning-fast, lightweight Chrome Extension for Fastmail power users. This extension allows you to check your unread Fastmail emails directly from your browser toolbar without opening a new tab.

Built with **Svelte**, **Vite**, and **Tailwind CSS**, utilizing Manifest V3 (MV3). It uses Fastmail's modern **JMAP API** for blazing-fast synchronization and OAuth 2.0 PKCE for secure, zero-middleman authentication.

## Project Structure

- `src/background/`: Contains the Service Worker which runs in the background. It polls the JMAP API every 5 minutes and handles the OAuth 2.0 PKCE login flow.
- `src/popup/`: The Svelte app that renders when you click the extension icon in your toolbar. It queries the background script for your unread emails.
- `src/options/`: The Svelte app for the extension's settings page, allowing you to securely connect or disconnect your Fastmail account.
- `src/styles/`: Global Tailwind CSS configurations mimicking Fastmail's clean aesthetic.

## Local Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite development server (with Hot Module Reloading for extensions via `@crxjs/vite-plugin`):
   ```bash
   npm run dev
   ```
3. Open Chrome and navigate to `chrome://extensions/`.
4. Enable **Developer mode** in the top right corner.
5. Click **Load unpacked** and select the `dist/` directory in this project.

## How to Bundle for Production

When you are ready to bundle the extension for the Chrome Web Store:

1. Run the build command:
   ```bash
   npm run build
   ```
2. This will compile and minify all Svelte, TypeScript, and CSS assets and output them to the `dist/` folder.
3. Zip the contents of the `dist/` folder.
4. Upload the resulting `.zip` file to the Chrome Developer Dashboard.

## What's Left to Do (V2 Roadmap)

This repository currently contains the MVP. The following items remain to be implemented or finalized:

- [ ] **Real OAuth Client ID**: The extension currently uses a `PLACEHOLDER_CLIENT_ID` in `src/background/auth.ts`. You must register your Chrome Extension ID's redirect URL (`https://<extension-id>.chromiumapp.org/`) with Fastmail Support to receive a real Client ID, then update the code.
- [ ] **Agenda Tab**: The initial specification included an Agenda view for upcoming calendar events. This was deferred for MVP and needs to be built using the `urn:ietf:params:jmap:calendars` JMAP scope.
- [ ] **Quick Actions**: Add hover toolbars in the popup UI to allow users to quickly "Mark as Read" or "Archive" an email directly via the extension (using the `Email/set` JMAP method).
- [ ] **Store Assets & Privacy Policy**: Design 16x16, 48x48, and 128x128 icons for the extension. Draft a strict Privacy Policy asserting 0% data collection (required by Chrome).
- [ ] **Offline & Error States**: Polish the UI for scenarios where the user's internet drops or the Fastmail API is unreachable.
