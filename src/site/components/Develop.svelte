<script lang="ts">
  const GITHUB_REPO_URL = "https://github.com/AlexanderMelde/CheckFastmail/";
</script>

<h1 class="text-[19px] font-bold text-slate-900 leading-6 m-0 mb-2">
  Develop & Contribute
</h1>
<p class="text-[13px] text-slate-500 m-0 mb-6">
  Checker for Fastmail is an open-source project licensed under the MIT License.
</p>

<div class="space-y-6 text-[13px] text-slate-700 leading-relaxed max-w-[680px]">
  <section class="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
    <h2 class="text-[15px] font-semibold text-slate-900 m-0">
      Why Contribute?
    </h2>
    <p class="m-0 text-slate-600">
      We believe web extensions that handle personal email should be transparent, verifiable, and strictly privacy-first.
      By building Checker for Fastmail entirely in the open, anyone can inspect the network requests, audit token security,
      and ensure zero analytics or tracking exist.
    </p>
    <p class="m-0 text-slate-600">
      Whether you want to report an issue, suggest improvements, or submit code enhancements, community contributions are warmly appreciated.
    </p>

    <div class="pt-2">
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noreferrer noopener"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-[13px] transition-colors cursor-pointer no-underline"
      >
        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
        <span>View on GitHub</span>
      </a>
    </div>
  </section>

  <div class="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500">
    <p class="m-0">
      Detailed local setup instructions, test commands, and coding guidelines can be found in
      <code class="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono">README.md</code> and
      <code class="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono">DEVELOPMENT.md</code> in the repository.
    </p>
  </div>
</div>
