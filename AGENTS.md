<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Almedalskompassen migration
- Sign-in lives at /signin and reads the static site's saved language preference after hydration; legacy sign-in URLs redirect with query/hash preserved so bookmarks and pending email links remain usable.
- The static contact page reuses arrangor-start.css and submits only validated contact fields to a dedicated fixed-recipient server route; fail closed until managed sending is configured so unsent email is never acknowledged.
- The site is the original static HTML/CSS/JS in `public/`, served unchanged; do not rewrite it in React (migration must stay faithful to the source).
- `src/routes/api/*` keep the original API URLs and JSON contracts; until verified auth exists they answer in signed-out state and refuse writes.
- Files over 10 MB go to lovable-assets (pointers in `migration-archive/`), not the repo.
- Migration status lives in `MIGRATION-STATUS.md`; update it with each phase.
- Static pages authenticate via HttpOnly cookies set by `/api/session` after server-side verification (`src/lib/api-session.ts`); never trust headers or client ids.
- Roles live in `user_roles`; pre-approved emails in `role_grants_by_email` are applied by trigger only for confirmed emails.
- Shared static mobile navigation lives in workspace-mobile-menu.js/css, loaded through languages.js; keep desktop navigation and existing bottom navigation independent.
- Frequently edited static assets (workspace-mobile-menu.*, languages.js, site-chrome.css, branding.css, organizer-links.js) are referenced with a `?v=N` version query in the HTML; bump N in the HTML when the asset changes so mobile browsers fetch the new file instead of a cached copy.
- Organizer-name auto-linking is allowlisted to explicit article bylines and event organizer-name fields; exclude headings, site chrome and brand identity so general copy never becomes a profile link. These explicit bylines may sit inside data-no-translate article containers because that attribute controls translation, not profile navigation.
- Organizer access comes from `organizer_accounts` (admin-created at /admin/arrangorer, one year, forced password change via /arrangor-nytt-losenord); card checkout is disabled because organizers are invoiced.
- Organizer landing status requests have a finite timeout and usable sign-in links independent of that request, so unavailable status checks cannot block login.
- Public organizer information pages reuse arrangor-start.css and organizer-information.css; the interactive planning workspace is kept separately in arrangor-planera.html and initializes only after verified organizer status, so public previews stay non-interactive without removing existing tools.
- Participant networking uses separate structured records and an atomic user-authenticated command RPC; private week profiles and favorites retain owner-only access to prevent incidental disclosure.
- The static visitor directory shares deterministic matching/filter rules in network-directory.js; advanced filtering scans server-paginated visible records before client pagination, and synthetic layout examples are admin-only, read-only, and never inserted into participant storage.
- Networking is a closed pilot gated by database admin/tester access; never broaden enrollment before the privacy launch requirements are resolved.
- Load networking.js before week.js and mobile navigation on schema.html so the new static tab participates in existing keyboard and menu initialization.
- Persist networking quotas, consent evidence and suspensions separately from deletable profile/conversation content so deletion cannot bypass safety rules.
- The personal week form owns shared profile fields; networking previews an explicit projection before consent, while private goals remain separate. This avoids duplicate forms without automatic disclosure.
- Profile photos are re-encoded to JPEG in the browser and stored owner-only; other participants retrieve them only through a verified visible, unblocked network-profile read. This strips metadata and keeps private photos private.
- Organizer package content (profile, sponsored articles, featured events) is written only through `/api/organizer-content` with the server verifying the session and event ownership against the public program files; quotas are enforced in both the API and a DB trigger so the client cannot exceed its package.
- Published sponsored content reaches static pages via public `/api/sponsored`; `program-data.js` marks featured events as `sponsoredDemo` so existing pink styling and sort-first logic apply without touching program data.

- Program popups and expanded schedule events share event-content.js/css so full event information and typography remain identical.
- Public program navigation targets the homepage anchor; program-anchor.js forwards filters and event references to the embedded renderer and program-redirect.js guards standalone access, so old bookmarks keep working without a second program page.
- Vite's development middleware serves public/index.html unchanged before TanStack normalizes it to /, preventing a self-redirect in preview; production retains the original static asset.
- Organizer event ownership = admin manual include, else name/alias match unless admin excluded (`ownsEvent` in organizer-packages.ts); program data stays untouched so overrides live in organizer_event_links.
