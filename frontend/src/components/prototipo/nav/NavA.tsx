'use client';

// PROTOTYPE — borrar al plegar el mundo ganador. Issue: .scratch/prototipo-mundo-visual/
// Mundo A: sidebar fija a la izquierda en md+ (reemplaza el header superior).
// En mobile no se renderiza (CSS: hidden md:flex); el chrome actual manda.

import Link from 'next/link';
import Image from 'next/image';

interface NavLink {
  href: string;
  label: string;
}

interface NavAProps {
  title: string;
  homeHref: string;
  mainLinks: NavLink[];
  menuLinks: NavLink[];
  isActive: (href: string) => boolean;
  manualHref: string;
  userName?: string;
  onLogout: () => void;
}

export default function NavA({
  title,
  homeHref,
  mainLinks,
  menuLinks,
  isActive,
  manualHref,
  userName,
  onLogout
}: NavAProps) {
  const links = [...mainLinks, ...menuLinks];

  return (
    <aside
      data-proto-nav
      className="hidden md:flex flex-col fixed inset-y-0 left-0 w-60 bg-ficha border-r border-line z-40 p-4 overflow-y-auto"
    >
      <Link
        href={homeHref}
        className="flex items-center gap-2 min-w-0 mb-6"
      >
        <Image
          src="/logo.png"
          alt=""
          width={40}
          height={28}
          className="h-7 w-auto object-contain shrink-0"
        />
        <span className="font-display font-bold text-lg uppercase tracking-wide truncate">
          {title}
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3 py-2 rounded-lg text-sm transition ${
              isActive(l.href)
                ? 'bg-polvo text-white font-semibold'
                : 'text-ink hover:bg-cal'
            }`}
          >
            {l.label}
          </Link>
        ))}
        <a
          href={manualHref}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 rounded-lg text-sm text-ink hover:bg-cal transition"
        >
          Manual
        </a>
      </nav>

      <div className="mt-auto pt-4 border-t border-line flex items-center justify-between gap-2">
        <span className="text-xs text-muted truncate">{userName}</span>
        <button
          onClick={onLogout}
          className="btn-secondary text-xs px-3 py-1.5 shrink-0"
        >
          Salir
        </button>
      </div>
    </aside>
  );
}
