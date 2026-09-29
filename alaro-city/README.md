# Aláró City — one-page sales site

Static, dependency-free landing page for selling serviced plots in Aláró City (Lekki Free Zone, Lagos).

- `index.html` — the whole page (inline CSS, no build step).
- `images/` — current visuals. Interior/exterior shots of completed homes plus the zone visuals. The `<figure class="shot">` blocks in the gallery section are the swap-in slots for new renderings.

Single call to action throughout: WhatsApp chat to **0813 688 0414** (`https://wa.me/2348136880414`), with a pre-filled first message.

Open `index.html` in a browser, or serve with `npx serve alaro-city`. The CAPI route only runs on Vercel (or `vercel dev`); the page degrades gracefully without it.

The Governor of Lagos site-tour video (YouTube `aeSxqksR91k`) is embedded as social proof in the dark "Proof" section, between the emotional story and the logical case.

## Meta Pixel + Conversions API

Client-side Pixel lives in `index.html`; the server-side CAPI route is `api/meta-capi.js`
(Vercel Node function). Both fire the same event with a shared `event_id`, so Meta
de-duplicates browser and server into one conversion.

**Before launch:**
1. Replace the two `META_PIXEL_ID` strings in `index.html` (the `window.ALARO` config and
   the `<noscript>` fallback) with the real pixel id.
2. Set `META_PIXEL_ID` and `META_CAPI_ACCESS_TOKEN` in Vercel env vars (see `.env.example`).
   Until they are set, the CAPI route accepts requests and no-ops, so nothing breaks.
3. Validate with `META_TEST_EVENT_CODE` in Events Manager → Test Events, then remove it.

Events: `PageView` on load, `Lead` on every WhatsApp CTA click (with the originating
section as `source_section`).

## Outstanding

Three FAQ answers — title, build obligation, resale — carry a visible yellow
`PLACEHOLDER` badge pending the legal pass. Search `class="todo"` and
`<!-- LEGAL PLACEHOLDER -->`; delete the badges and the `.todo` CSS rule once the
wording is confirmed.
