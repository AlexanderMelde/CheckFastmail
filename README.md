# Checker for Fastmail

A lightning-fast, lightweight Chrome Extension for Fastmail power users. This extension allows you to check your unread Fastmail emails directly from your browser toolbar, featuring a two-pane layout to preview your emails without opening a new tab.

Built with **Svelte**, **Vite**, and **Tailwind CSS**, utilizing Manifest V3 (MV3). It uses Fastmail's modern **JMAP API** for blazing-fast synchronization and securely stores a Fastmail API Token locally for authentication.

## Features

- **Two-Pane Layout:** View your unread inbox on the left, and securely preview full email content on the right (rendered in a sandboxed iframe).
- **Quick Actions:** Instantly mark emails as read or archive them right from the extension. UI updates immediately (optimistic rendering) while JMAP syncs in the background.
- **Smart Polling:** A background Service Worker seamlessly polls Fastmail every 5 minutes to keep your extension badge updated.
- **Privacy First:** 0% external data collection. Everything stays strictly between your browser and Fastmail.

## Project Structure

- `src/background/`: Contains the Service Worker which runs in the background. It handles JMAP API requests, token validation, and background polling via `chrome.alarms`.
- `src/popup/`: The Svelte app that renders when you click the extension icon. Contains the two-pane interface for reading and managing unread emails.
- `src/options/`: The Svelte app for the settings page, where you securely save your Fastmail API token.
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

## Authentication Note

Per Fastmail's developer guidance, the extension currently authenticates using a standard **Personal API Token** (generated from Fastmail's Security Settings). OAuth 2.0 implementation is deferred until the extension is ready for mass distribution in the Chrome Web Store, at which point Fastmail will whitelist a formal OAuth Client ID.

## How to Bundle for Production

When you are ready to bundle the extension for the Chrome Web Store:

1. Run the build command:
   ```bash
   npm run build
   ```
2. This will compile and minify all Svelte, TypeScript, and CSS assets and output them to the `dist/` folder.
3. Zip the contents of the `dist/` folder.
4. Upload the resulting `.zip` file to the Chrome Developer Dashboard.

## What's Left to Do

The MVP features (UI, Quick Actions, Authentication, Assets, Privacy Policy) have been successfully completed. 

- [ ] **Agenda Tab**: The initial specification included an Agenda view for upcoming calendar events. This has been deferred until Fastmail finalizes their JMAP calendar specification. Once standard `urn:ietf:params:jmap:calendars` access is opened, this feature can be safely built out.
- [ ] **OAuth Migration**: Once ready for a larger user base, swap the API Token UI back to a formal PKCE OAuth flow (requires Fastmail Support to whitelist the Extension ID).
