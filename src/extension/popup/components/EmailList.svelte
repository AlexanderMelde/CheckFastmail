<script lang="ts">
  import type { EmailItem } from "../../../shared/types";
  import EmailListItem from "./EmailListItem.svelte";
  import { formatListTruncationNotice } from "../format";

  interface Props {
    emails: EmailItem[];
    totalCount?: number;
    selectedEmailId?: string;
    isLoading: boolean;
    errorMsg: string;
    onselect: (email: EmailItem) => void;
    onretry: () => void;
  }

  let {
    emails,
    totalCount,
    selectedEmailId,
    isLoading,
    errorMsg,
    onselect,
    onretry,
  }: Props = $props();

  let truncationNotice = $derived(
    formatListTruncationNotice(emails.length, totalCount)
  );

  function handleListKeydown(e: KeyboardEvent) {
    if (emails.length === 0) return;
    const currentIndex = emails.findIndex((item) => item.id === selectedEmailId);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = currentIndex < emails.length - 1 ? currentIndex + 1 : 0;
      onselect(emails[nextIndex]);
      focusEmailButton(emails[nextIndex].id);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : emails.length - 1;
      onselect(emails[prevIndex]);
      focusEmailButton(emails[prevIndex].id);
    } else if (e.key === "Home") {
      e.preventDefault();
      onselect(emails[0]);
      focusEmailButton(emails[0].id);
    } else if (e.key === "End") {
      e.preventDefault();
      onselect(emails[emails.length - 1]);
      focusEmailButton(emails[emails.length - 1].id);
    }
  }

  function focusEmailButton(id: string) {
    setTimeout(() => {
      const btn = document.getElementById(`email-item-${id}`);
      btn?.focus();
    }, 0);
  }
</script>

<div
  class="w-1/3 min-w-[260px] max-w-[320px] border-r border-slate-200 overflow-y-auto bg-white flex flex-col custom-scrollbar"
>
  {#if errorMsg}
    <div
      class="p-2.5 px-3 bg-red-50 border-b border-red-100 flex items-center justify-between text-xs text-red-700 shrink-0"
    >
      <span class="truncate pr-2">{errorMsg}</span>
      <button
        type="button"
        onclick={onretry}
        disabled={isLoading}
        class="text-red-700 underline font-medium hover:text-red-800 cursor-pointer disabled:opacity-50 shrink-0"
      >
        Retry
      </button>
    </div>
  {/if}

  {#if isLoading && emails.length === 0}
    <!-- Subsequent loading with no cached emails -->
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
  {:else if emails.length === 0}
    <div
      class="flex flex-col items-center justify-center h-full p-4 text-center text-slate-400"
    >
      <p class="text-sm">No messages</p>
    </div>
  {:else}
    <ul
      class="flex-1 outline-none"
      role="listbox"
      aria-label="Unread emails"
      tabindex="0"
      onkeydown={handleListKeydown}
    >
      {#each emails as email (email.id)}
        <EmailListItem
          {email}
          isSelected={selectedEmailId === email.id}
          {onselect}
        />
      {/each}
    </ul>
    {#if truncationNotice}
      <div
        class="py-3 px-3 text-center text-xs text-slate-500 bg-slate-50/90 border-t border-slate-100 shrink-0 select-none"
        role="status"
      >
        {truncationNotice}
      </div>
    {/if}
  {/if}
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #94a3b8;
  }
</style>
