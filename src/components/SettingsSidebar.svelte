<script lang="ts">
  import type { OptionsTab } from "../types";

  interface Props {
    currentTab: OptionsTab;
    onselect: (tab: OptionsTab) => void;
  }

  let { currentTab, onselect }: Props = $props();
</script>

<nav
  class="w-[220px] shrink-0 bg-white border-r border-slate-200 py-4 overflow-y-auto"
>
  <div class="px-3 space-y-4">
    <div>
      <div
        class="text-[12px] font-semibold uppercase tracking-wider text-slate-400 px-2.5 pt-1 pb-1.5"
      >
        Settings
      </div>
      <button
        type="button"
        onclick={() => onselect("connection")}
        class="flex items-center gap-2.5 w-full py-2 px-2.5 border-none rounded-[6px] text-[14px] text-left cursor-pointer transition-colors duration-150 {currentTab === 'connection'
          ? 'nav-item-active'
          : 'text-slate-600 hover:bg-slate-50 font-normal'}"
      >
        <svg
          class="w-[18px] h-[18px] shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.75"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        <span>Connection</span>
      </button>
    </div>

    <div>
      <div
        class="text-[12px] font-semibold uppercase tracking-wider text-slate-400 px-2.5 pt-1 pb-1.5"
      >
        Legal
      </div>
      <div class="space-y-0.5">
        <button
          type="button"
          onclick={() => onselect("privacy")}
          class="flex items-center gap-2.5 w-full py-2 px-2.5 border-none rounded-[6px] text-[14px] text-left cursor-pointer transition-colors duration-150 {currentTab === 'privacy'
            ? 'nav-item-active'
            : 'text-slate-600 hover:bg-slate-50 font-normal'}"
        >
          <svg
            class="w-[18px] h-[18px] shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.75"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span>Privacy Policy</span>
        </button>

        <button
          type="button"
          onclick={() => onselect("terms")}
          class="flex items-center gap-2.5 w-full py-2 px-2.5 border-none rounded-[6px] text-[14px] text-left cursor-pointer transition-colors duration-150 {currentTab === 'terms'
            ? 'nav-item-active'
            : 'text-slate-600 hover:bg-slate-50 font-normal'}"
        >
          <svg
            class="w-[18px] h-[18px] shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.75"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Terms of Use</span>
        </button>

        <button
          type="button"
          onclick={() => onselect("imprint")}
          class="flex items-center gap-2.5 w-full py-2 px-2.5 border-none rounded-[6px] text-[14px] text-left cursor-pointer transition-colors duration-150 {currentTab === 'imprint'
            ? 'nav-item-active'
            : 'text-slate-600 hover:bg-slate-50 font-normal'}"
        >
          <svg
            class="w-[18px] h-[18px] shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.75"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Imprint</span>
        </button>
      </div>
    </div>
  </div>
</nav>

<style>
  .nav-item-active {
    background: rgba(36, 57, 89, 0.15);
    color: #1b1e20;
    font-weight: 700;
  }
</style>
