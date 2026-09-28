<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { PopupState } from "./popupState.svelte";
  import Header from "../../shared/components/Header.svelte";
  import RefreshButton from "./components/RefreshButton.svelte";
  import SettingsButton from "./components/SettingsButton.svelte";
  import ConnectPrompt from "./components/ConnectPrompt.svelte";
  import InitialLoading from "./components/InitialLoading.svelte";
  import InboxZero from "./components/InboxZero.svelte";
  import EmailList from "./components/EmailList.svelte";
  import EmailPreview from "./components/EmailPreview.svelte";

  const state = new PopupState();

  onMount(() => {
    state.init();
  });

  onDestroy(() => {
    state.destroy();
  });
</script>

<main class="flex flex-col bg-white h-[600px] w-full font-sans text-[14px]">
  <Header>
    {#if state.isAuthenticated}
      <RefreshButton onclick={() => state.refresh()} isLoading={state.isLoading} />
    {/if}
    <SettingsButton onclick={() => state.openOptions()} />
  </Header>

  <div class="flex-1 flex overflow-hidden">
    {#if !state.isAuthenticated}
      <ConnectPrompt onconnect={() => state.openOptions()} />
    {:else if !state.hasInitialized && state.isLoading}
      <InitialLoading />
    {:else if state.unreadEmails.length === 0}
      <InboxZero errorMsg={state.errorMsg} onretry={() => state.refresh()} />
    {:else}
      <EmailList
        emails={state.unreadEmails}
        totalCount={state.totalCount}
        selectedEmailId={state.selectedEmail?.id}
        isLoading={state.isLoading}
        errorMsg={state.errorMsg}
        onselect={(email) => state.selectEmail(email)}
        onretry={() => state.refresh()}
      />
      <EmailPreview
        email={state.selectedEmail}
        body={state.emailBody}
        isLoadingBody={state.isLoadingBody}
        isBodyError={state.emailBodyError}
        isPlainText={state.isPlainText}
        onretry={() => state.selectedEmail && state.selectEmail(state.selectedEmail)}
      />
    {/if}
  </div>
</main>
