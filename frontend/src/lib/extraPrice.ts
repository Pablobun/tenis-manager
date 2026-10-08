// P7 (lote 3): precio sugerido para una clase extra.
// = 50% del precio de la plantilla fija ACTIVA del mismo nivel;
//   fallback: cualquier fija activa; si no hay fijas → null (campo vacío).
// El valor se pre-carga en los formularios pero es editable por la profe.

interface PriceTemplate {
  modality: string;
  level?: string | null;
  price_per_class: string | number;
  is_active?: number | boolean;
}

export function suggestExtraPrice<T extends PriceTemplate>(
  templates: T[],
  level?: string | null
): number | null {
  const fijas = templates.filter(
    (t) => t.modality === 'fija' && (t.is_active === undefined || Number(t.is_active) === 1)
  );
  if (fijas.length === 0) return null;

  const misma = level ? fijas.find((t) => t.level === level) : undefined;
  const ref = misma || fijas[0];
  const price = Number(ref.price_per_class);
  if (!Number.isFinite(price) || price <= 0) return null;

  return Math.round(price / 2);
}
