<script lang="ts">
  import type { EmailItem } from "../types";
  import EmailListItem from "./EmailListItem.svelte";

  interface Props {
    emails: EmailItem[];
    selectedEmailId?: string;
    isLoading: boolean;
    errorMsg: string;
    onselect: (email: EmailItem) => void;
    onretry: () => void;
  }

  let {
    emails,
    selectedEmailId,
    isLoading,
    errorMsg,
    onselect,
    onretry,
  }: Props = $props();
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
      {#each emails as email (email.id)}
        <EmailListItem
          {email}
          isSelected={selectedEmailId === email.id}
          {onselect}
        />
      {/each}
    </ul>
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
