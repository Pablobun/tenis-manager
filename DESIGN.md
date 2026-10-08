---
name: Riverside Tenis
description: "Polvo de Ladrillo — la app es la cancha: el día de la profe dibujado en polvo de ladrillo con líneas blancas."
colors:
  polvo: "#B65434"
  polvo-dark: "#964226"
  polvo-deep: "#6B301E"
  cal: "#F7F3EA"
  ficha: "#FFFFFF"
  feltro: "#D9E24F"
  feltro-dark: "#C3CC3F"
  line: "#E4DBCB"
  ink: "#241C15"
  muted: "#6E6357"
  cupo-red: "#C43A2A"
  cupo-red-tint: "#FBECEA"
  cupo-red-text: "#8F1E18"
  alert-red: "#B3261E"
  paid-green-tint: "#EAF4EC"
  paid-green-text: "#186130"
typography:
  display:
    fontFamily: "Archivo Narrow, Arial Narrow, ui-sans-serif, sans-serif"
    fontWeight: 700
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.025em"
rounded:
  card: "16px"
  control: "12px"
  small: "8px"
  pill: "9999px"
  modal: "16px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.feltro}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.ficha}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-danger:
    backgroundColor: "{colors.alert-red}"
    textColor: "#FFFFFF"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  input:
    backgroundColor: "{colors.ficha}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  chip:
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  card:
    backgroundColor: "{colors.ficha}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  placa:
    backgroundColor: "{colors.polvo}"
    textColor: "#FFFFFF"
---

# Design System: Riverside Tenis (Polvo de Ladrillo)

## Overview

**Creative North Star: "Polvo de Ladrillo"**

The club's court, rendered as interface: a surface of sun-baked brick dust (#B65434) holding the chrome — header, bottom bar, section plates, the day strip — with white chalk court lines cutting across it, and everything you read sitting on lime wash (#F7F3EA) as clean white fichas (#FFFFFF). It is warm, outdoor, and tactile: the opposite of the gray SaaS dashboard with a sidebar and pastel cards that this world explicitly replaces. The atmosphere is an afternoon at a Río Cuarto club — dust, lime, chalk, felt — not a productivity product.

Density is practical and mobile-first (375px is the main case, sunlight and glare assumed): one screen = one job, big legible figures, chips instead of prose, and the day itself as the primary composition. Type splits into two voices that both echo the club's identity — a condensed grotesque (Archivo Narrow, echoing the "Tenis" wordmark) for anything that names or dates, and a plain system stack for anything you operate. Money and hours are tabular figures, because every number has to show its account.

Depth stays flat and honest: white on lime, a 1.5px warm keyline, and a small ambient shadow that only lifts on state. Exactly one thing on screen is ever lit, and exactly one moment animates.

