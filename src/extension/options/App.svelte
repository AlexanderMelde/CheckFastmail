<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type { NavGroup } from "../../shared/types";
  import { Router } from "../../shared/router/router.svelte";
  import PageShell from "../../shared/components/PageShell.svelte";
  import ConnectionSettings from "./components/ConnectionSettings.svelte";
  import PrivacyPolicy from "../../shared/components/PrivacyPolicy.svelte";
  import TermsOfUse from "../../shared/components/TermsOfUse.svelte";
  import Imprint from "../../shared/components/Imprint.svelte";
  import { extensionClient } from "../services/extensionClient";

  let isConnected = $state(false);

  const router = new Router({
    mode: "hash",
    defaultRoute: "connection",
  });

  onMount(() => {
    extensionClient.getStoredToken().then((token) => {
      isConnected = Boolean(token);
    });

    const unsubscribe = extensionClient.onTokenChanged((token) => {
      isConnected = Boolean(token);
    });

    return unsubscribe;
  });

  onDestroy(() => {
    router.destroy();
  });

  const navGroups: NavGroup[] = [
    {
      title: "Settings",
      items: [
        { id: "connection", label: "Connection", icon: "connection" },
      ],
    },
    {
      title: "Legal",
      items: [
        { id: "privacy", label: "Privacy Policy", icon: "shield" },
        { id: "terms", label: "Terms of Use", icon: "doc" },
        { id: "imprint", label: "Imprint", icon: "info" },
      ],
    },
  ];
</script>

<PageShell
  title="Checker for Fastmail Options"
  groups={navGroups}
  activeId={router.current}
  onselect={(id) => router.navigate(id)}
>
  {#if router.current === "connection"}
    <ConnectionSettings bind:isConnected />
  {:else if router.current === "privacy"}
    <PrivacyPolicy />
  {:else if router.current === "terms"}
    <TermsOfUse />
  {:else if router.current === "imprint"}
    <Imprint />
  {:else}
    <ConnectionSettings bind:isConnected />
  {/if}
</PageShell>
