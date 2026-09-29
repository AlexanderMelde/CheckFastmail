<script lang="ts">
  import type { EmailItem } from "../../../shared/types";
  import { formatTime } from "../format";

  interface Props {
    email: EmailItem;
    isSelected: boolean;
    onselect: (email: EmailItem) => void;
  }

  let { email, isSelected, onselect }: Props = $props();
</script>

<li
  role="none"
  class="group relative border-b border-slate-100 last:border-0 transition-colors cursor-pointer {isSelected
    ? 'bg-[#f4f0fa]'
    : 'hover:bg-slate-50 bg-white'}"
>
  <button
    type="button"
    role="option"
    aria-selected={isSelected}
    tabindex={isSelected ? 0 : -1}
    id={`email-item-${email.id}`}
    onclick={() => onselect(email)}
    class="w-full text-left flex p-3 pr-4 gap-3 items-start outline-none focus-visible:ring-2 focus-visible:ring-[#8b45f3] focus-visible:ring-inset cursor-pointer bg-transparent border-none"
  >
    <div class="flex-1 min-w-0 font-sans">
      <div class="flex justify-between items-baseline mb-[1px]">
        <span
          class="text-slate-900 truncate pr-2 text-[14px] leading-[20px]"
        >
          {email.from?.[0]?.name ||
            email.from?.[0]?.email ||
            "Unknown"}
        </span>
        <span class="text-slate-500 shrink-0 text-[12px]">
          {formatTime(email.receivedAt)}
        </span>
      </div>
      <div
        class="text-slate-800 truncate mb-[2px] text-[14px] font-semibold leading-[20px]"
      >
        {email.subject || "(No Subject)"}
      </div>
      <div
        class="text-slate-500 truncate text-[12px] font-normal leading-[17px]"
      >
        {email.preview || "..."}
      </div>
    </div>
  </button>
</li>