**Key Characteristics:**
- Full-bleed polvo chrome with white court-line keylines; content always on cal with white fichas.
- Feltro yellow (#D9E24F) reserved for the single primary action — its rarity is the point.
- Semantic color (red = full cupo, green = paid/space and `extra`) is meaning, never palette.
- Condensed display type for headings, wordmark, dates and times; system stack for UI; tabular figures for all numbers.
- One motion moment (`day-in`, 180ms) with a reduced-motion guard; everything else transitions only on state.
- Spanish copy throughout; ENUM values (`fija`, `extra`, `abierta`, `programada`) stay Spanish.

## Colors

The palette is a warm earth ladder — brick dust, lime, chalk, felt — where two of the colors are semantics rather than decoration.

### Primary
- **Polvo de Ladrillo** (#B65434): owns all chrome a sangre — sticky header, mobile bottom nav, section plates, the day strip, the day court itself, and the active segment of the Día/Semana control. Also the focus ring color, the caret, the "Ahora"/"Hoy" chips, the hover state on links inside polvo surfaces, and the default colored keyline (available seats). Its ramp (`primary-50…900`, same hue) carries tints: `primary-50`/`primary-700` for neutral-modality chips, `primary-600`/`primary-700` for text links and totals.
- **Polvo Dark** (#964226): hover for polvo-colored text links; **Polvo Deep** (#6B301E): darkest ramp step.

### Secondary
- **Feltro** (#D9E24F): the yellow clay-court felt. Primary action buttons only (plus the text-selection highlight, an interaction echo of the same signal). **Feltro Dark** (#C3CC3F) is its 1px border. Never a background, never text on light, never a second button.

### Tertiary (semantic, not palette)
- **Rojo Cupo** (#C43A2A keyline, #FBECEA tint, #8F1E18 text): full cupo. **Rojo Alerta** (#B3261E): error banners and the danger button.
- **Verde Pagado / Extra / con espacio** (#2E9150 perimeter, #EAF4EC tint, #186130 text): modality `extra` (decisión de la clienta, lote 3 — contorno perimetral completo + tinte), cupo with room, cycle `completada`, paid states.

### Neutral
- **Cal** (#F7F3EA): the page ground (body background, empty states, table totals band; `canvas` is an alias of the same value).
- **Ficha** (#FFFFFF): every reading surface — cards, inputs, table bodies, sheets.
- **Línea de Cancha** (#E4DBCB): the 1.5px warm keyline around fichas and inputs; warm scrollbar thumb (#CDC2AE).
- **Tinta** (#241C15): primary text on light surfaces; text on feltro.
- **Muted** (#6E6357): labels, secondary copy, table heads, empty states.
- On polvo, court lines are white at 35% (`border-b-2` under header/plates/court) and row separators white at 40%.

### Named Rules
**The Feltro Rule.** Feltro #D9E24F is the only source of yellow and it means one thing: the primary action of the screen (plus the selection highlight). If a second element is feltro, one of them is wrong.

**The Keyline Rule.** A colored left keyline is 1px, never thicker, and always carries cupo/modality meaning — red for full, polvo for with-space, gray for cancelled. `extra` fichas swap the left keyline for a full 1px #2E9150 perimeter over the #EAF4EC tint (`.card-extra`). The ficha's own border stays 1.5px of #E4DBCB. Keylines are semantics; they are not decoration.

**The Polvo Chrome Rule.** Header, bottom nav, section plates, day strip and day court are full-bleed polvo with white text and a white 35% court line. Cal never bleeds into chrome; polvo never becomes a small card.

## Typography

**Display Font:** Archivo Narrow (falls back to Arial Narrow, ui-sans-serif) — loaded via `next/font` as `--font-display`, applied to `h1–h4` in the base layer.
**Body Font:** system stack (ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial).
**Label/Mono Font:** none — figures use the body stack with `font-variant-numeric: tabular-nums`.

**Character:** a condensed grotesque that echoes the club's script-and-caps wordmark against a neutral UI voice. The display face shouts names and times; the system stack does the work.

### Hierarchy
- **Display** (700, 15px–36px, tight): page titles, the header wordmark (uppercase, letter-spacing 0.025em), the day label on the strip ("Martes, 6 de octubre"), class times ("22:10 - 23:10"), hour markers in the day court.
- **Title** (700, 20px): sheet and card headings ("Iniciar sesión").
- **Body** (400, 16px, 1.5): student names, copy, list content.
- **Small** (400, 14px): secondary rows, descriptions, chip-adjacent text.
- **Label** (600, 12px, uppercase, letter-spacing 0.025em, muted): form labels, table heads, "Sistema de gestión de clases".
- **Figures**: any time, price, count or balance renders with tabular-nums (tables and day-court times by rule, everywhere else by the same pattern).

### Named Rules
**The Two-Voice Rule.** Archivo Narrow is for headings, the wordmark, dates and times — nothing else. UI text is the system stack; every figure is tabular. A paragraph set in the display face, or a price set in proportional figures, breaks the world.

## Layout

Mobile-first at 375px; desktop is secondary. Content lives in a centered `max-w-6xl` (1152px) container with a 16px gutter (`px-4`) and 24px vertical rhythm (`py-6`, `space-y-4`/`gap-3` between blocks). Spacing steps actually used: 8 / 12 / 16 / 20 (card padding) / 24.

- **Chrome:** sticky polvo header at top (z-40, court-line bottom keyline); on mobile a fixed polvo bottom nav (`md:hidden`) with a 2px white/35 top court line, content padded `pb-24` to clear it. On `md+` the bottom bar is replaced by inline header links (active = underline, decoration 2, offset 4).
- **Day court:** hour rows on a two-column grid — 3.5rem right-aligned hour rail + 1fr card lane, 12px gap, white/40 separators between rows; cards stack one-per-row until `sm`, then two columns. The in-progress class's hour row is hoisted to the top.
- **Day strip:** a rounded polvo bar with 36px chevron targets; horizontal swipe ≥60px changes day.
- **Week view:** stacked day fichas with wrapping chips — no grid.
- **Tables:** full-width ficha container, label-style heads, rows divided by 1px lines; horizontally scrollable on mobile.
- **Density:** chips at 8px gaps, cards at 16–20px padding, one primary action per view, top-right of the page head.

## Elevation & Depth

Hybrid, flat by default. Depth is first tonal — white ficha on cal, white ficha inside the polvo court — and only secondarily shadowed: a low ambient Tailwind shadow at rest, one step up on hover/elevation, and the single lit element on the day board. No hard or colored shadows anywhere; nothing casts a neobrutalist offset.

### Shadow Vocabulary
- **Resting ficha** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): every `.card`, table container, login form.
- **Raised state** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): card hover, the day strip, the day court panel.
- **The lit one** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` + `ring-2 ring-white`): only the in-progress class card on the day court.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest; shadows appear only as a response to state (hover, elevation, the live class). Warm thin scrollbars (#CDC2AE on transparent) keep even the chrome earthy.

## Shapes

Soft and consistent: fichas and panels at 16px (`rounded-2xl`), controls at 12px (`rounded-xl` — buttons, inputs, segmented control, error banners), small chrome buttons and option rows at 8px (`rounded-lg`), chips fully pill (`rounded-full`), modals round on all corners (16px). Full-bleed chrome has no radius — its edge *is* a court line. Borders: 1.5px #E4DBCB on fichas (a hair heavier than default, readable in sun), 1px on inputs/buttons, the semantic 1px colored left keyline, 2px white/35 under headers/plates/court, 1px white/40 between hour rows. Clipping is never used for shape; no squared, notched or decorative corners exist in this world.

## Components

Character: tactile, legible in sunlight, one job per element.

### Buttons
- **Shape:** 12px radius, 8px 16px padding, 16px body face, weight 600 on filled variants.
- **Primary:** feltro #D9E24F background, tinta #241C15 text, 1px #C3CC3F border; hover = brightness 95%, disabled = 50% opacity. One per screen (e.g. "Ingresar", "+ Nueva Plantilla", "Inscribir Alumno").
- **Secondary:** white ficha, tinta text, 1px #E4DBCB border; hover background cal.
- **Danger:** alert red #B3261E, white text, hover one step darker (defined; used sparingly — destructive rows mostly use red text on a red-50 tint).
- **Focus:** 2px polvo outline, 2px offset, on everything (`:focus-visible`).

### Inputs / Fields
- **Style:** white background, 1px #E4DBCB stroke, 12px radius, 8px 12px padding, tinta text, 16px.
- **Focus:** polvo border + 2px ring at 40% opacity (`ring-polvo/40`); caret is polvo.
- **Label:** 12px uppercase semibold muted, 8px above the field; disabled fields sit on gray-100.

### Chips
- **Style:** pill, 2px 8px padding, 12px semibold.
- **Variants:** neutral (cal bg, muted text, line border — modality `fija`/`abierta`, cancelled); red tint (`#FBECEA`/`#8F1E18` — "4/4 Lleno"); green tint (`#EAF4EC`/`#186130` — space available, `Extra`); polvo/white — reserved for state markers "Ahora" and "Hoy"; level chips: principiante = red tint, intermedio = green tint, avanzado = amber tint.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** white ficha on cal.
- **Border:** 1.5px #E4DBCB; optional semantic 1px colored left keyline (The Keyline Rule).
- **Shadow Strategy:** Flat-By-Default (resting ficha → raised on hover).
- **Internal Padding:** 16px (day cells, compact) or 20px (`.card`, standard).

### Tables
Label-style head (12px uppercase semibold muted) on a light band, 1px row dividers, 16px cell padding, tabular-nums on every numeric column, semantic chips for state, polvo text links for row actions.

### Navigation
- **Header (placa):** sticky, full-bleed polvo, white text, 2px white/35 bottom court line; logo 28px + display wordmark uppercase tracking-wide; desktop links white with underline when active; "Salir" as a white/15 ghost button (8px radius, white/30 border).
- **Bottom nav (mobile):** fixed placa, 2px white/35 top court line, 12px labels, active = black/20 wash + semibold, hover = black/10; optional expandable second row for secondary modules.

### Signature: The Day Court
The tablero's day view is the world's centerpiece: a full-width polvo panel (16px radius, white/35 court line at its base) whose hour rows are separated by white/40 rules, hour markers set right-aligned in condensed tabular white, and white class fichas sitting on the dust with their semantic keylines. The in-progress class is hoisted to the first row and lit (white ring + deepest shadow) with an "Ahora" chip. Changing the day re-draws the court with the one motion moment: **`day-in` — 180ms ease-out, 6px rise + fade**, disabled entirely under `prefers-reduced-motion: reduce`.
### Modal

Class details open as a **centered modal** (lote 3 — antes era un bottom sheet): black/40 backdrop, ficha panel centered on screen (all corners 16px, max 512px wide, 85vh with own scroll), 16px lateral gutter on small screens, stacked cal option rows (12px radius) and a feltro primary action inside. Shared component: `components/Modal.tsx`.

### Icons
Inline SVG only, 24×24 viewBox, 2px stroke, `currentColor`, round caps/joins (chevrons, close). Icons inherit the surrounding text color — white on polvo, tinta on ficha.

## Do's and Don'ts

### Do:
- **Do** give each screen exactly one feltro primary action (#D9E24F on #241C15) and let everything else be secondary (white ficha + line border) or a text link.
- **Do** keep the colored left keyline at exactly 1px and semantic: red (#C43A2A) = full, green (#2E9150) = `extra`, polvo (#B65434) = with space, gray = cancelled.
- **Do** render header, bottom nav, section plates, day strip and day court full-bleed polvo with white text and the white/35 court line.
- **Do** set headings, the wordmark, dates and times in Archivo Narrow; all money, hours and counts in tabular-nums.
- **Do** put reading surfaces on cal with white fichas (16px radius, 1.5px #E4DBCB keyline) and shadow only on state.
- **Do** animate only the day change (`day-in`, 180ms ease-out) and respect `prefers-reduced-motion`.
- **Do** keep copy and ENUM values in Spanish (`fija`, `extra`, `abierta`, `programada`, `completada`).

### Don't:
- **Don't** use feltro anywhere except the primary action (and the selection highlight) — not for badges, not for backgrounds, not for secondary buttons.
- **Don't** thicken the semantic keyline past 1px or attach color to a left keyline that carries no cupo/modality meaning.
- **Don't** introduce a second decorative accent: red and green in this system are semantics (cupo, pagado), not palette.
- **Don't** set body or UI text, paragraphs, or tables in the display face; don't render figures without tabular-nums.
- **Don't** add new shadow styles beyond the resting/raised/lit trio, or use hard, offset, or colored shadows.
- **Don't** shrink the mobile gutter below 16px or drop the bottom-nav clearance (`pb-24`) on small screens.
