# Divine Homam

Source: Stitch project 12420116847835535034, screen 016759d249054b1b81897b00eb163bf5. Original export is preserved in reference/stitch.html.

## Design read

Build from the supplied design, followed by motion refinement that preserves its content and ceremony request workflow. Audience: families arranging Tamil Nadu Vedic ceremonies. Warm, devotional, calm; usable on phones and laptops.

Variance 2/10: preserve section order and grids. Motion 3/10: short reveals and restrained depth. Density 5/10: preserve all existing copy. Asset dependence 8/10: use supplied ritual images and logo. Fidelity 10/10: preserve Stitch tokens and Tamil text.

## System

- Ivory #FFFDF7, sandalwood #FDF4E3, vermilion #991B1B, primary #760009, brass #CA8A04, leaf green #005B27.
- Prefer locally installed Chinatron Regular for English headings, with Playfair Display as its fallback. Keep Plus Jakarta Sans for body copy and preserve Noto Serif Tamil accents. Chinatron is registered as a local system-font alias; it is not bundled because no font file or Windows font registration was found on the development machine.
- 4/8px spacing rhythm; 1280px container. Soft 4–8px corners with fine brass borders.
- Warm low-opacity shadows; no heavy glass effects or decorative particles.
- Motion: 160ms feedback, 240ms overlays, 520ms one-time reveals; cubic-bezier(.22,1,.36,1). Maximum hero tilt 1.5 degrees; no tilt on touchscreens or reduced motion.
- Hero provides narrative focus; catalog remains legible and stable; form provides direct feedback.

## Assets

Logo: public/assets/2ccbd3bd79574693815c8369c836bcad.svg. Ritual photographs: public/assets/*.png, downloaded from the matching Stitch assets. Hero footage: user-supplied hero_section.mp4, copied into public/assets/hero.mp4. Original URLs and titles: stitch-assets.json.
