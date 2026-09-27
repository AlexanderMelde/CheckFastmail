<script lang="ts">
  import { onMount } from "svelte";
  import type { EmailItem, FetchUnreadResponse, FetchEmailBodyResponse } from "../types";
  import { formatTime, buildIframeContent } from "./format";

  let unreadEmails = $state<EmailItem[]>([]);
  let isLoading = $state(true);
  let hasInitialized = $state(false);
  let errorMsg = $state("");
  let notAuthenticated = $state(false);

  let selectedEmail = $state<EmailItem | null>(null);
  let emailBody = $state<string | null>(null);
  let isPlainText = $state(false);
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

    chrome.runtime.sendMessage({ type: "FETCH_UNREAD" }, (response: FetchUnreadResponse) => {
      hasInitialized = true;
      if (chrome.runtime.lastError) {
        errorMsg = "Error communicating with background script.";
        finishLoading();
        return;
      }

      if (response && response.notAuthenticated) {
        notAuthenticated = true;
      } else if (response && response.error) {
        errorMsg = response.error;
      } else if (response && response.emails) {
        unreadEmails = response.emails;
        if (
          selectedEmail &&
          !unreadEmails.find((e) => e.id === selectedEmail?.id)
        ) {
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

  function selectEmail(email: EmailItem) {
    selectedEmail = email;
    emailBody = null;
    isPlainText = false;
    isLoadingBody = true;

    chrome.runtime.sendMessage(
      { type: "FETCH_EMAIL_BODY", emailId: email.id },
      (response: FetchEmailBodyResponse) => {
        if (chrome.runtime.lastError) {
          if (selectedEmail && selectedEmail.id === email.id) {
            isLoadingBody = false;
            emailBody = "Error communicating with background script.";
            isPlainText = true;
          }
          return;
        }

        if (selectedEmail && selectedEmail.id === email.id) {
          isLoadingBody = false;
          if (response && response.body !== null) {
            emailBody = response.body;
            isPlainText = Boolean(response.isPlainText);
          } else {
            emailBody = response?.error ? `Error: ${response.error}` : "Could not load email content.";
            isPlainText = true;
          }
        }
      }
    );
  }
</script>

<main class="flex flex-col bg-white h-[600px] w-full font-sans text-[14px]">
  <header
    class="flex justify-between items-center p-4 shrink-0 shadow-sm z-10 h-14"
    style="background: linear-gradient(290deg, #49578d 5%, #7934a3 95%); color: #ffffff;"
  >
    <div class="flex items-center gap-2">
      <h1 class="text-[15.75px] font-bold font-sans">
        Checker for Fastmail
      </h1>
    </div>
    {#if !notAuthenticated}
      <button
        onclick={handleRefresh}
        disabled={isLoading}
        class="w-[28px] h-[28px] flex items-center justify-center bg-transparent hover:bg-white/10 active:bg-white/20 rounded-[6px] transition-all duration-150 ease-in-out focus:outline-none disabled:opacity-50 cursor-pointer text-white"
        title="Refresh Unread"
        aria-label="Refresh"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-[17px] h-[17px] {isLoading ? 'animate-[spin_1s_linear_infinite]' : ''}"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.75"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    {/if}
  </header>

  <div class="flex-1 flex overflow-hidden">
    <!-- Left Pane: List -->
    <div
      class="w-1/3 min-w-[260px] max-w-[320px] border-r border-slate-200 overflow-y-auto bg-white flex flex-col custom-scrollbar"
    >
      {#if errorMsg}
        <div class="p-2.5 px-3 bg-red-50 border-b border-red-100 flex items-center justify-between text-xs text-red-700 shrink-0">
          <span class="truncate pr-2">{errorMsg}</span>
          <button
            type="button"
            onclick={handleRefresh}
            disabled={isLoading}
            class="text-red-700 underline font-medium hover:text-red-800 cursor-pointer disabled:opacity-50 shrink-0"
          >
            Retry
          </button>
        </div>
      {/if}

      {#if !hasInitialized && isLoading}
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
        <div
          class="flex flex-col items-center justify-center h-full text-center space-y-4 p-4"
        >
          <div class="bg-blue-50 text-blue-600 p-3 rounded-full mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-[#8b45f3]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <p class="text-sm text-slate-500">
            Please connect your Fastmail account to view your messages.
          </p>
          <button
            onclick={openOptions}
            class="px-5 py-2 bg-[#8b45f3] text-white rounded hover:bg-[#7837d9] transition-colors text-sm font-medium shadow-sm cursor-pointer"
          >
            Connect
          </button>
        </div>
      {:else if unreadEmails.length === 0}
        {#if !errorMsg}
          <div
            class="flex flex-col items-center justify-center h-full p-4 text-center text-slate-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-10 w-10 mb-2 opacity-30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p>Inbox zero!</p>
          </div>
        {:else}
          <div
            class="flex flex-col items-center justify-center h-full p-4 text-center text-slate-400"
          >
            <p class="text-sm">Unable to load messages.</p>
          </div>
        {/if}
      {:else}
        <ul class="flex-1">
          {#each unreadEmails as email (email.id)}
            <li
              class="group relative border-b border-slate-100 last:border-0 transition-colors cursor-pointer {selectedEmail?.id ===
              email.id
                ? 'bg-[#f4f0fa]'
                : 'hover:bg-slate-50 bg-white'}"
            >
              <button
                type="button"
                onclick={() => selectEmail(email)}
                class="w-full text-left flex p-3 pr-4 gap-3 items-start outline-none cursor-pointer bg-transparent border-none"
              >
                <!-- Content -->
                <div class="flex-1 min-w-0 font-sans">
                  <div class="flex justify-between items-baseline mb-[1px]">
                    <span
                      class="text-slate-900 truncate pr-2 text-[14px] leading-[20px]"
                    >
                      {email.from?.[0]?.name ||
                        email.from?.[0]?.email ||
                        "Unknown"}
                    </span>
                    <span
                      class="text-slate-500 shrink-0 text-[12px]"
                    >
                      {formatTime(email.receivedAt)}
                    </span>
                  </div>
                  <div
                    class="text-slate-800 truncate mb-[2px] text-[14px] font-semibold leading-[20px]"
                  >
                    {email.subject || "(No Subject)"}
                  </div>
                  <div 
                    class="text-slate-500 truncate text-[12px] font-normal leading-[17px]"
                  >
                    {email.preview || "..."}
                  </div>
                </div>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Right Pane: Preview -->
    <div class="flex-1 flex flex-col bg-[#fdfcfd] overflow-hidden relative">
      {#if selectedEmail}
        <div class="flex-1 overflow-hidden bg-white flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
          {#if isLoadingBody}
            <div class="p-6 animate-pulse space-y-4 mt-4">
              <div class="h-4 bg-slate-100 rounded w-3/4"></div>
              <div class="h-4 bg-slate-100 rounded w-full"></div>
              <div class="h-4 bg-slate-100 rounded w-5/6"></div>
              <div class="h-4 bg-slate-100 rounded w-1/2"></div>
            </div>
          {:else if emailBody !== null}
            <iframe
              srcdoc={buildIframeContent(selectedEmail, emailBody, isPlainText)}
              class="w-full h-full border-none"
              title="Email Preview"
              sandbox="allow-popups allow-popups-to-escape-sandbox"
            ></iframe>
          {:else}
            <div class="p-6 text-slate-500 italic mt-4">
              This email could not be previewed.
            </div>
          {/if}
        </div>
      {:else}
        <div
          class="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center bg-slate-50/50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-16 w-16 mb-4 opacity-30 text-[#8b45f3]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.2"
              d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
            />
          </svg>
          <p class="font-medium text-lg text-slate-500">
            Select an email to read
          </p>
        </div>
      {/if}
    </div>
  </div>
</main>

<style>
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
