# IntoAEC Demo Booking Clone

Static, no-build recreation of intoaec.ai/discovery-call. Performance is the
acceptance bar: PageSpeed 100 must survive any change.

## Commands
- Serve: `npx http-server . -p 8080`
- Test newsletter (`/api/subscribe`): `vercel dev` — opening index.html via file:// cannot reach it
- Regenerate README pixel-art SVGs: `node tools/generate-art.js`
- No lint/test/typecheck exists — verify in a browser at mobile + desktop widths

## Ground rules (easy to break by accident)
- No third-party scripts in the initial page load. TidyCal's embed.js is injected
  on first interaction or 6s idle (script.js); GTM on first interaction or 5s
  (inline head script, container GTM-TV74XPLQ in two places in index.html).
  Never load TidyCal/GTM eagerly or add CDN scripts.
- Fonts: self-hosted Poppins only (fonts/, latin subset, metric-matched fallback).
  No Google Fonts.
- Colors: page background is `--bg:#FFFFFF`. Topbar, mega-menu hover and footer
  are pinned to explicit `#F4F8FD` — do not point them at `var(--bg)`.
- Mobile nav breakpoint is 1100px, hardcoded in BOTH script.js (`isMobileNav`)
  and styles.css. Change both together.
- Booking path lives in index.html: `data-path="book-a-demo/discovery-call"`.
- All nav/footer links point at live intoaec.ai (README's Links.md is missing;
  treat index.html as the source).
- .env.local is git-tracked and holds MailerLite vars for `vercel dev`.
  Never print its values.

## dataLayer events
`book_demo_loaded`, `book_demo_slow`, `newsletter_signup`.
(`book_demo_open` was removed with the CTA.)

## OpenCode
opencode.json registers the TidyCal MCP (remote, OAuth). Run
`opencode mcp auth tidycal` if prompted; tools only load in new sessions.

## Known issues (backlog, Oct 2026)
- Review rating/text faded and clipped in the booking widget
- Booking widget background differs between production and demo
- Product-page label styling inconsistent ("2D Takeoff — Powered by Zyra AI"
  has blue background, "Client Management" has none)
- Calendar month switching is slow

## Session resume
- opencode -s ses_e97e36f57ffex16UZekARPO23y
- claude --resume 6be74bbb-74b3-4bb9-b414-fe4bbd7074b9
