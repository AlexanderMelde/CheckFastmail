<script lang="ts">
  import type { Snippet } from "svelte";
  import type { NavGroup } from "../types";
  import Icon from "./Icon.svelte";

  interface Props {
    groups: NavGroup[];
    activeId: string;
    onselect: (id: string) => void;
    footer?: Snippet;
  }

  let { groups, activeId, onselect, footer }: Props = $props();
</script>

<nav class="w-[220px] shrink-0 bg-white border-r border-slate-200 py-4 overflow-y-auto flex flex-col justify-between h-full">
  <div class="px-3 space-y-4">
    {#each groups as group}
      <div>
        <div class="text-[12px] font-semibold uppercase tracking-wider text-slate-400 px-2.5 pt-1 pb-1.5">
          {group.title}
        </div>
        <div class="space-y-0.5">
          {#each group.items as item}
            <button
              type="button"
              onclick={() => onselect(item.id)}
              class="flex items-center gap-2.5 w-full py-2 px-2.5 border-none rounded-[6px] text-[14px] text-left cursor-pointer transition-colors duration-150 {activeId === item.id
                ? 'nav-item-active'
                : 'text-slate-600 hover:bg-slate-50 font-normal'}"
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {#if item.badge}
                <span class="ml-auto text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                  {item.badge}
                </span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  {#if footer}
    <div class="px-3 pt-3 border-t border-slate-100">
      {@render footer()}
    </div>
  {/if}
</nav>

<style>
  .nav-item-active {
    background: rgba(36, 57, 89, 0.15);
    color: #1b1e20;
    font-weight: 700;
  }
</style>
