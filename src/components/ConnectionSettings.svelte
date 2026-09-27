<script lang="ts">
  import { extensionClient } from "../services/extensionClient";

  interface Props {
    isConnected: boolean;
  }

  let { isConnected = $bindable(false) }: Props = $props();

  let apiToken = $state("");
  let isSaving = $state(false);
  let errorMsg = $state("");

  async function handleSave() {
    if (!apiToken.trim()) {
      errorMsg = "Please enter an API token";
      return;
    }

    isSaving = true;
    errorMsg = "";

    const success = await extensionClient.testAndSaveToken(apiToken.trim());
    isSaving = false;

    if (success) {
      isConnected = true;
      apiToken = "";
    } else {
      errorMsg =
        "Invalid token or connection failed. Please check your token and try again.";
    }
  }

  async function handleDisconnect() {
    errorMsg = "";
    await extensionClient.disconnect();
    isConnected = false;
  }
</script>

<h1 class="text-[19px] font-bold text-slate-900 leading-6 m-0 mb-5">
  Connection
</h1>

<!-- Status -->
<div
  class="flex items-center gap-2 mb-6 py-3 px-4 rounded-lg bg-slate-50 border border-slate-200"
>
  <div
    class="w-2.5 h-2.5 rounded-full shrink-0 {isConnected
      ? 'bg-green-500'
      : 'bg-slate-400'}"
  ></div>
  <span class="text-[14px] text-slate-600"
    >{isConnected ? "Connected to Fastmail" : "Not Connected"}</span
  >
</div>

{#if !isConnected}
  <!-- Setup Instructions -->
  <div
    class="mb-6 py-4 px-5 bg-indigo-50 rounded-lg text-[13px] text-slate-700 leading-relaxed"
  >
    <p class="font-semibold mb-2">To connect your account:</p>
    <ol class="m-0 pl-5 space-y-1">
      <li>
        Go to your Fastmail settings: <a
          href="https://app.fastmail.com/settings/security/tokens"
          target="_blank"
          rel="noopener noreferrer"
          class="text-purple-800 underline hover:text-purple-950"
          >Settings &gt; Security &gt; API Tokens</a
        >
      </li>
      <li>Click <strong>New API Token</strong></li>
      <li>
        Give it a name (e.g. "Checker Extension") and ensure the <strong
          >JMAP</strong
        > protocol is selected.
      </li>
      <li>Select <strong>Read-only</strong> permissions for Mail.</li>
      <li>Copy the token and paste it below.</li>
    </ol>
  </div>

  <!-- Token Input -->
  <div class="flex flex-col gap-2 mb-6">
    <label for="apiToken" class="text-[13px] font-semibold text-slate-600"
      >API Token</label
    >
    <input
      type="password"
      id="apiToken"
      bind:value={apiToken}
      onkeydown={(e) => {
        if (e.key === "Enter") handleSave();
      }}
      placeholder="fm1-..."
      class="token-input py-2 px-3 border border-slate-300 rounded-[6px] text-[14px] font-sans outline-none max-w-[400px]"
    />
    {#if errorMsg}
      <p class="text-[13px] text-red-600 m-0">{errorMsg}</p>
    {/if}
    <button
      onclick={handleSave}
      disabled={isSaving}
      class="self-start inline-flex items-center gap-2 py-2 px-5 bg-violet-600 text-white border-none rounded-[6px] text-[14px] font-medium font-sans cursor-pointer transition-colors duration-150 hover:bg-violet-700 disabled:opacity-55 disabled:cursor-default"
    >
      {#if isSaving}
        <svg
          class="w-4 h-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span>Connecting...</span>
      {:else}
        <span>Save & Connect</span>
      {/if}
    </button>
  </div>
{:else}
  <!-- Connected State -->
  <div
    class="flex items-start gap-3 py-4 px-5 bg-green-50 border border-green-200 rounded-lg mb-5"
  >
    <div
      class="shrink-0 mt-0.5 w-7 h-7 flex items-center justify-center bg-green-100 rounded-full text-green-600"
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
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>
    <div>
      <h3 class="text-[15px] font-semibold text-green-950 m-0 mb-1">
        You're all set!
      </h3>
      <p class="text-[13px] text-green-800 leading-normal m-0">
        Click the extension icon in your browser toolbar to view your unread
        emails. You can also pin it for one-click access.
      </p>
    </div>
  </div>

  <button
    onclick={handleDisconnect}
    class="inline-flex items-center py-2 px-5 bg-white text-red-600 border border-red-200 rounded-[6px] text-[14px] font-medium font-sans cursor-pointer transition-colors duration-150 hover:bg-red-50 hover:border-red-400"
  >
    Disconnect
  </button>
{/if}

<div class="mt-8 pt-5 border-t border-slate-200 text-[13px] text-slate-400">
  <p class="m-0">
    Your API token is securely stored locally in your browser and is never
    transmitted to any third party.
  </p>
</div>

<style>
  .token-input:focus {
    border-color: #8b45f3;
    box-shadow: 0 0 0 2px rgba(139, 69, 243, 0.15);
  }
</style>
