<p align="center">
  <img src="assets/banner.svg" alt="IntoAEC Demo Booking Page - animated pixel art banner with a crane building a tower" width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/PageSpeed-100-0CCE6B?style=flat-square" alt="PageSpeed 100">
  <img src="https://img.shields.io/badge/Core%20Web%20Vitals-all%20green-0CCE6B?style=flat-square" alt="Core Web Vitals all green">
  <img src="https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JS-0066CC?style=flat-square" alt="HTML, CSS and JS">
  <img src="https://img.shields.io/badge/build%20step-none-181C39?style=flat-square" alt="No build step">
  <img src="https://img.shields.io/badge/GTM-ready-19D3C5?style=flat-square" alt="GTM ready">
</p>

<p align="center">
  A fast, dependency-free recreation of the <a href="https://intoaec.ai/discovery-call/">IntoAEC Discovery Call</a> page,
  built to score 90+ on PageSpeed and keep the booking calendar out of the critical path.
</p>

<p align="center"><img src="assets/divider.svg" alt="" width="100%"></p>

## How it works

The expensive part of the original page is the TidyCal booking widget. Here it is loaded **after the page has finished loading**, in the background, so it never competes with the initial render.

<p align="center">
  <img src="assets/flow.svg" alt="Step 1: the page loads fast. Step 2: the visitor clicks Book a Demo. Step 3: the TidyCal calendar loads." width="100%">
</p>

1. **The page loads fast.** Only HTML, one stylesheet and one small script. No third-party scripts in the initial load.
2. **TidyCal preloads in the background.** Once the page has finished loading and the browser is idle, the TidyCal embed is loaded out of sight (hovering or tapping the button starts it sooner). Clicking the button swaps the CTA card for the calendar and pushes a `book_demo_open` event to the dataLayer. If the calendar isn't ready yet, a "Loading calendar…" message shows, and after 8 seconds it offers a link to the TidyCal booking page.

If the script fails to load, the card shows an error with a *Try Again* button and a link to the TidyCal booking page. The button is a normal link when JavaScript is off. (The diagram above predates the background preload, so its step 3 now happens before the click.)

<p align="center"><img src="assets/divider.svg" alt="" width="100%"></p>

## Performance

<p align="center">
  <img src="assets/pagespeed.svg" alt="Lighthouse mobile: performance 100, FCP 1.1s, LCP 1.6s, TBT 0ms, CLS 0 - all green" width="100%">
</p>

| Metric | Before | After (mobile) | After (desktop) |
|---|---|---|---|
| **Performance score** | 90 | **100** | **100** |
| First Contentful Paint | 2.6 s | 0.9 - 1.1 s | 0.2 s |
| Largest Contentful Paint | 2.7 s | 1.6 s | 0.4 s |
| Total Blocking Time | 0 ms | 0 - 30 ms | 0 ms |
| Cumulative Layout Shift | 0 | 0 | 0 |

> Measured locally with Lighthouse 12 (mobile and desktop presets) against a local static server. Re-run PageSpeed Insights on the live URL to confirm; hosting and any tags added in GTM will move the numbers a little.

**What made the difference**

- **Self-hosted Poppins** (Latin subset, 4 weights, ~8 KB each) preloaded from `fonts/`, instead of waiting on Google Fonts.
- **Metric-matched fallback font**, so text does not jump when Poppins swaps in (CLS stays at 0).
- **Right-sized WebP images** in `images/opt/` (about 53 KB total, down from about 215 KB), each with explicit `width` and `height`.
- **Lazy loading** for everything below the first screen; the header logo gets `fetchpriority="high"`.
- **TidyCal in the background after page load**, not during it.
- **GTM that stays quiet** until a real container ID is set.

<p align="center"><img src="assets/divider.svg" alt="" width="100%"></p>

## Quick start

No install and no build step. Open `index.html` in a browser, or serve the folder:

