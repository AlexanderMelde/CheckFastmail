import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Manifest V3 Compliance & Least Privilege Invariants', () => {
  const manifestPath = path.resolve(__dirname, '../manifest.json');
  const manifestRaw = fs.readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(manifestRaw);

  it('declares manifest_version 3', () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it('restricts permissions strictly to minimal necessary scopes', () => {
    const allowedPermissions = ['storage', 'alarms', 'contextMenus'];
    expect(manifest.permissions).toEqual(expect.arrayContaining(allowedPermissions));
    expect(manifest.permissions).toHaveLength(allowedPermissions.length);

    // Strictly forbidden broad scopes per DEVELOPMENT.md §2
    const forbiddenPermissions = ['<all_urls>', 'tabs', 'cookies', 'webRequest', 'webRequestBlocking', 'identity'];
    for (const forbidden of forbiddenPermissions) {
      expect(manifest.permissions).not.toContain(forbidden);
    }
  });

  it('intentionally omits host_permissions to eliminate install permission warnings (RFC 8620 CORS)', () => {
    // Omitting host_permissions relies on Fastmail's open CORS headers (RFC 8620 §2.1)
    // while presenting a completely clean, permission-warning-free install prompt.
    expect(manifest.host_permissions).toBeUndefined();
  });

  it('references existing icon files for all declared sizes', () => {
    expect(manifest.icons).toBeDefined();
    for (const size of ['16', '48', '128']) {
      const iconRelPath = manifest.icons[size];
      expect(iconRelPath).toBeDefined();
      const publicIconPath = path.resolve(__dirname, '../public', iconRelPath);
      expect(fs.existsSync(publicIconPath), `Missing icon file: ${publicIconPath}`).toBe(true);
    }
  });

  it('references valid entry points for popup and options UI', () => {
    expect(manifest.action?.default_popup).toBe('src/popup/index.html');
    const popupPath = path.resolve(__dirname, '..', manifest.action.default_popup);
    expect(fs.existsSync(popupPath), `Missing popup entry: ${popupPath}`).toBe(true);

    expect(manifest.options_ui?.page).toBe('src/options/index.html');
    const optionsPath = path.resolve(__dirname, '..', manifest.options_ui.page);
    expect(fs.existsSync(optionsPath), `Missing options entry: ${optionsPath}`).toBe(true);

    expect(manifest.background?.service_worker).toBe('src/background/index.ts');
    const bgPath = path.resolve(__dirname, '..', manifest.background.service_worker);
    expect(fs.existsSync(bgPath), `Missing background worker: ${bgPath}`).toBe(true);
  });
});
