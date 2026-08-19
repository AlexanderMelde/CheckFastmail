// src/background/auth.ts

const CLIENT_ID = 'PLACEHOLDER_CLIENT_ID'; // Replaced once Extension ID is known
const AUTH_URL = 'https://api.fastmail.com/oauth/authorize';
const TOKEN_URL = 'https://api.fastmail.com/oauth/refresh';

// Generate a random string for code verifier
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (dec) => ('0' + dec.toString(16)).substr(-2)).join('').substring(0, length);
}

// Generate code challenge from verifier
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function initiateLogin(): Promise<boolean> {
  try {
    const redirectUrl = chrome.identity.getRedirectURL();
    console.log('Redirect URL for Fastmail registration:', redirectUrl);

    const verifier = generateRandomString(64);
    const challenge = await generateCodeChallenge(verifier);
    const state = generateRandomString(16);

    const authParams = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: redirectUrl,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state: state
    });

    const url = `${AUTH_URL}?${authParams.toString()}`;

    return new Promise((resolve) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: url,
          interactive: true
        },
        async (callbackUrl) => {
          if (chrome.runtime.lastError || !callbackUrl) {
            console.error('Auth flow failed:', chrome.runtime.lastError);
            resolve(false);
            return;
          }

          const urlObj = new URL(callbackUrl);
          const code = urlObj.searchParams.get('code');
          const returnedState = urlObj.searchParams.get('state');

          if (!code || returnedState !== state) {
            console.error('Invalid auth callback');
            resolve(false);
            return;
          }

          // Exchange code for token
          const success = await exchangeCodeForToken(code, verifier, redirectUrl);
          resolve(success);
        }
      );
    });
  } catch (err) {
    console.error('Login error:', err);
    return false;
  }
}

async function exchangeCodeForToken(code: string, verifier: string, redirectUrl: string): Promise<boolean> {
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code: code,
      redirect_uri: redirectUrl,
      code_verifier: verifier
    });

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      console.error('Token exchange failed:', await response.text());
      return false;
    }

    const data = await response.json();
    
    await chrome.storage.local.set({
      access_token: data.access_token,
      refresh_token: data.refresh_token
    });

    return true;
  } catch (err) {
    console.error('Token exchange error:', err);
    return false;
  }
}

export async function refreshToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(['refresh_token']);
  const refreshToken = result.refresh_token;

  if (!refreshToken) return null;

  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      refresh_token: refreshToken
    });

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      // Refresh failed, clear tokens
      await chrome.storage.local.remove(['access_token', 'refresh_token']);
      return null;
    }

    const data = await response.json();
    await chrome.storage.local.set({
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken
    });

    return data.access_token;
  } catch (err) {
    console.error('Refresh token error:', err);
    return null;
  }
}
