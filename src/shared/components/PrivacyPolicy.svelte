<h1 class="text-[19px] font-bold text-slate-900 leading-6 m-0 mb-5">
  Privacy Policy
</h1>

<div class="space-y-6 text-[13px] text-slate-700 leading-relaxed max-w-[680px]">
  <div class="py-2 px-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-[12px]">
    Status: September 2026
  </div>

  <section>
    <h2 class="text-[15px] font-semibold text-slate-900 mb-2">
      Overview & Core Principles
    </h2>
    <p class="mb-3">
      <strong>Checker for Fastmail</strong> is an open-source browser extension designed to provide secure, lightweight access to your Fastmail unread messages. We take the protection of your personal information very seriously.
    </p>
    <p class="m-0 font-medium text-slate-800">
      Our primary principle: Zero external data collection. We operate with zero backend servers, zero telemetry, zero analytics scripts, and zero advertising trackers.
    </p>
  </section>

  <section>
    <h2 class="text-[15px] font-semibold text-slate-900 mb-2">
      Legal Compliance
    </h2>
    <p class="m-0">
      The operator complies with all requirements of European data protection law under the General Data Protection Regulation (GDPR / DSGVO), the German Federal Data Protection Act (BDSG), and the Telecommunications-Digital Services Data Protection Act (TDDDG). Appropriate technical and organizational measures (TOMs) are implemented to protect your data.
    </p>
  </section>

  <section>
    <h2 class="text-[15px] font-semibold text-slate-900 mb-2">
      Data Security & Local Storage
    </h2>
    <ul class="list-disc list-inside space-y-1.5 m-0 pl-1">
      <li>
        <strong>Encrypted Communication:</strong> All network communication is established directly and exclusively between your browser and Fastmail’s official servers (<code class="text-xs bg-slate-100 px-1 py-0.5 rounded">api.fastmail.com</code>) over encrypted TLS/HTTPS.
      </li>
      <li>
        <strong>Token Isolation:</strong> Your Fastmail API token is stored exclusively in your browser’s local storage (<code class="text-xs bg-slate-100 px-1 py-0.5 rounded">chrome.storage.local</code>). It is never synchronized across devices via cloud accounts and never sent to any third party.
      </li>
      <li>
        <strong>Sandbox Isolation:</strong> Email bodies are rendered inside an isolated iframe with a strict Content Security Policy (<code class="text-xs bg-slate-100 px-1 py-0.5 rounded">default-src 'none'</code>) and sandbox flags that strictly disallow script execution and same-origin API access.
      </li>
    </ul>
  </section>

  <section>
    <h2 class="text-[15px] font-semibold text-slate-900 mb-2">
      Collection & Processing of Personal Data
    </h2>
    <p class="mb-2">The extension does <strong>not</strong> collect or process any of the following:</p>
    <ul class="list-disc list-inside space-y-1 mb-3 pl-1 text-slate-600">
      <li>No geolocation data is collected or stored.</li>
      <li>No automated decision-making or profiling under Art. 22 GDPR is performed.</li>
      <li>No analytics, telemetry, or user interaction tracking is conducted.</li>
    </ul>
    <p class="m-0">
      Data processed pursuant to Art. 6(1)(b) GDPR (performance of service): Your Fastmail API token is used strictly to authenticate JMAP requests directly to Fastmail to fetch your unread email counts and previews at your explicit instruction.
    </p>
  </section>

  <section>
    <h2 class="text-[15px] font-semibold text-slate-900 mb-2">
      Your Rights Under the GDPR
    </h2>
    <p class="mb-3">
      Pursuant to Articles 15 to 21 of the GDPR, you have the following rights at any time:
    </p>
    <ul class="list-disc list-inside space-y-1 m-0 pl-1">
      <li><strong>Right of access (Art. 15 GDPR):</strong> Inquire about your processed personal data.</li>
      <li><strong>Right to rectification (Art. 16 GDPR):</strong> Request correction of inaccurate information.</li>
      <li><strong>Right to erasure (Art. 17 GDPR):</strong> Delete your stored credentials at any time by clicking "Disconnect" in the Connection tab, which immediately wipes all stored keys from local storage.</li>
      <li><strong>Right to restriction of processing (Art. 18 GDPR)</strong> and <strong>Right to data portability (Art. 20 GDPR)</strong>.</li>
      <li><strong>Right to object (Art. 21 GDPR):</strong> Object to processing based on legitimate interests.</li>
      <li><strong>Right to lodge a complaint:</strong> You have the right to lodge a complaint with a data protection supervisory authority (e.g., <em>Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg</em>, Germany).</li>
    </ul>
  </section>

  <section>
    <h2 class="text-[15px] font-semibold text-slate-900 mb-2">
      Protection of Minors
    </h2>
    <p class="m-0">
      This extension is directed exclusively to adults. Persons under 18 years of age should not transmit personal data or API tokens without parental consent.
    </p>
  </section>

  <section>
    <h2 class="text-[15px] font-semibold text-slate-900 mb-2">
      Data Controller Contact
    </h2>
    <p class="m-0">
      For questions or inquiries regarding data protection, please contact the controller:
      <br />
      <strong>Alexander Melde</strong> — <a href="mailto:info@melde.net" class="text-violet-600 hover:text-violet-800 underline">info@melde.net</a>
    </p>
  </section>
</div>
