'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from '@/components/icons';

// PROTOTYPE — borrar al plegar el mundo ganador. Issue: .scratch/prototipo-mundo-visual/
// Barra flotante que alterna los 3 mundos visuales experimentales sobre el sistema actual.
// Ciclo: Polvo (actual) → A · Glass → B · Deportivo → C · Editorial → Polvo...

type Variante = 'a' | 'b' | 'c';

const VARIANTES: { id: Variante; etiqueta: string }[] = [
  { id: 'a', etiqueta: 'A · Glass' },
  { id: 'b', etiqueta: 'B · Deportivo' },
  { id: 'c', etiqueta: 'C · Editorial' },
];

const ETIQUETA_ACTUAL = 'Polvo · actual';
const CLAVE_LS = 'prototipo-mundo';

function esVariante(v: string | null): v is Variante {
  return v === 'a' || v === 'b' || v === 'c';
}

// Fuentes de los mundos B (Poppins) y C (Newsreader): solo se cargan en dev,
// bajo demanda, para no penalizar el build de producción.
const URL_FUENTES =
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600;6..72,700&display=swap';

function asegurarFuentes() {
  if (document.getElementById('prototipo-fuentes')) return;
  const link = document.createElement('link');
  link.id = 'prototipo-fuentes';
  link.rel = 'stylesheet';
  link.href = URL_FUENTES;
  document.head.appendChild(link);
}

function aplicar(v: Variante | null) {
  const raiz = document.documentElement;
  if (v) {
    raiz.setAttribute('data-mundo', v);
    localStorage.setItem(CLAVE_LS, v);
    asegurarFuentes();
  } else {
    raiz.removeAttribute('data-mundo');
    localStorage.removeItem(CLAVE_LS);
  }
  const url = new URL(window.location.href);
  if (v) url.searchParams.set('variant', v);
  else url.searchParams.delete('variant');
  window.history.replaceState(null, '', url.toString());
  // Sincroniza a los componentes React que cambian estructura por variante
  // (useVariante → Navigation / tablero).
  window.dispatchEvent(new Event('prototipo:mundo'));
}

export default function VariantSwitcher() {
  const [variante, setVariante] = useState<Variante | null>(null);
  // El modo prototipo solo se activa por opt-in: ?variant= o localStorage previo.
  // Sin eso la barra no se renderiza (los usuarios del sitio no ven nada).
  const [activo, setActivo] = useState(false);

  // Restauración: ?variant= manda; si no, localStorage; si no, Polvo (sin atributo).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('variant');
    const guardada = localStorage.getItem(CLAVE_LS);
    const inicial = esVariante(param) ? param : esVariante(guardada) ? guardada : null;
    setActivo(esVariante(param) || esVariante(guardada));
    if (inicial) aplicar(inicial);
    setVariante(inicial);
  }, []);

  const ciclar = useCallback((paso: number) => {
    setVariante((prev) => {
      const orden: (Variante | null)[] = [null, ...VARIANTES.map((v) => v.id)];
      const actual = orden.indexOf(prev);
      const siguiente = orden[(actual + paso + orden.length) % orden.length];
      aplicar(siguiente);
      return siguiente;
    });
  }, []);

  // Flechas del teclado: ciclar mundos solo con el modo prototipo activo,
  // salvo cuando se escribe en un campo.
  useEffect(() => {
    if (!activo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      ciclar(e.key === 'ArrowRight' ? 1 : -1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ciclar, activo]);

  if (!activo) return null;

  const etiqueta = variante ? VARIANTES.find((v) => v.id === variante)!.etiqueta : ETIQUETA_ACTUAL;

  return (
    <div data-prototipo-switcher className="fixed z-50 bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-ink text-white border border-white/25 shadow-lg px-2 py-1.5 select-none">
      <button
        type="button"
        aria-label="Mundo visual anterior"
        onClick={() => ciclar(-1)}
        className="p-1.5 rounded-full hover:bg-white/15 transition"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-xs font-semibold uppercase tracking-wide min-w-[10.5rem] text-center">{etiqueta}</span>
      <button
        type="button"
        aria-label="Mundo visual siguiente"
        onClick={() => ciclar(1)}
        className="p-1.5 rounded-full hover:bg-white/15 transition"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
