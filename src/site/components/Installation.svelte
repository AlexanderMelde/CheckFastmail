<script lang="ts">
  const CHROME_STORE_URL =
    "https://chromewebstore.google.com/detail/gamakacpnkebinhbakpcegdkflmbdcmp/";
  const GITHUB_REPO_URL = "https://github.com/AlexanderMelde/CheckFastmail/";
</script>

<h1 class="text-[19px] font-bold text-slate-900 leading-6 m-0 mb-2">
  Installation
</h1>
<p class="text-[13px] text-slate-500 m-0 mb-6">
  Install Checker for Fastmail directly in Google Chrome or any Chromium-compatible browser (Brave, Edge, Arc, Opera, Vivaldi).
</p>

<!-- Chrome Web Store Call-to-Action -->
<div class="mb-8 p-6 rounded-xl border border-slate-200 bg-white shadow-xs">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div class="space-y-1">
      <div class="flex items-center gap-2">
        <span class="text-[15px] font-semibold text-slate-900">Chrome Web Store</span>
        <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Official Release
        </span>
      </div>
      <p class="text-[13px] text-slate-600 m-0">
        Automatic updates, sandboxed permissions, and verified package integrity.
      </p>
    </div>

    <a
      href={CHROME_STORE_URL}
      target="_blank"
      rel="noreferrer noopener"
      class="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-lg text-white font-medium text-[13.5px] transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer no-underline shrink-0"
      style="background: linear-gradient(290deg, #49578d 5%, #7934a3 95%);"
    >
      <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.732A12 12 0 0 0 12 0zm-8.818 6.545a12.022 12.022 0 0 0-.637 5.455c0 4.673 2.668 8.723 6.545 10.732l3.953-6.848a5.454 5.454 0 0 1-5.455-5.455c0-1.488.594-2.839 1.564-3.834L3.182 6.545zm13.636.546a5.454 5.454 0 0 1 2.637 4.909c0 3.012-2.443 5.455-5.455 5.455a5.454 5.454 0 0 1-3.834-1.564l-3.953 6.848A12.001 12.001 0 0 0 12 24c6.627 0 12-5.373 12-12 0-1.923-.453-3.74-1.255-5.354H16.818zM12 8.182a3.818 3.818 0 1 0 0 7.636 3.818 3.818 0 0 0 0-7.636z"/>
      </svg>
      <span>Add to Chrome</span>
    </a>
  </div>
</div>

<!-- Setup Steps -->
<div class="space-y-6 text-[13px] text-slate-700 leading-relaxed max-w-[680px]">
  <h2 class="text-[15px] font-semibold text-slate-900 m-0">
    Quick 3-Step Setup
  </h2>

  <ol class="space-y-4 m-0 p-0 list-none">
    <li class="flex gap-3.5 items-start">
      <span class="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-semibold text-xs shrink-0 mt-0.5">
        1
      </span>
      <div>
        <strong class="text-slate-900 block mb-0.5">Install the Extension</strong>
        <p class="m-0 text-slate-600">
          Click <strong>Add to Chrome</strong> above to install Checker for Fastmail from the Chrome Web Store.
        </p>
      </div>
    </li>

    <li class="flex gap-3.5 items-start">
      <span class="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-semibold text-xs shrink-0 mt-0.5">
        2
      </span>
      <div>
        <strong class="text-slate-900 block mb-0.5">Create a Fastmail API Token</strong>
        <p class="m-0 text-slate-600">
          Go to your <a href="https://app.fastmail.com/settings/tokens" target="_blank" rel="noreferrer noopener" class="text-violet-600 hover:text-violet-800 underline">Fastmail API Tokens settings</a> and generate a token with <strong>Read Mail</strong> access.
        </p>
      </div>
    </li>

    <li class="flex gap-3.5 items-start">
      <span class="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-semibold text-xs shrink-0 mt-0.5">
        3
      </span>
      <div>
        <strong class="text-slate-900 block mb-0.5">Connect & Preview</strong>
        <p class="m-0 text-slate-600">
          Open the extension options or click the toolbar icon to enter your token. Your unread badge and email previews will sync immediately.
        </p>
      </div>
    </li>
  </ol>

  <!-- Open Source Subtle Callout -->
  <div class="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
    <span>
      Want to inspect the code or contribute?
    </span>
    <a
      href={GITHUB_REPO_URL}
      target="_blank"
      rel="noreferrer noopener"
      class="text-violet-600 hover:text-violet-800 font-medium inline-flex items-center gap-1 underline"
    >
      <span>Verify source on GitHub</span>
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  </div>
</div>
