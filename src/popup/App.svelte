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
        if (
          selectedEmail &&
          !unreadEmails.find((e) => e.id === selectedEmail.id)
        ) {
          selectedEmail = null;
          emailBody = null;
        }
      } else {
        errorMsg =
          "Failed to fetch emails. Please check your connection in Options.";
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

    chrome.runtime.sendMessage(
      { type: "FETCH_EMAIL_BODY", emailId: email.id },
      (response) => {
        if (selectedEmail && selectedEmail.id === email.id) {
          isLoadingBody = false;
          if (response && response.body) {
            emailBody = response.body;
          } else {
            emailBody =
              "Could not load email content. It might be plain text or unsupported.";
          }
        }
      },
    );
  }

  function formatTime(dateString: string) {
    const d = new Date(dateString);
    const today = new Date();
    const isToday = d.getDate() === today.getDate() &&
                    d.getMonth() === today.getMonth() &&
                    d.getFullYear() === today.getFullYear();
                    
    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  }

  function getInitials(name: string) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  function buildIframeContent(email: any, bodyHtml: string) {
    const subject = email.subject || "(No Subject)";
    const fromNameOnly = email.from?.[0]?.name || email.from?.[0]?.email || 'Unknown';
    const fromEmailOnly = (email.from?.[0]?.name && email.from?.[0]?.email) ? `<${email.from[0].email}>` : '';
    const toNameOnly = email.to?.[0]?.email || email.to?.[0]?.name || 'you';
    const initials = getInitials(email.from?.[0]?.name || email.from?.[0]?.email);
    const date = new Date(email.receivedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    const openUrl = `https://www.fastmail.com/mail/Message/${email.id}`;

    const escapeHtml = (str: string) => {
      if (!str) return '';
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };
    
    const headerHtml = `
      <style>
        .ext-open-btn {
          all: initial !important; box-sizing: border-box !important; position: absolute !important; top: 9px !important; right: 18px !important; display: inline-flex !important; padding: 6px !important; background: transparent !important; color: #47515a !important; border-radius: 6px !important; text-decoration: none !important; cursor: pointer !important; transition: all 0.15s ease !important; height: 28px !important; width: 28px !important; align-items: center !important; justify-content: center !important; margin: 0 !important;
        }
        .ext-open-btn:hover {
          background: rgba(51, 62, 72, .05) !important; color: #2d3236 !important;
        }
        .ext-open-btn:active {
          background: rgba(51, 62, 72, .1) !important;
        }
        .ext-open-btn svg {
          width: 17px !important; height: 17px !important; display: block !important; margin: 0 !important; padding: 0 !important;
        }
        
        /* Custom scrollbar to match the list pane */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      </style>
      <div style="all: initial !important; display: block !important; box-sizing: border-box !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; padding: 9px 18px !important; border-bottom: 1px solid #e2e8f0 !important; background: #fff !important; position: relative !important; margin: 0 !important; height: auto !important; max-height: none !important; min-height: 0 !important;">
        <a href="${openUrl}" target="_blank" rel="noopener noreferrer" title="Open in Fastmail" class="ext-open-btn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
        <h2 style="all: initial !important; display: block !important; box-sizing: border-box !important; color: #1e293b !important; margin: 0 0 12px 0 !important; padding: 0 40px 0 0 !important; font-family: 'Proxima Nova', system-ui, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Noto Sans', -apple-system, Arial, sans-serif !important; font-feature-settings: normal !important; font-kerning: auto !important; font-language-override: normal !important; font-optical-sizing: auto !important; font-size: 17.7188px !important; font-weight: 700 !important; line-height: 24px !important; height: auto !important; max-height: none !important; min-height: 0 !important; text-align: left !important;">
          ${escapeHtml(subject)}
        </h2>
        <div style="all: initial !important; display: flex !important; box-sizing: border-box !important; align-items: center !important; gap: 16px !important; font-family: inherit !important; margin: 0 !important; padding: 0 !important; height: auto !important; flex-direction: row !important;">
          <div style="all: initial !important; display: flex !important; box-sizing: border-box !important; width: 40px !important; height: 40px !important; border-radius: 50% !important; background: linear-gradient(to top right, #7c33e8, #ab65ff) !important; color: #fff !important; align-items: center !important; justify-content: center !important; font-size: 15px !important; font-weight: 500 !important; letter-spacing: 0.5px !important; box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important; font-family: inherit !important; flex-shrink: 0 !important; margin: 0 !important; padding: 0 !important;">
            ${escapeHtml(initials)}
          </div>
          <div style="all: initial !important; display: flex !important; box-sizing: border-box !important; flex-direction: column !important; min-width: 0 !important; font-family: inherit !important; margin: 0 !important; padding: 0 !important; height: auto !important; justify-content: center !important; width: 100% !important;">
            <div style="all: initial !important; display: flex !important; box-sizing: border-box !important; align-items: center !important; font-family: inherit !important; margin: 0 !important; padding: 0 !important; width: 100% !important; gap: 6px !important;">
              <span style="all: initial !important; font-family: inherit !important; font-size: 14px !important; font-weight: 600 !important; color: #1e293b !important; height: 20px !important; line-height: 20px !important; letter-spacing: normal !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; flex-shrink: 0 !important;">
                ${escapeHtml(fromNameOnly)}
              </span>
              ${fromEmailOnly ? `<span title="${escapeHtml(email.from[0].email)}" style="all: initial !important; font-family: inherit !important; font-size: 14px !important; color: #94a3b8 !important; height: 20px !important; line-height: 20px !important; letter-spacing: normal !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; flex-shrink: 1 !important; cursor: default !important;">
                ${escapeHtml(fromEmailOnly)}
              </span>` : ''}
              <span style="all: initial !important; font-family: inherit !important; font-size: 14px !important; color: #1e293b !important; height: 20px !important; line-height: 20px !important; letter-spacing: normal !important; white-space: nowrap !important; flex-shrink: 0 !important;">
                ${escapeHtml(date)}
              </span>
            </div>
            <div style="all: initial !important; display: flex !important; box-sizing: border-box !important; font-family: inherit !important; margin: 0 !important; padding: 0 !important; gap: 6px !important;">
              <span style="all: initial !important; font-family: inherit !important; font-size: 13px !important; color: #64748b !important; height: 20px !important; line-height: 20px !important; white-space: nowrap !important;">
                to ${escapeHtml(toNameOnly)}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;

    const trackerFixStyle = `<style>img[width="1"][height="1"], img[width="0"][height="0"] { display: none !important; position: absolute !important; }</style>`;

    const bodyTagMatch = bodyHtml.match(/<body[^>]*>/i);
    if (bodyTagMatch) {
      return bodyHtml.replace(bodyTagMatch[0], bodyTagMatch[0] + trackerFixStyle + headerHtml);
    } else {
      return trackerFixStyle + headerHtml + bodyHtml;
    }
  }
</script>

<main class="flex flex-col bg-white h-[600px] w-full font-sans text-[14px]">
  <header
    class="flex justify-between items-center p-4 shrink-0 shadow-sm z-10 h-14"
    style="background: linear-gradient(290deg, #49578d 5%, #7934a3 95%); color: #ffffff;"
  >
    <div class="flex items-center gap-2">
      <h1 style="font-family: 'Proxima Nova', system-ui, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Noto Sans', -apple-system, Arial, sans-serif; font-size: 15.75px; font-weight: 700;">
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
            class="px-5 py-2 bg-[#8b45f3] text-white rounded hover:bg-[#7837d9] transition-colors text-sm font-medium shadow-sm"
          >
            Connect
          </button>
        </div>
      {:else if errorMsg}
        <div class="p-4 text-center text-red-500 text-sm">{errorMsg}</div>
      {:else if unreadEmails.length === 0}
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
        <ul class="flex-1">
          {#each unreadEmails as email (email.id)}
            <li
              class="group relative border-b border-slate-100 last:border-0 transition-colors cursor-pointer {selectedEmail?.id ===
              email.id
                ? 'bg-[#f4f0fa]'
                : 'hover:bg-slate-50 bg-white'}"
            >
              <a
                href="#"
                onclick={(e) => selectEmail(email, e)}
                class="flex p-3 pr-4 gap-3 items-start outline-none"
              >
                <!-- Content -->
                <div class="flex-1 min-w-0" style="font-family: 'Proxima Nova', system-ui, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Noto Sans', -apple-system, Arial, sans-serif;">
                  <div class="flex justify-between items-baseline mb-[1px]">
                    <span
                      class="text-slate-900 truncate pr-2"
                      style="font-size: 14px; line-height: 20px;"
                    >
                      {email.from?.[0]?.name ||
                        email.from?.[0]?.email ||
                        "Unknown"}
                    </span>
                    <span
                      class="text-slate-500 shrink-0"
                      style="font-size: 12.4444px;"
                    >
                      {formatTime(email.receivedAt)}
                    </span>
                  </div>
                  <div
                    class="text-slate-800 truncate mb-[2px]"
                    style="font-size: 14px; font-weight: 600; line-height: 20px;"
                  >
                    {email.subject || "(No Subject)"}
                  </div>
                  <div 
                    class="text-slate-500 truncate"
                    style="font-size: 12.4444px; font-weight: 400; line-height: 17px;"
                  >
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
        <div class="flex-1 overflow-hidden bg-white flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
          {#if isLoadingBody}
            <div class="p-6 animate-pulse space-y-4 mt-4">
              <div class="h-4 bg-slate-100 rounded w-3/4"></div>
              <div class="h-4 bg-slate-100 rounded w-full"></div>
              <div class="h-4 bg-slate-100 rounded w-5/6"></div>
              <div class="h-4 bg-slate-100 rounded w-1/2"></div>
            </div>
          {:else if emailBody}
            <iframe
              srcdoc={buildIframeContent(selectedEmail, emailBody)}
              class="w-full h-full border-none"
              title="Email Preview"
              sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
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
