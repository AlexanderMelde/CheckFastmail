<script lang="ts">
  import { onDestroy } from "svelte";
  import type { NavGroup } from "../shared/types";
  import { Router } from "../shared/router/router.svelte";
  import PageShell from "../shared/components/PageShell.svelte";
  import Features from "./components/Features.svelte";
  import Installation from "./components/Installation.svelte";
  import Develop from "./components/Develop.svelte";
  import PrivacyPolicy from "../shared/components/PrivacyPolicy.svelte";
  import TermsOfUse from "../shared/components/TermsOfUse.svelte";
  import Imprint from "../shared/components/Imprint.svelte";

  const GITHUB_REPO_URL = "https://github.com/AlexanderMelde/CheckFastmail/";
  const CHROME_STORE_URL =
    "https://chromewebstore.google.com/detail/gamakacpnkebinhbakpcegdkflmbdcmp/";

  const router = new Router({
    mode: "path",
    defaultRoute: "features",
    basePath: import.meta.env.BASE_URL || "./",
  });

  onDestroy(() => {
    router.destroy();
  });

  const navGroups: NavGroup[] = [
    {
      title: "Project",
      items: [
        { id: "features", label: "Features", icon: "sparkles" },
        { id: "installation", label: "Installation", icon: "download" },
        { id: "develop", label: "Develop", icon: "code" },
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
  groups={navGroups}
  activeId={router.current}
  onselect={(id) => router.navigate(id)}
>
  {#snippet headerActions()}
    <a
      href={CHROME_STORE_URL}
      target="_blank"
      rel="noreferrer noopener"
      title="Available on Chrome Web Store"
      aria-label="Install Checker for Fastmail from Chrome Web Store"
      class="header-btn"
    >
      <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.732A12 12 0 0 0 12 0zm-8.818 6.545a12.022 12.022 0 0 0-.637 5.455c0 4.673 2.668 8.723 6.545 10.732l3.953-6.848a5.454 5.454 0 0 1-5.455-5.455c0-1.488.594-2.839 1.564-3.834L3.182 6.545zm13.636.546a5.454 5.454 0 0 1 2.637 4.909c0 3.012-2.443 5.455-5.455 5.455a5.454 5.454 0 0 1-3.834-1.564l-3.953 6.848A12.001 12.001 0 0 0 12 24c6.627 0 12-5.373 12-12 0-1.923-.453-3.74-1.255-5.354H16.818zM12 8.182a3.818 3.818 0 1 0 0 7.636 3.818 3.818 0 0 0 0-7.636z"/>
      </svg>
    </a>
    <a
      href={GITHUB_REPO_URL}
      target="_blank"
      rel="noreferrer noopener"
      title="View on GitHub"
      aria-label="View Checker for Fastmail repository on GitHub"
      class="header-btn"
    >
      <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
      </svg>
    </a>
  {/snippet}

  {#if router.current === "features"}
    <Features />
  {:else if router.current === "installation"}
    <Installation />
  {:else if router.current === "develop"}
    <Develop />
  {:else if router.current === "privacy"}
    <PrivacyPolicy />
  {:else if router.current === "terms"}
    <TermsOfUse />
  {:else if router.current === "imprint"}
    <Imprint />
  {:else}
    <Features />
  {/if}
</PageShell>
