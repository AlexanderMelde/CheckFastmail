<script lang="ts">
  import { onMount } from "svelte";

  let unreadEmails = $state<any[]>([]);
  let isLoading = $state(true);
  let errorMsg = $state("");
  let notAuthenticated = $state(false);

  let selectedEmail = $state<any>(null);
  let emailBody = $state<string | null>(null);
  let isLoadingBody = $state(false);

  function fetchEmails() {
    isLoading = true;
    errorMsg = "";
    notAuthenticated = false;

    const startTime = Date.now();
    const finishLoading = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        setTimeout(() => (isLoading = false), 500 - elapsed);
      } else {
        isLoading = false;
      }
    };

    chrome.runtime.sendMessage({ type: "FETCH_UNREAD" }, (response) => {
      if (chrome.runtime.lastError) {
        errorMsg = "Error communicating with background script.";
        finishLoading();
        return;
      }

      if (response && response.notAuthenticated) {
        notAuthenticated = true;
      } else if (response && response.emails) {
        unreadEmails = response.emails;
        if (selectedEmail && !unreadEmails.find((e) => e.id === selectedEmail.id)) {
          selectedEmail = null;
          emailBody = null;
        }
      } else {
        errorMsg = "Failed to fetch emails. Please check your connection in Options.";
      }
      finishLoading();
    });
  }

  onMount(() => {
    fetchEmails();
  });

  function handleRefresh() {
    fetchEmails();
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }

  function handleMarkRead(email: any, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    unreadEmails = unreadEmails.filter((e) => e.id !== email.id);
    if (selectedEmail && selectedEmail.id === email.id) {
      selectedEmail = null;
      emailBody = null;
    }

    chrome.runtime.sendMessage({ type: "MARK_READ", emailId: email.id });
  }

  function handleArchive(email: any, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    unreadEmails = unreadEmails.filter((e) => e.id !== email.id);
    if (selectedEmail && selectedEmail.id === email.id) {
      selectedEmail = null;
      emailBody = null;
    }

    chrome.runtime.sendMessage({ type: "ARCHIVE", emailId: email.id });
  }

  function selectEmail(email: any, event: MouseEvent) {
    event.preventDefault();
    selectedEmail = email;
    emailBody = null;
    isLoadingBody = true;

    chrome.runtime.sendMessage({ type: "FETCH_EMAIL_BODY", emailId: email.id }, (response) => {
      if (selectedEmail && selectedEmail.id === email.id) {
        isLoadingBody = false;
        if (response && response.body) {
          emailBody = response.body;
        } else {
          emailBody = "Could not load email content. It might be plain text or unsupported.";
        }
      }
    });
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function getInitials(name: string) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
</script>

<main class="flex flex-col bg-white h-[600px] w-full font-sans text-[14px]">
  <header class="flex justify-between items-center bg-[#8b45f3] text-white p-4 shrink-0 shadow-sm z-10 h-14">
    <div class="flex items-center gap-2">
      <h1 class="text-[16px] font-semibold tracking-wide">Checker for Fastmail</h1>
    </div>
    {#if !notAuthenticated}
      <button
        onclick={handleRefresh}
        disabled={isLoading}
        class="p-1.5 bg-[#7837d9] hover:bg-[#6c31c4] rounded transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-75"
        title="Refresh Unread"
        aria-label="Refresh"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 {isLoading ? 'animate-[spin_1s_linear_infinite]' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    {/if}
  </header>

  <div class="flex-1 flex overflow-hidden">
    <!-- Left Pane: List -->
    <div class="w-1/2 min-w-[320px] max-w-[380px] border-r border-slate-200 overflow-y-auto bg-white flex flex-col custom-scrollbar">
      {#if isLoading && unreadEmails.length === 0}
        <div class="p-4 animate-pulse space-y-5">
          {#each Array(5) as _}
            <div class="flex gap-3">
              <div class="w-10 h-10 bg-slate-200 rounded-full shrink-0"></div>
              <div class="flex-1 space-y-2 py-1">
                <div class="h-4 bg-slate-200 rounded w-1/2"></div>
                <div class="h-3 bg-slate-200 rounded w-3/4"></div>
                <div class="h-3 bg-slate-200 rounded w-full"></div>
              </div>
            </div>
          {/each}
        </div>
      {:else if notAuthenticated}
        <div class="flex flex-col items-center justify-center h-full text-center space-y-4 p-4">
          <div class="bg-blue-50 text-blue-600 p-3 rounded-full mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-[#8b45f3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p class="text-sm text-slate-500">Please connect your Fastmail account to view your messages.</p>
          <button onclick={openOptions} class="px-5 py-2 bg-[#8b45f3] text-white rounded hover:bg-[#7837d9] transition-colors text-sm font-medium shadow-sm">
            Connect
          </button>
        </div>
      {:else if errorMsg}
        <div class="p-4 text-center text-red-500 text-sm">{errorMsg}</div>
      {:else if unreadEmails.length === 0}
        <div class="flex flex-col items-center justify-center h-full p-4 text-center text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7" />
          </svg>
          <p>Inbox zero!</p>
        </div>
      {:else}
        <ul class="flex-1">
          {#each unreadEmails as email (email.id)}
            <li class="group relative border-b border-slate-100 last:border-0 transition-colors cursor-pointer {selectedEmail?.id === email.id ? 'bg-[#f4f0fa]' : 'hover:bg-slate-50 bg-white'}">
              <a
                href="#"
                onclick={(e) => selectEmail(email, e)}
                class="flex p-3 pr-4 gap-3 items-start outline-none"
              >
                <!-- Avatar -->
                <div class="shrink-0 pt-0.5">
                  <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-[#7c33e8] to-[#ab65ff] flex items-center justify-center text-white font-medium text-[13px] tracking-wide shadow-sm">
                    {getInitials(email.from?.[0]?.name || email.from?.[0]?.email)}
                  </div>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-baseline mb-[1px]">
                    <span class="font-bold text-slate-900 text-[14px] truncate pr-2">
                      {email.from?.[0]?.name || email.from?.[0]?.email || "Unknown"}
                    </span>
                    <span class="text-[12px] font-medium text-slate-500 shrink-0">
                      {formatTime(email.receivedAt)}
                    </span>
                  </div>
                  <div class="text-[13.5px] font-bold text-slate-800 truncate mb-[2px] leading-tight">
                    {email.subject || "(No Subject)"}
                  </div>
                  <div class="text-[13px] text-slate-500 truncate leading-snug">
                    {email.preview || "..."}
                  </div>
                </div>
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Right Pane: Preview -->
    <div class="flex-1 flex flex-col bg-[#fdfcfd] overflow-hidden relative">
      {#if selectedEmail}
        <div class="p-5 border-b border-slate-200 bg-white shrink-0 shadow-sm z-10">
          <div class="flex justify-between items-start mb-3">
             <h2 class="text-xl font-bold text-slate-800 leading-tight pr-4">{selectedEmail.subject || "(No Subject)"}</h2>
             <a
               href={`https://www.fastmail.com/mail/Message/${selectedEmail.id}`}
               target="_blank"
               rel="noopener noreferrer"
               title="Open in Fastmail"
               class="p-1.5 bg-[#f4f0fa] text-[#8b45f3] hover:bg-[#eadef5] rounded transition-colors shrink-0"
             >
               <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
             </a>
          </div>
          <div class="flex gap-3 items-center">
             <div class="w-8 h-8 shrink-0 rounded-full bg-gradient-to-tr from-[#7c33e8] to-[#ab65ff] flex items-center justify-center text-white font-medium text-[11px] tracking-wide shadow-sm">
                {getInitials(selectedEmail.from?.[0]?.name || selectedEmail.from?.[0]?.email)}
             </div>
             <div class="flex flex-col min-w-0">
               <span class="text-[14px] font-bold text-slate-800 truncate">
                 {selectedEmail.from?.[0]?.name ? `${selectedEmail.from[0].name} <${selectedEmail.from[0].email}>` : selectedEmail.from?.[0]?.email}
               </span>
               <span class="text-[12px] text-slate-500">
                 {new Date(selectedEmail.receivedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
               </span>
             </div>
          </div>
        </div>
        
        <div class="flex-1 overflow-hidden m-4 bg-white rounded shadow-sm border border-slate-200">
          {#if isLoadingBody}
            <div class="p-6 animate-pulse space-y-4">
              <div class="h-4 bg-slate-100 rounded w-3/4"></div>
              <div class="h-4 bg-slate-100 rounded w-full"></div>
              <div class="h-4 bg-slate-100 rounded w-5/6"></div>
              <div class="h-4 bg-slate-100 rounded w-1/2"></div>
            </div>
          {:else if emailBody}
            <iframe 
              srcdoc={emailBody} 
              class="w-full h-full border-none"
              title="Email Preview"
              sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            ></iframe>
          {:else}
            <div class="p-6 text-slate-500 italic">
               This email could not be previewed.
            </div>
          {/if}
        </div>
      {:else}
        <div class="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center bg-slate-50/50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 opacity-30 text-[#8b45f3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
          </svg>
          <p class="font-medium text-lg text-slate-500">Select an email to read</p>
        </div>
      {/if}
    </div>
  </div>
</main>

<style>
  /* Custom scrollbar for a cleaner look */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 20px;
  }
</style>
