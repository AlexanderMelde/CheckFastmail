<script lang="ts">
  interface Props {
    errorMsg?: string;
    onretry?: () => void;
  }

  let { errorMsg, onretry }: Props = $props();
</script>

<div
  class="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#fdfcfd]"
>
  {#if errorMsg}
    <div
      class="p-2.5 px-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 mb-6 flex items-center gap-3"
    >
      <span>{errorMsg}</span>
      {#if onretry}
        <button
          type="button"
          onclick={onretry}
          class="text-red-700 underline font-medium hover:text-red-800 cursor-pointer"
        >
          Retry
        </button>
      {/if}
    </div>
  {/if}
  <div
    class="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4 text-[#7934a3] shadow-sm"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-8 h-8"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.75"
        d="M5 13l4 4L19 7"
      />
    </svg>
  </div>
  <h2 class="text-base font-semibold text-slate-800 mb-1">
    Your Inbox is empty!
  </h2>
  <p class="text-sm text-slate-500 max-w-[240px]">
    You're all caught up! No unread messages in your inbox.
  </p>
</div>
