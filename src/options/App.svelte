<script lang="ts">
  import { onMount } from 'svelte';
  
  let isConnected = $state(false);

  function handleConnect() {
    // Call background script to initiate OAuth
    chrome.runtime.sendMessage({ type: 'INITIATE_LOGIN' }, (response) => {
      if (response && response.success) {
        isConnected = true;
      }
    });
  }

  function handleDisconnect() {
    chrome.storage.local.remove(['access_token', 'refresh_token', 'account_id', 'api_url'], () => {
      isConnected = false;
    });
  }

  onMount(() => {
    chrome.storage.local.get(['access_token'], (result) => {
      if (result.access_token) {
        isConnected = true;
      }
    });
  });
</script>

<main class="max-w-xl mx-auto p-8 mt-12 bg-white rounded-lg shadow-sm border border-slate-200">
  <h1 class="text-2xl font-semibold mb-6 text-slate-800">Fastmail Checker Options</h1>
  
  <div class="mb-8 p-6 rounded-lg {isConnected ? 'bg-green-50 border-green-200 border' : 'bg-slate-50 border-slate-200 border'}">
    <h2 class="text-lg font-medium mb-2">Connection Status</h2>
    <div class="flex items-center space-x-2">
      <div class="w-3 h-3 rounded-full {isConnected ? 'bg-green-500' : 'bg-slate-400'}"></div>
      <span class="text-slate-700">{isConnected ? 'Connected to Fastmail' : 'Not Connected'}</span>
    </div>
  </div>

  <div class="flex space-x-4">
    {#if !isConnected}
      <button onclick={handleConnect} class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium">
        Connect to Fastmail
      </button>
    {:else}
      <button onclick={handleDisconnect} class="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium">
        Disconnect
      </button>
    {/if}
  </div>
  
  <div class="mt-12 text-sm text-slate-500">
    <p>We use OAuth 2.0 to securely connect. No data is stored outside of your browser.</p>
  </div>
</main>
