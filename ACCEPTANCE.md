# Browser acceptance

Tested in headless Microsoft Edge 154 on the local Node server. The working preview runs at http://127.0.0.1:3000; automated checks use an isolated server on port 3100 and separate test records.

## Results

| Layout | Viewport | Result |
|---|---|---|
| Desktop | 1440 × 900 | Passed |
| Laptop | 1280 × 720 | Passed |
| Tablet | 768 × 1024 | Passed |
| Mobile | 390 × 844 | Passed after focus repair |
| Small mobile | 360 × 800 | Passed |

- All local images loaded; no horizontal overflow or browser runtime errors were observed.
- All four category filters and all eleven ceremony-to-form links worked.
- Section reveals completed during scrolling. Muted hero video autoplayed inline and looped on desktop and mobile without player controls. It paused offscreen and in background tabs. Reduced-motion users saw the static poster without downloading the video.
- Menu opening/closing, anchor navigation, focus containment, Escape, and focus restoration passed on mobile.
- FAQ transitions opened one answer at a time and exposed the correct expanded state.
- Reduced motion disabled decorative animation while keeping the muted, requested hero video playing; all page content and navigation remained available.
- A failed submission displayed an error and retained form values. Retrying saved a pending request and displayed its reference.
- Server checks confirmed phone normalization, duplicate prevention, rejection of past dates, and inaccessible private booking files.
- Layout shift measured 0 on mobile and approximately 0.013–0.017 on larger layouts during initial loading and the scroll pass.

## Repair and evidence

The first mobile keyboard pass found that Tab could leave the navigation dialog at its final link. Added explicit focus wrapping. After enlarging the hero and enabling muted autoplay on mobile and desktop, reran the desktop, mobile, and small mobile checks successfully.

Screenshots were visually inspected for the desktop hero/catalog and mobile hero/menu/catalog/FAQ/booking error/confirmation. Evidence is in `test-results/`; the JSON report contains the latest desktop and mobile hero playback run. Earlier laptop and tablet screenshots remain in that directory.

`npm run build` and `npm run check` passed. This verifies the local implementation; live coordinator notifications, real contact details, production storage, and policies are not configured. No external WhatsApp messages or phone calls were sent.
