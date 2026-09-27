<script lang="ts">
  import { onMount } from "svelte";
  import Header from "../components/Header.svelte";
  import SettingsSidebar from "../components/SettingsSidebar.svelte";
  import ConnectionSettings from "../components/ConnectionSettings.svelte";

  let isConnected = $state(false);

  onMount(() => {
    chrome.storage.local.get(["access_token"], (result) => {
      if (result.access_token) {
        isConnected = true;
      }
    });

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === "local" && "access_token" in changes) {
        isConnected = Boolean(changes.access_token.newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  });
</script>

<div
  class="flex flex-col min-h-screen font-sans text-[14px] text-slate-700 bg-slate-50"
>
  <Header />

  <div class="flex flex-1 min-h-0">
    <SettingsSidebar />

    <main class="flex-1 py-8 px-10 overflow-y-auto max-w-[720px]">
      <ConnectionSettings bind:isConnected />
    </main>
  </div>
</div>
