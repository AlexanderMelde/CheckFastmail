<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children?: Snippet;
  }
  let { children }: Props = $props();
</script>

<header
  class="flex justify-between items-center p-4 shrink-0 shadow-sm z-10 h-14"
  style="background: linear-gradient(290deg, #49578d 5%, #7934a3 95%); color: #ffffff;"
>
  <div class="flex items-center gap-2">
    <span class="text-[15.75px] font-bold font-sans">Checker for Fastmail</span>
  </div>
  <div class="flex items-center gap-1">
    {#if children}
      {@render children()}
    {/if}
  </div>
</header>
