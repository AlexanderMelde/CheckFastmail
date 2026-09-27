<script lang="ts">
  import { onMount } from "svelte";
  import type { EmailItem } from "../types";
  import { extensionClient } from "../services/extensionClient";
  import Header from "../components/Header.svelte";
  import RefreshButton from "../components/RefreshButton.svelte";
  import SettingsButton from "../components/SettingsButton.svelte";
  import ConnectPrompt from "../components/ConnectPrompt.svelte";
  import InitialLoading from "../components/InitialLoading.svelte";
  import EmailList from "../components/EmailList.svelte";
  import EmailPreview from "../components/EmailPreview.svelte";

  let unreadEmails = $state<EmailItem[]>([]);
  let isLoading = $state(true);
  let hasInitialized = $state(false);
  let errorMsg = $state("");
  let isAuthenticated = $state(true);

  let selectedEmail = $state<EmailItem | null>(null);
  let emailBody = $state<string | null>(null);
  let emailBodyError = $state(false);
  let isPlainText = $state(false);
  let isLoadingBody = $state(false);

  const MIN_LOADING_SPINNER_MS = 300;

  async function fetchEmails() {
    isLoading = true;
    errorMsg = "";

    const startTime = Date.now();
    const finishLoading = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_SPINNER_MS) {
        setTimeout(() => (isLoading = false), MIN_LOADING_SPINNER_MS - elapsed);
      } else {
        isLoading = false;
      }
    };

    const response = await extensionClient.fetchUnread();
    hasInitialized = true;

    if (response.notAuthenticated) {
      isAuthenticated = false;
    } else if (response.error) {
      errorMsg = response.error;
    } else if (response.emails) {
      isAuthenticated = true;
      unreadEmails = response.emails;
      if (unreadEmails.length > 0) {
        const stillSelected =
          selectedEmail &&
          unreadEmails.find((e) => e.id === selectedEmail?.id);
        if (!stillSelected) {
          selectEmail(unreadEmails[0]);
        }
      } else {
        selectedEmail = null;
        emailBody = null;
        emailBodyError = false;
      }
    } else {
      errorMsg =
        "Failed to fetch emails. Please check your connection in Options.";
    }
    finishLoading();
  }

  onMount(() => {
    fetchEmails();

    const unsubscribe = extensionClient.onTokenChanged(() => {
      fetchEmails();
    });

    return unsubscribe;
  });

  function handleRefresh() {
    fetchEmails();
  }

  function openOptions() {
    extensionClient.openOptionsPage();
  }

  async function selectEmail(email: EmailItem) {
    if (selectedEmail?.id === email.id && emailBody !== null && !emailBodyError)
      return;
    if (selectedEmail?.id === email.id && isLoadingBody) return;

    selectedEmail = email;
    emailBody = null;
    emailBodyError = false;
    isPlainText = false;
    isLoadingBody = true;

    const response = await extensionClient.fetchEmailBody(email.id);

    if (selectedEmail && selectedEmail.id === email.id) {
      isLoadingBody = false;
      if (response && response.body !== null) {
        emailBody = response.body;
        emailBodyError = false;
        isPlainText = Boolean(response.isPlainText);
      } else {
        emailBody = response?.error
          ? `Error: ${response.error}`
          : "Could not load email content.";
        emailBodyError = true;
        isPlainText = true;
      }
    }
  }
</script>

<main class="flex flex-col bg-white h-[600px] w-full font-sans text-[14px]">
  <Header>
    {#if isAuthenticated}
      <RefreshButton onclick={handleRefresh} {isLoading} />
    {/if}
    <SettingsButton onclick={openOptions} />
  </Header>

  <div class="flex-1 flex overflow-hidden">
    {#if !isAuthenticated}
      <ConnectPrompt onconnect={openOptions} />
    {:else if !hasInitialized && isLoading}
      <InitialLoading />
    {:else}
      <EmailList
        emails={unreadEmails}
        selectedEmailId={selectedEmail?.id}
        {isLoading}
        {errorMsg}
        onselect={selectEmail}
        onretry={handleRefresh}
      />
      <EmailPreview
        email={selectedEmail}
        body={emailBody}
        {isLoadingBody}
        isBodyError={emailBodyError}
        {isPlainText}
        onretry={() => selectedEmail && selectEmail(selectedEmail)}
      />
    {/if}
  </div>
</main>
