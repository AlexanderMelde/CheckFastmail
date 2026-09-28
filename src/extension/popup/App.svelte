<script lang="ts">
  import { onMount } from "svelte";
  import type { EmailItem } from "../../shared/types";
  import { extensionClient } from "../services/extensionClient";
  import Header from "../../shared/components/Header.svelte";
  import RefreshButton from "./components/RefreshButton.svelte";
  import SettingsButton from "./components/SettingsButton.svelte";
  import ConnectPrompt from "./components/ConnectPrompt.svelte";
  import InitialLoading from "./components/InitialLoading.svelte";
  import InboxZero from "./components/InboxZero.svelte";
  import EmailList from "./components/EmailList.svelte";
  import EmailPreview from "./components/EmailPreview.svelte";

  let unreadEmails = $state<EmailItem[]>([]);
  let totalCount = $state<number | undefined>(undefined);
  let isLoading = $state(true);
  let hasInitialized = $state(false);
  let errorMsg = $state("");
  let isAuthenticated = $state(true);

  let selectedEmail = $state<EmailItem | null>(null);
  let emailBody = $state<string | null>(null);
  let emailBodyError = $state(false);
  let isPlainText = $state(false);
  let isLoadingBody = $state(false);

  // Ensures the user notices that his action is happening
  const MIN_LOADING_SPINNER_MS = 300;

  async function fetchEmails(isSilentRevalidate = false) {
    if (!isSilentRevalidate) {
      isLoading = true;
    }
    errorMsg = "";

    const startTime = Date.now();
    const finishLoading = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_SPINNER_MS && !isSilentRevalidate) {
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
      totalCount =
        typeof response.totalCount === "number"
          ? response.totalCount
          : response.emails.length;
      if (unreadEmails.length > 0) {
        const stillSelected =
          selectedEmail && unreadEmails.find((e) => e.id === selectedEmail?.id);
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
    // SWR Instant Load: render cached emails immediately (0ms) if available
    extensionClient.getCachedUnread().then((cached) => {
      if (cached.emails && cached.emails.length > 0) {
        unreadEmails = cached.emails;
        totalCount = cached.totalCount;
        hasInitialized = true;
        isLoading = false;
        selectEmail(cached.emails[0]);
        // Silently revalidate fresh state in background
        fetchEmails(true);
      } else {
        fetchEmails(false);
      }
    }).catch(() => {
      fetchEmails(false);
    });

    const unsubscribe = extensionClient.onTokenChanged(() => {
      fetchEmails(false);
    });

    return unsubscribe;
  });

  function handleRefresh() {
    fetchEmails(false);
  }

  function openOptions() {
    extensionClient.openOptionsPage();
  }

  let selectionSequenceId = 0;

  async function selectEmail(email: EmailItem) {
    if (selectedEmail?.id === email.id && emailBody !== null && !emailBodyError)
      return;
    if (selectedEmail?.id === email.id && isLoadingBody) return;

    const requestId = ++selectionSequenceId;
    selectedEmail = email;
    emailBody = null;
    emailBodyError = false;
    isPlainText = false;
    isLoadingBody = true;

    const response = await extensionClient.fetchEmailBody(email.id);

    if (requestId === selectionSequenceId) {
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
    {:else if unreadEmails.length === 0}
      <InboxZero {errorMsg} onretry={handleRefresh} />
    {:else}
      <EmailList
        emails={unreadEmails}
        {totalCount}
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
