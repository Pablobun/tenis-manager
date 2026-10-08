// Configuración de publicidades (sponsors) — vista alumno.
//
// Cómo agregar un banner:
// 1. Subí la imagen a `frontend/public/banners/` (ej. `frontend/public/banners/mitienda.jpg`).
// 2. Agregá una entrada acá con la ruta relativa a `public/` y el link del anunciante.
//
// Si la lista está vacía, el modal no se muestra.
// El modal se abre 1 vez por día por alumno (marca en localStorage `ads_seen_date`).

export interface AdBanner {
  /** Ruta de la imagen dentro de `public/` (ej. '/banners/mitienda.jpg') */
  src: string;
  /** Link al Instagram / página del anunciante (se abre en pestaña nueva) */
  href: string;
  /** Texto alternativo (opcional) */
  alt?: string;
}

export const ADS_TITLE = '¿Querés ser sponsor?';
export const ADS_SUBTITLE = 'Apoyan este sistema';

export const ADS: AdBanner[] = [
  // Ejemplo:
  // { src: '/banners/mitienda.jpg', href: 'https://instagram.com/mitienda.riocuarto', alt: 'Mi Tienda Río Cuarto' },
];
