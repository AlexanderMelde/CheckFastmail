TODOs:
- Open source it
- [x] Add Github Page build actions
- [x] Privacy.md link to site deployment
- re-run code-review
- [x] Add custom domain (check-fastmail.melde.net)
- extract svg icons
- [x] check if generic "google does some analytics for any extension" part is needed in privacy policy (added Platform Provider & Chrome Web Store Telemetry disclosure)
- "not affiliated with fastmail" disclaimer on site and options page legal etc
- Store Submission

Feature Ideas:
- Detect if Read or Write token is set, enable some features like mark-as-read when Write token is set (add lots of test to ensure only the ONE email is marked, and nothing else is written)
- Move "Open in Fastmail" in title bar
- Add Search (All Mail, including read mail)
- Fastmail OAuth
- Link to Fastmail Homepage from Extension rightclick menu (first entry) and from the options page (e.g. a title bar link or "About" Section)
- Appearance / Design options (header, badge and icon color)
- User Icon in Options title bar when logged in
- Support / Logs & Debug Info Page
- Support / Contact us
- Improve Plaintext Mail Rendering (Padding, Line Breaks, Font size etc)

Maintenance Ideas:
- Run Performance Benchmarks
- Run Accessibility Check
- Move Components into a folder each, each with a script, style and test file next to each other
- Remove Tailwind Dependency

Future Expandability:
- Full Compose and Reply functionality
- More write-mode-actions like archive, delete, ...
- Calendar and Contacts integration
- (Multi Account Functionality)
