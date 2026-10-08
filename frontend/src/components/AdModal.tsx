'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ADS, ADS_SUBTITLE, ADS_TITLE } from '@/ads';
import { Close } from '@/components/icons';

const PENDING_KEY = 'ads_pending';

// Modal de sponsors (lote 3): se abre cada vez que un alumno inicia sesión
// (la página de login setea el flag), solo para el rol alumno, y solo si hay
// banners cargados en `ads.ts`. El flag se consume al abrir: no vuelve a
// aparecer hasta el próximo login.
export default function AdModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ADS.length === 0) return;
    try {
      if (sessionStorage.getItem(PENDING_KEY) === '1') {
        sessionStorage.removeItem(PENDING_KEY);
        setOpen(true);
      }
    } catch {
      // sin sessionStorage disponible: no molestar
    }
  }, []);

  const close = () => {
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={ADS_TITLE}
    >
      <div
        className="bg-ficha w-full max-w-3xl rounded-2xl p-4 sm:p-5 max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra verde con título + cierre (referencia de la clienta) */}
        <div className="relative bg-green-600 rounded-xl px-4 py-3 mb-4">
          <p className="text-white font-bold text-lg text-center pr-8">{ADS_TITLE}</p>
          <button
            onClick={close}
            aria-label="Cerrar publicidades"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/85 hover:text-white transition"
          >
            <Close className="w-5 h-5" />
          </button>
        </div>

        <p className="text-center font-semibold text-ink mb-4">{ADS_SUBTITLE}</p>

        {/* Grilla: 2 por fila en celular, 3 en tablet, 4 en PC */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {ADS.map((ad) => (
            <a
              key={ad.src}
              href={ad.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-xl border border-line bg-ficha p-2 shadow-sm hover:shadow-md hover:border-green-400 transition"
            >
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src={ad.src}
                  alt={ad.alt || 'Sponsor'}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-contain"
                />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
