<script lang="ts">
  import { onMount } from 'svelte';
  
  let unreadEmails = $state<any[]>([]);
  let isLoading = $state(true);
  let errorMsg = $state('');

  function fetchEmails() {
    isLoading = true;
    errorMsg = '';
    chrome.runtime.sendMessage({ type: 'FETCH_UNREAD' }, (response) => {
      if (chrome.runtime.lastError) {
        errorMsg = 'Error communicating with background script.';
        isLoading = false;
        return;
      }
      
      if (response && response.emails) {
        unreadEmails = response.emails;
      } else {
        errorMsg = 'Failed to fetch emails. Please check your connection in Options.';
      }
      isLoading = false;
    });
  }

  onMount(() => {
    fetchEmails();
  });

  function handleRefresh() {
    fetchEmails();
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

<main class="flex flex-col bg-white h-[400px]">
  <header class="flex justify-between items-center bg-blue-600 text-white p-4 shrink-0">
    <h1 class="text-lg font-semibold">Fastmail</h1>
    <button onclick={handleRefresh} class="p-2 bg-blue-700 hover:bg-blue-800 rounded transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white" aria-label="Refresh">
      Refresh Now
    </button>
  </header>
  
  <div class="flex-1 overflow-y-auto p-4">
    {#if isLoading}
      <div class="animate-pulse space-y-4">
        {#each Array(3) as _}
          <div class="border-b border-slate-100 pb-3">
            <div class="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
            <div class="h-3 bg-slate-200 rounded w-2/3"></div>
          </div>
        {/each}
      </div>
    {:else if errorMsg}
      <div class="text-center text-red-500 mt-8 text-sm">
        {errorMsg}
      </div>
    {:else if unreadEmails.length === 0}
      <div class="text-center text-slate-500 mt-8">
        No unread messages.
      </div>
    {:else}
      <ul class="space-y-0">
        {#each unreadEmails as email}
          <li class="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
            <a href={`https://www.fastmail.com/mail/thread/${email.threadId}`} target="_blank" rel="noopener noreferrer" class="block py-3">
              <div class="flex justify-between items-baseline mb-1">
                <span class="font-semibold text-slate-800 text-sm truncate pr-2">
                  {email.from?.[0]?.name || email.from?.[0]?.email || 'Unknown Sender'}
                </span>
                <span class="text-xs text-slate-500 shrink-0">
                  {formatTime(email.receivedAt)}
                </span>
              </div>
              <div class="text-sm text-slate-600 truncate font-medium">
                {email.subject || '(No Subject)'}
              </div>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</main>

