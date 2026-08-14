# Responsive layout patterns

The mechanics behind the `doesntbreak` rules. Every snippet is mobile-first and copy-pasteable. Read the rule, then the example.

## 1. The flexbox `min-width: 0` trap

Flex items have `min-width: auto` by default, which means a flex item refuses to shrink below the intrinsic size of its content. A long URL, a `<pre>` block, a long word, or a nested flex row will push the item (and the whole row) wider than the viewport, producing horizontal scroll.

```css
/* Broken: .body won't shrink below its content, so a long string overflows */
.row {
  display: flex;
  gap: 1rem;
}
```

```css
/* Fixed: allow the item to shrink past its content width */
.row > .body {
  min-width: 0;
}
```

This is the single most common "I have no idea where this scrollbar comes from" cause once a layout uses flex. The same trap applies to grid items, where the default minimum also resolves to the content size. Use `minmax(0, 1fr)` instead of `1fr`:

```css
/* Broken: 1fr tracks won't shrink below content */
.grid { display: grid; grid-template-columns: 1fr 1fr; }

/* Fixed */
.grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
```

## 2. Fluid typography with `clamp()`

`clamp(MIN, PREFERRED, MAX)` returns `PREFERRED`, but never less than `MIN` or more than `MAX`. It replaces a stack of breakpoint font-size overrides with one line that scales smoothly:

```css
h1 { font-size: clamp(1.75rem, 5vw + 1rem, 3.5rem); }
```

- `1.75rem`: the floor. The heading never gets smaller than this on tiny screens.
- `5vw + 1rem`: the preferred, viewport-relative value that grows as the screen widens.
- `3.5rem`: the ceiling. The heading stops growing on large screens so it doesn't get absurd.

Use `vw + rem`, not pure `vw`, for the preferred value. A purely viewport-based font size ignores the user's root font-size preference and undermines browser zoom: bad for accessibility. The `rem` term ties part of the value to the root font size, so when a user bumps their default font size or zooms, the text still responds.

## 3. Fluid spacing and the fluid container

The same `clamp()` idea gives you section rhythm that tightens on phones and opens up on desktop, with no breakpoints:

```css
section { padding-block: clamp(2rem, 8vw, 6rem); }
```

For the page-width wrapper, use a single `min()` rule:

```css
.container {
  width: min(100% - 2rem, 1200px);
  margin-inline: auto;
}
```

`min()` picks the smaller of "the viewport minus a 1rem gutter on each side" and "1200px". On phones you get full width minus comfortable gutters; on desktop you get a centered 1200px column. This is cleaner than `max-width: 1200px; padding-inline: 1rem` because the gutter is baked into the width. The element can never exceed the viewport, and you don't have to reason about `box-sizing` interactions between width and padding.

## 4. Auto-responsive grids without media queries

Let the grid decide how many columns fit instead of writing breakpoints:

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}
```

Each track is at least `280px` and at most `1fr`. The grid packs as many `280px+` columns as fit, then stretches them to share the row. One column on a phone, four on a desktop, automatically.

**auto-fit vs auto-fill:** `auto-fit` collapses empty tracks to zero width, so the items present stretch to fill the row. `auto-fill` keeps empty phantom tracks, so a single item stays its minimum width with empty space beside it. For card grids you almost always want `auto-fit`.

**The narrow-container gotcha:** `minmax(280px, 1fr)` has a hard `280px` minimum, so if the container is ever narrower than 280px the track overflows. Cap the minimum at the container width:

```css
.cards {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
}
```

`min(100%, 280px)` is `280px` normally, but drops to `100%` when the container is smaller: no overflow.

## 5. Container queries

Media queries respond to the viewport. Container queries respond to the size of an element's own container, which is what you actually want for reusable components. The same card should lay out differently in a narrow sidebar than at full width, regardless of the viewport.

```css
.card-wrap {
  container-type: inline-size;
}

