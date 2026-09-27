<script lang="ts">
  import { onMount } from "svelte";
  import Header from "../components/Header.svelte";
  import SettingsSidebar from "../components/SettingsSidebar.svelte";
  import ConnectionSettings from "../components/ConnectionSettings.svelte";
  import { extensionClient } from "../services/extensionClient";

  let isConnected = $state(false);

  onMount(() => {
    extensionClient.getStoredToken().then((token) => {
      isConnected = Boolean(token);
    });

    const unsubscribe = extensionClient.onTokenChanged((token) => {
      isConnected = Boolean(token);
    });

    return unsubscribe;
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
