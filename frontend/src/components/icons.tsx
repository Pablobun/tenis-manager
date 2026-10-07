type IconProps = { className?: string };

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
};

export function ChevronLeft({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ChevronRight({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ChevronUp({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 15l7-7 7 7" />
    </svg>
  );
}

export function ChevronDown({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 9l7 7 7-7" />
    </svg>
  );
}

export function Close({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