/* Applies when .card-wrap (the nearest container ancestor) is >= 400px wide */
@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 8rem 1fr;
    gap: 1rem;
  }
}
```

`container-type: inline-size` makes an element a query container measured along the inline axis (width, in horizontal writing modes). Children then query it with `@container`. Drop the same component in a sidebar and a main column and each adapts to the space it's actually given, something a viewport media query can't do.

## 6. Mobile viewport height: dvh, svh, lvh

`100vh` does not mean "the height you can see" on mobile. It equals the *large* viewport (the height with the browser's address bar retracted) so a `min-height: 100vh` hero is taller than the visible area while the bar is showing. The result: the bottom of the section (often the primary button) sits under the address bar, below the fold, until the user scrolls.

```css
/* Broken: ~60-100px of the hero is hidden behind the mobile browser chrome */
.hero { min-height: 100vh; }

/* Fixed: dvh tracks the *dynamic* visible height as the bar shows/hides */
.hero { min-height: 100dvh; }
```

The three viewport-relative height units:

- `lvh`: **large**: viewport with browser UI retracted. Identical to the classic `100vh`. Tallest.
- `svh`: **small**: viewport with browser UI expanded (address bar visible). Shortest; always fully visible.
- `dvh`: **dynamic**: whatever is visible right now. Updates as the bar shows and hides.

Use `dvh` for full-height sections so nothing is clipped. If the reflow as the address bar animates bothers you, use `svh` for a height that's stable and always fully on screen (it just leaves a little extra space when the bar is hidden). Avoid `vh`/`lvh` for content that must be visible. Always pair with `min-height`, not `height`, so the section can still grow with content.

Provide a fallback for older browsers by declaring `vh` first, then overriding:

```css
.hero {
  min-height: 100vh;   /* fallback for browsers without dvh */
  min-height: 100dvh;  /* modern browsers use this */
}
```

## 7. Safe-area insets for notched phones

On notched/rounded devices, content can slide under the notch, the home indicator, or rounded corners. First opt in so the page draws edge-to-edge:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

`viewport-fit=cover` is required. Without it the `env()` insets below resolve to `0`. Then pad by the inset, using `max()` so you keep a sensible minimum on devices with no notch (where the inset is `0`):

```css
.app-bar {
  padding-top: max(1rem, env(safe-area-inset-top));
  padding-left: max(1rem, env(safe-area-inset-left));
  padding-right: max(1rem, env(safe-area-inset-right));
}

