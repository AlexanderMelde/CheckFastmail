<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title?: string;
    isMobileMenuOpen?: boolean;
    ontoggleMobileMenu?: () => void;
    children?: Snippet;
  }

  let {
    title = "Checker for Fastmail",
    isMobileMenuOpen = false,
    ontoggleMobileMenu,
    children,
  }: Props = $props();
</script>

<header
  class="flex justify-between items-center px-4 shrink-0 shadow-sm z-30 h-14"
  style="background: linear-gradient(290deg, #49578d 5%, #7934a3 95%); color: #ffffff;"
>
  <div class="flex items-center gap-2.5">
    {#if ontoggleMobileMenu}
      <button
        type="button"
        onclick={ontoggleMobileMenu}
        aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
        class="header-btn md:!hidden"
      >
        {#if isMobileMenuOpen}
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        {:else}
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        {/if}
      </button>
    {/if}

    <div class="flex items-center gap-2">
      <span class="text-[15.75px] font-bold font-sans tracking-tight">{title}</span>
    </div>
  </div>

  <div class="flex items-center gap-1.5">
    {#if children}
      {@render children()}
    {/if}
  </div>
</header>