```bash
npx http-server . -p 8080
# then open http://localhost:8080
```

TidyCal and Google Tag Manager need an internet connection to load.

## Configuration

### Google Tag Manager

The container ID appears in **two places** in `index.html`:

| Where | What it is |
|---|---|
| `<head>` script | The GTM loader |
| `<noscript>` right after `<body>` | Fallback for visitors without JavaScript |

**GTM is deferred for speed.** GA4 and Clarity (loaded through the container) add about 330 KB of JavaScript, which cut the mobile PageSpeed score to about 65. The loader now injects GTM on the visitor's first interaction (scroll, tap, key press or mouse move), or 5 seconds after the page loads if they do nothing. The `dataLayer` exists from the start, so events pushed earlier are queued and replayed when GTM loads.

Trade-offs: visitors who leave within 5 seconds without interacting are not tracked, and PageSpeed's lab test no longer includes the tracking scripts. To track earlier, lower the `5000` timeout in the `<head>` script (the score drops as it gets lower).

**dataLayer events** you can use as *Custom Event* triggers:

| Event | Fires when |
|---|---|
| `book_demo_open` | The visitor opens the TidyCal calendar |
| `book_demo_loaded` | The calendar is ready (`load_ms` = time since the preload started) |
| `book_demo_slow` | The calendar was still not ready 8 seconds after the visitor opened it |
| `newsletter_signup` | A valid email is submitted in the newsletter form |

`book_demo_open` means the calendar was opened, not that a booking was completed. To track completed bookings, use a thank-you redirect or TidyCal's own integrations.

### MailerLite newsletter

The newsletter form posts to `/api/subscribe` (`api/subscribe.js`, a Vercel serverless function), which adds the email to a MailerLite group. The API key stays on the server and is never in the page.

Set these in Vercel > Project > Settings > Environment Variables, then redeploy:

| Variable | What it is |
|---|---|
| `MAILERLITE_API_KEY` | MailerLite API token |
| `MAILERLITE_GROUP_ID` | Numeric ID of the group new subscribers go into |

If either is missing, the form shows an error and sends nothing. `newsletter_signup` only fires after MailerLite accepts the email. To test locally, run `vercel dev` (opening `index.html` from disk can't reach `/api/subscribe`).

### TidyCal booking link

The calendar path is set in two files:

- `script.js` - `data-path="book-a-demo/discovery-call"` in the `loadBooking` function
- `index.html` - the fallback `href` on the `#loadBooking` button

### Links

All navigation, footer, social and app-store links point to the live IntoAEC site. The source list is in [`Links.md`](Links.md).

<p align="center"><img src="assets/divider.svg" alt="" width="100%"></p>

## Project structure

```text
.
├── index.html          the page (GTM, nav, hero, booking CTA, newsletter, footer)
├── styles.css          all styles, including @font-face for Poppins
├── script.js           mobile nav, TidyCal background loader, accordions, dataLayer events
├── fonts/              Poppins woff2 files (Latin subset)
├── images/
│   └── opt/            optimised WebP images actually used by the page
├── assets/             animated pixel-art SVGs used in this README
├── tools/
│   └── generate-art.js generator for the files in assets/
└── Links.md            reference list of the external links used on the page
```

## About the pixel art

The banner, flow diagram, scoreboard and runner above are hand-built SVGs with CSS animations: a 5x7 pixel font, stepped timing for a retro feel, and no JavaScript. They play inside a normal GitHub `<img>` tag.

- Animations respect `prefers-reduced-motion` and show a static frame instead.
- To tweak colours, text or timing, edit `tools/generate-art.js` and run:

```bash
node tools/generate-art.js
```

<p align="center"><img src="assets/divider.svg" alt="" width="100%"></p>

<p align="center">
  <sub>Content and branding &copy; Siara Tech Solutions PTE LTD (IntoAEC). This repository is a performance-focused recreation of the public discovery call page.</sub>
</p>
