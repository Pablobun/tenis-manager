# Issue — Prototipo: 3 mundos visuales (piel + estructura)

**Estado**: IMPLEMENTADO (sin commitear por el agente — el usuario hace add/commit/push).
**Fecha**: 2026-10-19 · **Skill**: `prototype` (rama UI, throwaway).

## Pedido

Explorar direcciones visuales alternativas al sistema actual ("Polvo de Ladrillo") con
**variantes que cambien de verdad la estructura** (no solo skin): disposición del almanaque,
ubicación de elementos, navegación. Al terminar, el usuario elige la variante ganadora.

## Decisiones (grill con el usuario)

1. **Piel y estructura juntas** — cada variante cambia ambos (la diferencia tiene que sentirse).
2. **Alcance: Nav + Tablero** — las 13 páginas heredan la nav; solo `Navigation.tsx` y
   `app/tablero/page.tsx` cambian estructura.
3. **Activación por opt-in en cualquier entorno** (incl. producción): `?variant=a|b|c` o
   localStorage `prototipo-mundo`. Sin parámetro = Polvo exacto actual, la barra del
   switcher no se renderiza (cero cambio para usuarios reales).

## Las 3 variantes

| | A · Glass | B · Deportivo | C · Editorial |
|---|---|---|---|
| Piel | Oscuro glass/SaaS, indigo+cian, blur | Gradientes saturados, radios XXL, Poppins | Papel cálido, keylines, Newsreader |
| Nav | Sidebar fija izq. md+ (header solo mobile) | Top reducida + **dock inferior siempre visible** (md+ flotante centrado) | Masthead editorial propio (todos los tamaños); bottom bar solo mobile |
| Tablero día | Riel con mini-calendario mensual + agenda de columna única por hora | Chips de 7 días con swipe + bloques con hora en gigante | max-w-2xl, fecha como titular serif, nav "← ayer · hoy · mañana →", timeline con filete vertical |
| Tablero semana | Grid 7 columnas (scroll-x contenido) | 7 columnas tipo marcador (scroll-x) | Secciones editoriales por día |

## Implementación

- `frontend/src/styles/prototipo/variantes.css` — skins (A/B/C) + reglas estructurales:
  `main:has(aside[data-proto-nav])` padding-left 15rem (A, md+); `html[data-mundo="b"] main`
  pb 5.5rem + dock `data-prototipo-dock` flotante + switcher sube a 5.5rem (B, md+).
- `frontend/src/app/layout.tsx` — script inline anti-flash que setea `data-mundo` (sin gate).
- `frontend/src/components/prototipo/VariantSwitcher.tsx` — barra flotante (solo opt-in),
  ciclo Polvo→A→B→C, teclado ←/→, despacha evento `prototipo:mundo`.
- `frontend/src/components/prototipo/useVariante.ts` — hook: lee `data-mundo`, escucha el evento.
- `frontend/src/components/prototipo/nav/NavA.tsx`, `NavC.tsx` + delegación condicional en
  `Navigation.tsx` (NavB = JSX condicional: dock sin `md:hidden`, links de header ocultos).
- `frontend/src/components/prototipo/tablero/comun.ts` — tipos + helpers puros compartidos.
- `frontend/src/components/prototipo/tablero/TableroA.tsx`, `TableroB.tsx`, `TableroC.tsx`.
- `frontend/src/app/tablero/page.tsx` — importa de `comun`, `useVariante()` y swap de vista
  (`null` = JSX original intacto; el Modal queda fuera, compartido).

## Verificación

- `npm.cmd run build` OK (16 rutas) · detect impeccable `[]` · smoke dev 200 en
  `/tablero`, `/alumnos`, `/mis-clases`, `/login` con y sin `?variant=a|b|c`.

## Próximos pasos

1. **Usuario**: revisar visualmente (localhost:3000 con `?variant=` o sitio tras push + Ctrl+F5)
   y elegir variante ganadora.
2. Finish review de `impeccable` sobre el ganador.
3. **Plegar**: borrar todo lo marcado `PROTOTYPE` (switcher, useVariante, prototipo/,
   variantes.css, delegación en Navigation, swap en tablero) e integrar el ganador como
   diseño definitivo (actualizar DESIGN.md).
