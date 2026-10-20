'use client';

import { useEffect, useState } from 'react';

// PROTOTYPE — borrar al plegar el mundo ganador. Issue: .scratch/prototipo-mundo-visual/
// Variante activa del prototipo: 'a' | 'b' | 'c' | null (Polvo = actual).
// Lee el mismo estado que el CSS (atributo data-mundo del <html>, ya seteado por
// el script inline pre-paint) y se mantiene sincronizado con la barra flotante
// vía el evento 'prototipo:mundo' que despacha VariantSwitcher.

export type Variante = 'a' | 'b' | 'c' | null;

function leer(): Variante {
  const v = document.documentElement.getAttribute('data-mundo');
  return v === 'a' || v === 'b' || v === 'c' ? v : null;
}

export function useVariante(): Variante {
  const [variante, setVariante] = useState<Variante>(null);

  useEffect(() => {
    setVariante(leer());
    const onChange = () => setVariante(leer());
    window.addEventListener('prototipo:mundo', onChange);
    return () => window.removeEventListener('prototipo:mundo', onChange);
  }, []);

  return variante;
}
