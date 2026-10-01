# Divine Homam — Tamil Homam Booking

Implementation of the supplied Stitch project, preserving the ceremony catalog, bilingual copy, design tokens, and booking request workflow.

English headings prefer the locally installed `Chinatron Regular` / `ChinatronRegualar` font and fall back to Playfair Display. The font file was not present in the development machine's Windows font folders or font registry, so it is resolved locally on the machine viewing the site and is not bundled. Plus Jakarta Sans remains the body font, with the original Tamil typography preserved.

## Run

Requires Node.js 20+.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. `npm run build` compiles Tailwind locally; `npm start` serves the built site. No runtime framework or animation dependency is required.

Seva page content is maintained in `src/sevas.json`. `npm run build` generates one page per seva under `public/sevas/` and adds the matching “View details” links to the home page. Each page reserves four labeled photo slots for ceremony images.

## Booking requests

The Node server validates requests and saves them privately as JSON in `data/bookings/`. Repeating the same submission uses an idempotency key to avoid duplicates. There is no public endpoint exposing requests. To use another storage directory set `BOOKINGS_DIR`; `HOST` and `PORT` are also configurable.

On Vercel, `/api/bookings` is deployed as a Node.js Function and booking JSON is stored in a **private Vercel Blob store**. Create a Blob store from the Vercel project Storage tab and connect it to the project so `BLOB_READ_WRITE_TOKEN` is available to Production and Preview deployments. Booking details contain personal information and must stay in private storage. For local development, `server.mjs` continues to save records under `data/bookings/`.

## Deploy to Vercel

Import `divinehomam/divine-homam` in Vercel. The included `vercel.json` selects the Other framework preset, runs `npm run build`, and publishes `public/`. The `api/bookings.js` function is deployed with the site. Connect a private Vercel Blob store before accepting bookings; without its `BLOB_READ_WRITE_TOKEN`, submissions return an error. Pushes to the connected Git branch trigger new deployments.

The site does not send emails, process payments, assign priests, or confirm availability. Publish real privacy and booking policies. Source testimonials, certification statements, and ritual safety claims are retained as requested and need the owner's review. The source's first-card photo count is retained; only one photo per ceremony was supplied.

## Motion

CSS transitions and IntersectionObserver provide one-time section reveals, image loading fades, focus/hover/press feedback, and accessible menu, FAQ, and confirmation transitions. Hero depth is limited to 1.5 degrees on fine pointers. The supplied `hero_section.mp4` (served as `/assets/hero.mp4`) is directly embedded as a muted, inline, autoplaying loop on phones and desktops, without player controls. It pauses offscreen and in background tabs. Reduced-motion settings disable decorative reveals, tilt, and transitions while the explicitly requested hero video continues to play.

## Verification

```sh
npm run check
npm run test:browser
```

Browser checks require Microsoft Edge at its standard Windows installation location, or `BROWSER_EXECUTABLE` set to a Chromium executable. They launch an isolated server on port 3100, save screenshots and a report in `test-results/`, and write only test booking records there.

`reference/stitch.html` is the untouched export. `brand-spec.md` records the design decisions and source assets. `scripts/import-stitch.mjs` is the one-time import script; rerunning it overwrites `public/index.html` and the Tailwind configuration.
