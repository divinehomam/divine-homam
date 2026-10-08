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

`src/sevas.json` remains the source for the legacy static detail-page generator. The live home page catalog and CMS detail pages use Supabase and are managed at `/admin.html`.

## Puja CMS

The public catalog, `/pooja.html?slug=...` detail pages, and `/admin.html` management screen use Supabase. Apply the migrations in `supabase/migrations/` in filename order. They create and seed the table with all eleven current pujas, then add the optional image gallery (up to five Cloudinary images per puja). Row level security is enabled with no public policies; the site accesses Supabase only through server-side endpoints using the service-role key.

Set these server environment variables for local development and in Vercel Project Settings (Production and Preview):

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
ADMIN_USERNAME=your-admin-name
ADMIN_PASSWORD=use-a-long-unique-password
ADMIN_SESSION_SECRET=use-a-different-random-secret-at-least-32-characters
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-server-only-cloudinary-api-secret
```

For local work, put them in the ignored `.env` file. Never use a `NEXT_PUBLIC_` prefix for the service-role key or Cloudinary API secret. Visit `/admin.html` to sign in and create, edit, or delete catalog entries. Each entry requires its title, Tamil subtitle, badge, short description, three points, package type, and duration. Upload zero to five images through the Cloudinary upload control; the URLs are saved in Supabase, and the detail page displays the gallery. Admin sessions are HttpOnly, SameSite cookies and expire after eight hours.

The **Priests** tab in `/admin.html` manages the homepage's "Meet Our Priests" cards. Apply `supabase/migrations/20261008000000_priests_cms.sql` in the Supabase SQL Editor before using it. Each profile has a name, years of experience, description, and one Cloudinary photo. The public cards load from the `priests` table through `/api/priests`; create, edit, and delete actions use authenticated server endpoints. The Cloudinary credentials in `.env` must authenticate successfully for photo uploads. Deleting a profile removes its database row; its Cloudinary image can be removed separately in Cloudinary.

## Booking requests

The Node server validates requests and saves them privately as JSON in `data/bookings/`. Repeating the same submission uses an idempotency key to avoid duplicates. There is no public endpoint exposing requests. To use another storage directory set `BOOKINGS_DIR`; `HOST` and `PORT` are also configurable.

On Vercel, `/api/bookings` is deployed as a Node.js Function and booking JSON is stored in a **private Vercel Blob store**. Create a Blob store from the Vercel project Storage tab and connect it to the project so `BLOB_READ_WRITE_TOKEN` is available to Production and Preview deployments. Booking details contain personal information and must stay in private storage. For local development, `server.mjs` continues to save records under `data/bookings/`.

## Deploy to Vercel

Import `divinehomam/divine-homam` in Vercel. The included `vercel.json` selects the Other framework preset, runs `npm run build`, and publishes `public/`. The `api/bookings.js` function is deployed with the site. Connect a private Vercel Blob store before accepting bookings; without its `BLOB_READ_WRITE_TOKEN`, submissions return an error. Pushes to the connected Git branch trigger new deployments.

The site does not send emails, process payments, assign priests, or confirm availability. Publish real privacy and booking policies. Source testimonials, certification statements, and ritual safety claims are retained as requested and need the owner's review. The source's first-card photo count is retained; only one photo per ceremony was supplied. The ceremony dropdown in `public/index.html` is the source of truth for the local server's allowlist, while `api/bookings.js` keeps a matching hardcoded copy that must be updated whenever a seva is added or renamed.

## Motion

CSS transitions and IntersectionObserver provide one-time section reveals, image loading fades, focus/hover/press feedback, and accessible menu, FAQ, and confirmation transitions. Hero depth is limited to 1.5 degrees on fine pointers. The supplied `hero_section.mp4` (served as `/assets/hero.mp4`) is directly embedded as a muted, inline, autoplaying loop on phones and desktops, without player controls. It pauses offscreen and in background tabs. Reduced-motion settings disable decorative reveals, tilt, and transitions while the explicitly requested hero video continues to play.

## Verification

```sh
npm run check
npm run test:browser
```

Browser checks require Microsoft Edge at its standard Windows installation location, or `BROWSER_EXECUTABLE` set to a Chromium executable. They launch an isolated server on port 3100, save screenshots and a report in `test-results/`, and write only test booking records there.

`reference/stitch.html` is the untouched export. `brand-spec.md` records the design decisions and source assets. `scripts/import-stitch.mjs` is the one-time import script; rerunning it overwrites `public/index.html` and the Tailwind configuration.
