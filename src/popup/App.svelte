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

  function handleMarkRead(email: any, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    // Optimistic UI update
    unreadEmails = unreadEmails.filter(e => e.id !== email.id);
    
    chrome.runtime.sendMessage({ type: 'MARK_READ', emailId: email.id });
  }

  function handleArchive(email: any, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    // Optimistic UI update
    unreadEmails = unreadEmails.filter(e => e.id !== email.id);
    
    chrome.runtime.sendMessage({ type: 'ARCHIVE', emailId: email.id });
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
        {#each unreadEmails as email (email.id)}
          <li class="group relative border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
            <a href={`https://www.fastmail.com/mail/thread/${email.threadId}`} target="_blank" rel="noopener noreferrer" class="block py-3 pr-16">
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
            
            <!-- Quick Actions Toolbar -->
            <div class="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 bg-slate-50 p-1 rounded shadow-sm border border-slate-200">
              <button 
                onclick={(e) => handleMarkRead(email, e)} 
                class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded" 
                title="Mark as Read"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button 
                onclick={(e) => handleArchive(email, e)} 
                class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded" 
                title="Archive"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</main>