.bottom-nav {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
```

## 8. Common overflow causes, ranked

When there's an unexplained horizontal scrollbar, suspect these in order:

1. **A fixed-width element wider than the viewport**: `width: 1200px` on a container. Cap it: `width: min(100%, 1200px)`.
2. **A flex/grid child missing `min-width: 0`**: see section 1.
3. **A long unbroken string**: a URL, hash, or token with no spaces. Add `overflow-wrap: break-word;` (and `min-width: 0` on the flex parent).
4. **Wide content with intrinsic width**: tables, `<pre>`, code blocks. Contain the scroll (see section 9).
5. **Negative margins**: `margin-left: -2rem` with nothing constraining the right edge.
6. **`100vw`**: `100vw` includes the scrollbar's width, so `width: 100vw` is a few pixels wider than the visible area whenever a vertical scrollbar is present. Use `width: 100%`.
7. **Off-canvas absolutely-positioned elements**: a decorative element at `right: -120px` or a drawer parked off-screen without `overflow` clipping its container.

To find the culprit fast, outline everything and look for the box poking past the edge:

```css
* { outline: 1px solid red; }
```

Use `outline`, not `border`. Outline doesn't affect layout, so it won't shift anything while you debug. Note that `overflow-x: hidden` only hides the symptom; it leaves the oversized element in place and can clip legitimate content. Find and fix the actual element instead. It also has a side effect: setting `overflow` on one axis makes the other axis compute to `auto` rather than `visible`, which turns the element into a scroll container and breaks `position: sticky` on its descendants.

## 9. Wide content: tables, `<pre>`, and code blocks

Tables, `<pre>`, and code blocks have an intrinsic minimum width set by their content, and they ignore the viewport. They are the most common overflow source after fixed widths, and the one case where horizontal scroll is *correct*, as long as it is contained to the element instead of leaking to the page.

**Tables**: wrap the table; scroll the wrapper, not the table itself:

```html
<div class="table-scroll">
  <table> ... </table>
</div>
```

```css
.table-scroll {
  overflow-x: auto;   /* iOS gives this momentum scrolling by default */
}
```

**`<pre>` and code blocks**: let long lines scroll inside the block; break inline code instead of scrolling:

```css
pre {
  max-width: 100%;
  overflow-x: auto;       /* long lines scroll within the block, not the page */
}

code {
  overflow-wrap: break-word;  /* inline code breaks rather than overflowing */
}
```

If a `<pre>` or table sits inside a flex row, also give the flex child `min-width: 0` (section 1), or it will refuse to shrink and the wrapper's `overflow-x` will never kick in.

The rule of thumb: **contain the scroll.** A page-level horizontal scrollbar is a bug; a scrollbar on a single wide table is a feature.

## 10. Stacking patterns

Mobile-first: stack by default, go horizontal when there's room.

```css
.stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .stack {
    flex-direction: row;
  }
}
```

A sidebar + main layout follows the same shape: one column on phones, two columns once there's width:

```css
.layout {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .layout {
    grid-template-columns: 16rem 1fr;
  }
}
```

## 11. Annotated full example

A complete responsive card section applying the rules together. Comments point to the rule each line satisfies (rule numbers refer to the non-negotiables in `SKILL.md`; section numbers refer to this document).

```html
<section class="features">
  <div class="container">
    <h2 class="features__title">What you get</h2>
    <div class="cards">
      <article class="card">
        <img src="thumb.jpg" alt="" class="card__img" />
        <h3 class="card__title">Fast setup</h3>
        <p class="card__body">Drop it in and go. https://example.com/a-very-long-url-that-would-otherwise-overflow</p>
        <a class="card__link" href="#">Learn more</a>
      </article>
      <!-- repeat .card -->
    </div>
  </div>
</section>
```

```css
*, *::before, *::after { box-sizing: border-box; }  /* padding and border count inside width, so the width caps below actually hold */

img, video, svg {
  max-width: 100%;      /* rule 4: media never exceeds its container */
  height: auto;
  display: block;
}

.features {
  padding-block: clamp(2rem, 8vw, 6rem);   /* fluid vertical rhythm (section 3) */
}

.container {
  width: min(100% - 2rem, 1200px);  /* rule 1: cap width, never fix it; 1rem gutters */
  margin-inline: auto;
}

.features__title {
  font-size: clamp(1.5rem, 4vw + 1rem, 2.5rem);  /* fluid, zoom-safe heading (section 2) */
}

.cards {
  display: grid;
  /* rule 2: reflow without breakpoints; min(100%,280px) stays safe under 280px (section 4) */
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: clamp(1rem, 3vw, 2rem);
  margin-top: 2rem;
}

