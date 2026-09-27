<script lang="ts">
  import type { EmailItem } from "../types";
  import { buildIframeContent } from "../popup/format";

  interface Props {
    email: EmailItem | null;
    body: string | null;
    isLoadingBody: boolean;
    isBodyError: boolean;
    isPlainText: boolean;
    onretry: () => void;
  }

  let {
    email,
    body,
    isLoadingBody,
    isBodyError,
    isPlainText,
    onretry,
  }: Props = $props();
</script>

<div class="flex-1 flex flex-col bg-[#fdfcfd] overflow-hidden relative">
  {#if email}
    <div
      class="flex-1 overflow-hidden bg-white flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20"
    >
      {#if isLoadingBody}
        <div class="p-6 animate-pulse space-y-4 mt-4">
          <div class="h-4 bg-slate-100 rounded w-3/4"></div>
          <div class="h-4 bg-slate-100 rounded w-full"></div>
          <div class="h-4 bg-slate-100 rounded w-5/6"></div>
          <div class="h-4 bg-slate-100 rounded w-1/2"></div>
        </div>
      {:else if isBodyError}
        <div
          class="p-6 flex flex-col items-center justify-center h-full text-center space-y-3"
        >
          <p class="text-sm text-red-600">
            {body || "Could not load email content."}
          </p>
          <button
            type="button"
            onclick={onretry}
            class="px-4 py-1.5 bg-[#8b45f3] text-white rounded text-xs font-medium hover:bg-[#7837d9] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      {:else if body !== null}
        <iframe
          srcdoc={buildIframeContent(email, body, isPlainText)}
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
  {/if}
</div>
