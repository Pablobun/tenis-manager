---
name: doesntbreak
description: Build UI that holds up on small screens, not just desktop. Use this skill whenever you are writing or reviewing HTML/CSS/React/Tailwind layout code, building any web page, component, landing page, dashboard, or form, OR when the user reports that something "breaks on mobile," "looks fine on desktop but not phone," has horizontal scroll, overflow, squished/overlapping elements, tiny tap targets, or text that doesn't fit. Trigger this even when the user doesn't say the word "responsive". Any time you generate front-end layout, apply these rules by default so the output works from 320px up.
---

# doesntbreak

The most common failure in vibe-coded UI is layout that looks polished on a 1440px desktop and falls apart on a 375px phone: horizontal scrollbars, overlapping elements, text overflowing its container, tap targets too small to hit. This skill bakes in the discipline that prevents that.

Apply these rules by default whenever you write layout code. Don't wait to be asked for "responsive". Assume the smallest reasonable screen is a first-class target.

## The core mindset: mobile-first

Write base styles for the smallest screen, then layer complexity upward with `min-width` media queries. This is the single highest-leverage habit. Desktop-first (writing for wide screens, then patching with `max-width` overrides) is how most broken mobile layouts happen. The patches pile up and conflict.

In Tailwind this is the default: unprefixed utilities are mobile, `md:`/`lg:` add upward. Write `class="flex-col md:flex-row"`, never the reverse.

## The non-negotiables

1. No fixed pixel widths on layout containers. Use `%`, `rem`, `vw`, `min()`, `max()`, `clamp()`. Cap with `width: min(100%, 1200px)` instead of `width: 1200px`. A fixed-width element wider than the viewport is the #1 cause of horizontal scroll.
2. Let flex and grid reflow automatically. Prefer `flex-wrap: wrap` and `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))` over hand-written breakpoints.
3. Avoid fixed heights on content. Use `min-height` so containers grow with content instead of clipping.
4. Constrain media. `img, video, svg { max-width: 100%; height: auto; }` globally.
5. Touch targets ≥ 44×44px. Small icon buttons need padding to reach 44px.
6. Min font size 16px on inputs: iOS Safari zooms the page when a focused input is below 16px.
7. Prevent text overflow. Long unbroken strings force horizontal scroll. Use `overflow-wrap: break-word` (and `min-width: 0` on flex children).
8. Use `dvh`/`svh` for full-height sections, not `vh`. On mobile `100vh` is the *large* viewport height: taller than the visible area, because the browser's address bar overlaps the bottom. A `100vh` hero clips its content and pushes buttons below the fold. `100dvh` tracks the actual visible height; `100svh` is the stable smallest-visible height. Pair with `min-height`, not `height`.
9. Wide content scrolls in its own container, not the page. Tables, `<pre>`, and code blocks have intrinsic widths that ignore the viewport: wrap each in an element with `overflow-x: auto` so only that element scrolls. A scrollbar on one wide table is fine; a page-level horizontal scrollbar is a bug.

## Test at the real failure points

Check the layout at: 320px (smallest phones), 375px/390px (common phones), 768px (the awkward tablet middle), long content (40-char words, 3-line headings, 100-item lists), full-height sections (the hero must not be clipped by the mobile address bar), and horizontal overflow (there should be NO horizontal scroll at any width unless deliberate).

To hunt overflow: `* { outline: 1px solid red; }`. The element poking past the edge is the culprit. `overflow-x: hidden` only hides the symptom; fix the actual oversized element.

## When reviewing existing code

Scan for these in order: fixed px `width:` on containers → `min(100%, Npx)`; flex rows without `flex-wrap: wrap`; flex/grid children without `min-width: 0`; desktop-first `max-width` queries → invert to mobile-first; fixed heights → `min-height`; unconstrained images; absolute positioning with px offsets; `100vh` on full-height sections → `100dvh`/`svh`; wide tables/`<pre>`/code blocks without an `overflow-x: auto` wrapper.

For detailed mechanics, the flexbox `min-width: 0` trap, `clamp()` typography, container queries, mobile viewport-height units (`dvh`/`svh`), safe-area insets, contained-scroll patterns for wide content, a Tailwind cheat sheet, and a full annotated example, read `references/patterns.md`.

## A note on output

When you generate a layout, briefly state the responsive choices you made (e.g. "stacks to one column below 768px, fluid max-width container, images capped at 100%") so the user knows the behavior. One or two sentences, don't lecture.