.card {
  min-width: 0;               /* rule 7 / section 1: let the grid child shrink, no overflow */
  min-height: 12rem;          /* rule 3: grow with content instead of clipping */
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card__body {
  overflow-wrap: break-word;  /* rule 7: break the long URL instead of scrolling */
}

.card__link {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  min-height: 44px;           /* rule 5: 44px tap target */
  padding-inline: 0.75rem;
}

/* rule 6: inputs at >= 16px so iOS Safari doesn't zoom on focus */
input, select, textarea { font-size: 16px; }
```

Stacks to one column on phones, fans out to as many 280px+ columns as fit, fluid type and spacing throughout, media capped at 100%, no horizontal scroll at any width from 320px up.

## 12. Tailwind cheat sheet

Tailwind is mobile-first by default: an unprefixed utility applies at every size, and `sm: md: lg: xl: 2xl:` add styles upward from a `min-width` breakpoint. Never use a prefix to "undo" a base style on small screens. Write the small-screen value unprefixed and layer up. Write `class="flex-col md:flex-row"` (stack first, row on desktop), never `class="flex-row md:flex-col"`.

Each rule mapped to its utilities, and the footgun to avoid:

| Rule | Use | Footgun to avoid |
| --- | --- | --- |
| 1. No fixed widths | `w-full max-w-5xl mx-auto`, or `max-w-[1200px] w-full` | `w-[1200px]` (fixed, overflows the phone) |
| 2. Reflow | `flex flex-wrap`; `grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))]` | `flex` without `flex-wrap`; hardcoding `grid-cols-4` at every size |
| 3. min-height | `min-h-dvh`, `min-h-[12rem]` | `h-screen`, `h-[600px]` (clips content) |
| 4. Constrain media | `max-w-full h-auto` (or Next.js `<Image>`) | unbounded `<img>` |
| 5. Tap targets | `min-h-11 min-w-11 p-3` (`h-11` = 44px) | `p-1` icon buttons |
| 6. Input font | `text-base` (16px) on inputs | `text-sm` inputs trigger iOS zoom |
| 7. Text overflow | `min-w-0 break-words`; `truncate` for single line | flex child without `min-w-0` |
| 8. Viewport height | `min-h-dvh` / `min-h-svh` | `min-h-screen` (= 100vh) for heroes |
| 9. Wide content | wrap in `overflow-x-auto` | `overflow-x-hidden` on `body` to mask it |

Footguns worth calling out:

- **`min-w-0` is the fix for 90% of Tailwind flex overflow.** Flex defaults to `flex-nowrap` with `min-width: auto` children, so long text or a nested flex row overflows. Add `flex-wrap` and `min-w-0` (and `truncate` or `break-words` on the text node).
- **`w-screen` is `100vw`**, which includes the scrollbar width and causes a sliver of horizontal scroll. Use `w-full`.
- **`min-h-screen` is still `100vh`** in Tailwind. For mobile heroes use `min-h-dvh` (`min-h-dvh`/`min-h-svh` need Tailwind v3.4+; on older versions use the arbitrary value `min-h-[100dvh]`).
- **Arbitrary fixed values** like `w-[1200px]` and `h-[600px]` reintroduce every problem this skill prevents. Prefer `max-w-*` + `w-full` and `min-h-*`.
- **shadcn/ui:** components are responsive-friendly, but `DialogContent` and data tables still need `max-w-[...] w-full` and an `overflow-x-auto` wrapper for wide content, respectively.

## 13. Aplicación en este proyecto (Riverside Tenis)

Tokens y patrones propios de este repo que complementan las reglas:

- **Paleta**: verde cancha. Fondo del sitio `#F2F7F2` (canvas). Primarios `primary-800`/`primary-900` (header oscuro y bottom-nav), texto sobre header `primary-100`. No redefinir: usar los tokens de `tailwind.config.js`.
- **Breakpoints**: los de Tailwind por defecto (`sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536). Este proyecto es mobile-first: la regla es `flex-col md:flex-row` / `grid-cols-1 md:grid-cols-2`, nunca al revés.
- **Navegación**: patrón ya implementado en `frontend/src/components/Navigation.tsx` — barra inferior fija en mobile (bottom-nav) y barra superior en PC (`md:`). Al crear cualquier página nueva reutilizar `Navigation`, no inventar otra nav.
- **Clases reutilizables** en `globals.css`: `.card`, `.btn-primary`, `.btn-outline`, `.btn-danger`, `.input`, `.label`, `.chip`, `.table-head`. Preferirlas sobre utilidades ad-hoc.
- **Contenido ancho**: las tablas de facturación/deudores y los listados largos deben envolverse en `overflow-x-auto` (regla 9) — nunca dejar que un scroll horizontal llegue a la página.
- **Safe-area**: la bottom-nav fija debería respetar `env(safe-area-inset-bottom)` en celulares con notch (`pb-[max(0.75rem,env(safe-area-inset-bottom))]`) si se detecta que el contenido queda tapado.
