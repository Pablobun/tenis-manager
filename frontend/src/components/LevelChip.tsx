// Chip de nivel con color (item 5): principiante=rojo, intermedio=verde, avanzado=ámbar.
const LEVEL_COLORS: Record<string, string> = {
  principiante: 'bg-red-100 text-red-700',
  intermedio: 'bg-green-100 text-green-700',
  avanzado: 'bg-amber-100 text-amber-700',
};

const LEVEL_LABELS: Record<string, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

export default function LevelChip({ level }: { level?: string | null }) {
  if (!level) return null;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${LEVEL_COLORS[level] || 'bg-gray-100 text-gray-600'}`}>
      {LEVEL_LABELS[level] || level}
    </span>
  );
}
