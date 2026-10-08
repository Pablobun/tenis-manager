# Banners de sponsors

Imágenes de los anunciantes que aparecen en el modal de publicidad (vista alumno).

## Cómo cargar uno

1. Copiá la imagen acá (formato jpg/png/webp), ej. `mitienda.jpg`.
2. Abrí `frontend/src/ads.ts` y agregá la entrada:

```ts
{ src: '/banners/mitienda.jpg', href: 'https://instagram.com/...', alt: 'Mi Tienda' },
```

## Reglas

- Si `ADS` en `ads.ts` está vacío, el modal **no se muestra**.
- El modal se abre **1 vez por día** por alumno (se cierra y no vuelve hasta mañana).
- Cada banner es un link a la página/Instagram del anunciante (pestaña nueva).
- Tamaño sugerido: ~800×600 px (4:3). El contenido se centra sin recortarse (`object-contain`).
- Los cambios salen con el próximo deploy (Next copia `public/` a `out/`).
