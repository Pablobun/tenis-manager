'use client';

// PROTOTYPE — borrar al plegar el mundo ganador. Issue: .scratch/prototipo-mundo-visual/
// Mundo C: masthead editorial — reemplaza el header polvo en todos los tamaños.
// Dos líneas: identidad + usuario arriba, filete de enlaces debajo (scroll-x
// contenido en md estrecho; en mobile manda el bottom nav).

import Link from 'next/link';
import Image from 'next/image';

interface NavLink {
  href: string;
  label: string;
}

interface NavCProps {
  title: string;
  homeHref: string;
  mainLinks: NavLink[];
  menuLinks: NavLink[];
  isActive: (href: string) => boolean;
  manualHref: string;
  userName?: string;
  onLogout: () => void;
}

export default function NavC({
  title,
  homeHref,
  mainLinks,
  menuLinks,
  isActive,
  manualHref,
  userName,
  onLogout
}: NavCProps) {
  const links = [...mainLinks, ...menuLinks];

  return (
    <header className="sticky top-0 z-40 bg-ficha border-b border-line">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link href={homeHref} className="flex items-center gap-2 min-w-0">
          <Image
            src="/logo.png"
            alt=""
            width={40}
            height={28}
            className="h-7 w-auto object-contain shrink-0"
          />
          <span className="font-display font-bold text-lg tracking-tight truncate">{title}</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-muted">{userName}</span>
          <button
            onClick={onLogout}
            className="text-sm text-ink border border-line px-3 py-1.5 rounded-lg hover:bg-cal transition"
          >
            Salir
          </button>
        </div>
      </div>

      <nav className="hidden md:block border-t border-line overflow-x-auto">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-4 text-sm min-w-max">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap transition ${
                isActive(l.href)
                  ? 'text-ink font-semibold underline underline-offset-4 decoration-1'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <a
            href={manualHref}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap text-muted hover:text-ink transition"
          >
            Manual
          </a>
        </div>
      </nav>
    </header>
  );
}
