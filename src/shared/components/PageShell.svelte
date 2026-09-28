<script lang="ts">
  import type { Snippet } from "svelte";
  import type { NavGroup } from "../types";
  import Header from "./Header.svelte";
  import NavSidebar from "./NavSidebar.svelte";

  interface Props {
    title?: string;
    groups: NavGroup[];
    activeId: string;
    onselect: (id: string) => void;
    headerActions?: Snippet;
    sidebarFooter?: Snippet;
    children?: Snippet;
  }

  let {
    title = "Checker for Fastmail",
    groups,
    activeId,
    onselect,
    headerActions,
    sidebarFooter,
    children,
  }: Props = $props();

  let isMobileMenuOpen = $state(false);

  function handleSelect(id: string) {
    isMobileMenuOpen = false;
    onselect(id);
  }
</script>

<div class="flex flex-col min-h-screen font-sans text-[14px] text-slate-700 bg-slate-50">
  <Header
    {title}
    {isMobileMenuOpen}
    ontoggleMobileMenu={() => (isMobileMenuOpen = !isMobileMenuOpen)}
  >
    {#if headerActions}
      {@render headerActions()}
    {/if}
  </Header>

  <div class="flex flex-1 min-h-0 relative">
    <!-- Desktop Sidebar -->
    <div class="hidden md:block shrink-0">
      <NavSidebar
        {groups}
        {activeId}
        onselect={handleSelect}
        footer={sidebarFooter}
      />
    </div>

    <!-- Mobile Drawer Overlay -->
    {#if isMobileMenuOpen}
      <div
        class="fixed inset-0 top-14 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity"
        onclick={() => (isMobileMenuOpen = false)}
        role="presentation"
      ></div>
      <div
        class="fixed top-14 left-0 bottom-0 z-50 md:hidden bg-white shadow-xl transition-transform duration-200"
      >
        <NavSidebar
          {groups}
          {activeId}
          onselect={handleSelect}
          footer={sidebarFooter}
        />
      </div>
    {/if}

    <!-- Main Content Area -->
    <main class="flex-1 py-6 px-4 sm:py-8 sm:px-10 overflow-y-auto max-w-[760px]">
      {#if children}
        {@render children()}
      {/if}
    </main>
  </div>
</div>
