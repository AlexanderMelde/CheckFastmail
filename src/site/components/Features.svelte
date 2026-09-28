<script lang="ts">
  import screenshotPlaceholder from "../assets/screenshot-placeholder.png";
</script>

<h1 class="text-[19px] font-bold text-slate-900 leading-6 m-0 mb-2">
  Features
</h1>
<p class="text-[13px] text-slate-500 m-0 mb-6">
  A lightning-fast, lightweight Chrome Extension for Fastmail users. Check and
  preview unread messages directly from your toolbar.
</p>

<!-- Screenshot Showcase -->
<div
  class="mb-8 rounded-xl border border-slate-200/80 bg-white p-2 shadow-sm overflow-hidden group"
>
  <div
    class="rounded-lg overflow-hidden border border-slate-100 bg-slate-50 relative aspect-[16/9]"
  >
    <img
      src={screenshotPlaceholder}
      alt="Checker for Fastmail extension preview mockup"
      class="w-full h-full object-cover object-top"
    />
  </div>
  <div class="px-3 py-2 text-center text-xs text-slate-400">
    Clean two-pane interface: quick unread overview on the left, isolated
    message preview on the right.
  </div>
</div>

<div class="space-y-6 text-[13px] text-slate-700 leading-relaxed max-w-[680px]">
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <!-- Feature 1 -->
    <div
      class="p-4 rounded-lg bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between"
    >
      <div>
        <div
          class="w-8 h-8 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center mb-3"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h2 class="text-[14px] font-semibold text-slate-900 mb-1.5">
          Blazing Fast & Lightweight
        </h2>
        <p class="text-slate-600 m-0 leading-relaxed">
          Opens instantly with zero bloat, communicating directly with
          Fastmail’s high-performance servers for near-instant message loading.
        </p>
      </div>
    </div>

    <!-- Feature 2 -->
    <div
      class="p-4 rounded-lg bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between"
    >
      <div>
        <div
          class="w-8 h-8 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h2 class="text-[14px] font-semibold text-slate-900 mb-1.5">
          Privacy & Security First
        </h2>
        <p class="text-slate-600 m-0 leading-relaxed">
          Zero third-party servers, zero tracking scripts, and zero analytics.
          Your API token is stored exclusively in your local browser storage.
        </p>
      </div>
    </div>

    <!-- Feature 3 -->
    <div
      class="p-4 rounded-lg bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between"
    >
      <div>
        <div
          class="w-8 h-8 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center mb-3"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <h2 class="text-[14px] font-semibold text-slate-900 mb-1.5">
          Live Toolbar Badge
        </h2>
        <p class="text-slate-600 m-0 leading-relaxed">
          Always know when you have incoming mail with an automatic, low-power
          unread badge right on your extension icon.
        </p>
      </div>
    </div>

    <!-- Feature 4 -->
    <div
      class="p-4 rounded-lg bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between"
    >
      <div>
        <div
          class="w-8 h-8 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
        </div>
        <h2 class="text-[14px] font-semibold text-slate-900 mb-1.5">
          Clean, Distraction-Free UI
        </h2>
        <p class="text-slate-600 m-0 leading-relaxed">
          A modern, uncluttered interface built to let you check and read unread
          messages quickly without losing your workflow.
        </p>
      </div>
    </div>
  </div>

  <div
    class="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1"
  >
    <div class="font-semibold text-slate-700">Standards & Architecture</div>
    <div>
      Powered by Fastmail's standard JMAP API (RFC 8620 / RFC 8621), Chrome
      Manifest V3, and Svelte 5.
    </div>
  </div>
</div>
