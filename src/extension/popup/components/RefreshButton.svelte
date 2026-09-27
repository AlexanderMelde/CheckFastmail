<script lang="ts">
  interface Props {
    isLoading?: boolean;
    onclick: () => void;
  }

  let { isLoading = false, onclick }: Props = $props();
</script>

<button
  {onclick}
  disabled={isLoading}
  class="header-btn"
  title="Refresh Unread"
  aria-label="Refresh"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="w-[17px] h-[17px] {isLoading
      ? 'animate-[spin_1s_linear_infinite]'
      : ''}"
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
