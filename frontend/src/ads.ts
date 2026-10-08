// Configuración de publicidades (sponsors) — vista alumno.
//
// Cómo agregar un banner:
// 1. Subí la imagen a `frontend/public/banners/` (ej. `frontend/public/banners/mitienda.jpg`).
// 2. Agregá una entrada acá con la ruta relativa a `public/` y el link del anunciante.
//
// Si la lista está vacía, el modal no se muestra.
// El modal se abre cada vez que un alumno inicia sesión (flag en sessionStorage).

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

// Botón "¿Querés ser sponsor?" del modal: abre chat de WhatsApp
export const SPONSOR_WHATSAPP = 'https://wa.me/5493584024658';

export const ADS: AdBanner[] = [
  // Ejemplo:
  // { src: '/banners/mitienda.jpg', href: 'https://instagram.com/mitienda.riocuarto', alt: 'Mi Tienda Río Cuarto' },
  { src: '/banners/casamadre.jpg', href: 'https://www.instagram.com/casamadre.r4/', alt: 'Casa madre Río Cuarto' },
  { src: '/banners/victoria.jpg', href: 'https://www.instagram.com/victoriagrunigevt/', alt: 'Viajes Río Cuarto' },
  { src: '/banners/itec.jpg', href: 'https://www.instagram.com/itecriocuarto/', alt: 'Itec Río Cuarto' },
  { src: '/banners/Kevin.jpg', href: 'https://www.instagram.com/kevingstonriocuarto/', alt: 'Kevingston Río Cuarto' },
];

// Publicidad de la pantalla de login: UNA sola, debajo del formulario,
// visible siempre. Si está vacía (undefined), no se muestra nada.
export const LOGIN_AD: AdBanner | undefined = {
  src: '/banners/casamadre.jpg',
  href: 'https://www.instagram.com/casamadre.r4/',
  alt: 'Casa madre Río Cuarto',
};
