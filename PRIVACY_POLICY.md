# Privacy Policy for Fastmail Checker

**Last Updated:** August 2026

## Overview
Fastmail Checker ("the Extension") is an open-source Chrome Extension designed to provide quick access to your Fastmail unread emails. We take your privacy extremely seriously. 

Our core principle is simple: **Zero external data collection.**

## Data We Collect
**None.** The Extension does not collect, transmit, distribute, or sell your data to any third parties. We do not have backend servers, and we do not use analytics software.

## How Your Data is Handled
All data processing and authentication happens entirely locally within your browser.

- **Authentication:** The Extension uses OAuth 2.0 with PKCE to securely authenticate with Fastmail. The resulting access and refresh tokens are stored securely within your browser's local storage (`chrome.storage.local`). They are never synced to other devices or transmitted to any server other than Fastmail's official API (`api.fastmail.com`).
- **Emails:** Unread email data (Senders, Subjects, and Timestamps) fetched from Fastmail is stored temporarily in memory to display the extension popup. It is not permanently stored or logged anywhere.
- **Permissions:** 
  - `identity`: Used strictly to facilitate the OAuth 2.0 login flow with Fastmail.
  - `storage`: Used to securely save your Fastmail OAuth tokens locally on your machine.
  - `alarms`: Used to schedule background polling of the Fastmail API (every 5 minutes) to update your unread count badge.

## Changes to This Policy
If any changes are made to this privacy policy in the future, they will be reflected here and explicitly stated in the extension's release notes.

## Contact
If you have any questions or concerns regarding this privacy policy, please open an issue in the project's open-source repository.
