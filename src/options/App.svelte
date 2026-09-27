<script lang="ts">
  import { onMount } from 'svelte';
  import type { SaveTokenResponse } from '../types';
  
  let isConnected = $state(false);
  let apiToken = $state('');
  let isSaving = $state(false);
  let errorMsg = $state('');

  function handleSave() {
    if (!apiToken.trim()) {
      errorMsg = 'Please enter an API token';
      return;
    }
    
    isSaving = true;
    errorMsg = '';
    
    chrome.runtime.sendMessage({ type: 'TEST_AND_SAVE_TOKEN', token: apiToken.trim() }, (response: SaveTokenResponse) => {
      isSaving = false;
      if (response && response.success) {
        isConnected = true;
        apiToken = '';
      } else {
        errorMsg = 'Invalid token or connection failed. Please check your token and try again.';
      }
    });
  }

  function handleDisconnect() {
    chrome.storage.local.remove(['access_token', 'account_id', 'api_url', 'inbox_id'], () => {
      isConnected = false;
    });
  }

  onMount(() => {
    chrome.storage.local.get(['access_token'], (result) => {
      if (result.access_token) {
        isConnected = true;
      }
    });

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && 'access_token' in changes) {
        isConnected = Boolean(changes.access_token.newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  });
</script>

<main class="max-w-xl mx-auto p-8 mt-12 bg-white rounded-lg shadow-sm border border-slate-200">
  <h1 class="text-2xl font-semibold mb-6 text-slate-800">Checker for Fastmail Options</h1>
  
  <div class="mb-8 p-6 rounded-lg {isConnected ? 'bg-green-50 border-green-200 border' : 'bg-slate-50 border-slate-200 border'}">
    <h2 class="text-lg font-medium mb-2">Connection Status</h2>
    <div class="flex items-center space-x-2">
      <div class="w-3 h-3 rounded-full {isConnected ? 'bg-green-500' : 'bg-slate-400'}"></div>
      <span class="text-slate-700">{isConnected ? 'Connected to Fastmail' : 'Not Connected'}</span>
    </div>
  </div>

  {#if !isConnected}
    <div class="bg-blue-50 text-blue-800 p-4 rounded-lg mb-6 text-sm">
      <p class="mb-2 font-medium">To connect your account:</p>
      <ol class="list-decimal list-inside space-y-1">
        <li>Go to your Fastmail settings: <a href="https://www.fastmail.com/settings/security/tokens" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">Settings &gt; Security &gt; API Tokens</a></li>
        <li>Click <strong>New API Token</strong></li>
        <li>Give it a name (e.g. "Checker Extension") and ensure the <strong>JMAP</strong> protocol is selected.</li>
        <li>Select <strong>Read-only</strong> permissions for Mail.</li>
        <li>Copy the token and paste it below.</li>
      </ol>
    </div>

    <div class="flex flex-col space-y-3 mb-6">
      <label for="apiToken" class="font-medium text-slate-700">API Token</label>
      <input 
        type="password" 
        id="apiToken"
        bind:value={apiToken}
        placeholder="fm1-..." 
        class="border border-slate-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {#if errorMsg}
        <p class="text-red-600 text-sm">{errorMsg}</p>
      {/if}
      <button 
        onclick={handleSave} 
        disabled={isSaving}
        class="self-start px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 cursor-pointer"
      >
        {isSaving ? 'Connecting...' : 'Save & Connect'}
      </button>
    </div>
  {:else}
    <div class="flex space-x-4 mb-6">
      <button onclick={handleDisconnect} class="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium cursor-pointer">
        Disconnect
      </button>
    </div>
  {/if}
  
  <div class="pt-6 border-t border-slate-200 text-sm text-slate-500">
    <p>Your API token is securely stored locally in your browser and is never transmitted to any third party.</p>
  </div>
</main>
