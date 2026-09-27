<script lang="ts">
  interface Props {
    onconnect: () => void;
  }

  let { onconnect }: Props = $props();
</script>

<div
  class="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#fdfcfd]"
>
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
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  </div>
  <h2 class="text-base font-semibold text-slate-800 mb-1">
    Connect Your Account
  </h2>
  <p class="text-sm text-slate-500 max-w-[240px] mb-4">
    Please connect your Fastmail account to view your messages.
  </p>
  <button
    onclick={onconnect}
    class="px-5 py-2 bg-[#8b45f3] text-white rounded hover:bg-[#7837d9] transition-colors text-sm font-medium shadow-sm cursor-pointer"
  >
    Connect
  </button>
</div>
