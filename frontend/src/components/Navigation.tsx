'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, ChevronUp } from '@/components/icons';
import AdModal from '@/components/AdModal';

interface NavUser {
  full_name?: string;
  role?: string;
}

// Barra de navegación persistente (items 1/2 del grilling):
// - PC: barra superior oscura con enlaces + nombre de usuario + Salir.
// - Celular: barra inferior fija con los módulos clave + botón Menú (panel desplegable).
export default function Navigation({ title = 'Riverside Tenis' }: { title?: string }) {
  const [user, setUser] = useState<NavUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const isAdminOrProfesor = user?.role === 'admin' || user?.role === 'profesor';

  const manualHref =
    user?.role === 'admin'
      ? '/manual-sistema.html'
      : user?.role === 'profesor'
        ? '/manual-profesor.html'
        : '/manual-usuario.html';

  const mainLinks = isAdminOrProfesor
    ? [
        { href: '/tablero', label: 'Tablero' },
        { href: '/clases-abiertas', label: 'Clases Abiertas' },
        { href: '/facturacion', label: 'Facturación' },
        { href: '/pagos', label: 'Pagos' },
      ]
    : [
        { href: '/mis-clases', label: 'Mis Clases' },
        { href: '/perfil', label: 'Mi Perfil' },
      ];

  const menuLinks = isAdminOrProfesor
    ? [
        { href: '/plantillas', label: 'Plantillas' },
        { href: '/instancias', label: 'Instancias' },
        { href: '/alumnos', label: 'Alumnos' },
        { href: '/perfil', label: 'Mi Perfil' },
      ]
    : [];

  const handleLogout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      await fetch(`${apiUrl}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      // ignora errores de red al cerrar sesión
    }
    localStorage.removeItem('user');
    router.push('/login');
  };

  const normalize = (p: string) => p.replace(/\/+$/, '') || '/';
  const isActive = (href: string) => normalize(pathname) === normalize(href);

  return (
    <>
      {/* Modal de sponsors (lote 3): solo alumno, 1 vez por día */}
      {user?.role === 'alumno' && <AdModal />}

      {/* Header polvo con wordmark condensado + keyline de cancha */}
      <header className="bg-polvo text-white shadow-md sticky top-0 z-40 court-line">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href={isAdminOrProfesor ? '/tablero' : '/mis-clases'} className="flex items-center gap-2 min-w-0">
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={28}
              className="h-7 w-auto object-contain shrink-0"
            />
            <span className="font-display font-bold text-lg uppercase tracking-wide truncate">{title}</span>
          </Link>

          {/* Enlaces en PC */}
          <nav className="hidden md:flex items-center gap-5 text-sm">
            {mainLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`transition ${isActive(l.href) ? 'text-white font-semibold underline underline-offset-4 decoration-2' : 'text-white hover:underline hover:underline-offset-4'}`}
              >
                {l.label}
              </Link>
            ))}
            {menuLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`transition ${isActive(l.href) ? 'text-white font-semibold underline underline-offset-4 decoration-2' : 'text-white hover:underline hover:underline-offset-4'}`}
              >
                {l.label}
              </Link>
            ))}
            <a href={manualHref} target="_blank" rel="noopener noreferrer" className="text-white hover:underline underline-offset-4 transition">
              Manual
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-white">{user?.full_name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-white bg-white/15 hover:bg-white/25 border border-white/30 px-3 py-1.5 rounded-lg transition"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Placa polvo: barra inferior fija (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-polvo text-white border-t-2 border-white/35">
        <div className="flex items-stretch">
          {mainLinks.slice(0, 4).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex-1 py-3 text-xs text-center transition ${isActive(l.href) ? 'bg-black/20 font-semibold' : 'hover:bg-black/10'}`}
            >
              {l.label}
            </Link>
          ))}
          {!isAdminOrProfesor && (
            <a href={manualHref} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 text-xs text-center transition hover:bg-black/10">
              Manual
            </a>
          )}
          {menuLinks.length > 0 && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              className={`flex-1 py-3 text-xs text-center transition ${menuOpen ? 'bg-black/20 font-semibold' : 'hover:bg-black/10'}`}
            >
              Menú{' '}
              {menuOpen ? (
                <ChevronUp className="w-3 h-3 inline -mt-0.5" />
              ) : (
                <ChevronDown className="w-3 h-3 inline -mt-0.5" />
              )}
            </button>
          )}
        </div>

        {/* Segunda fila expandible del bottom nav (módulos adicionales + Manual) */}
        {menuOpen && menuLinks.length > 0 && (
          <div className="grid grid-cols-5 border-t border-white/35">
            {menuLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`py-3 px-1 text-[11px] text-center truncate transition ${isActive(l.href) ? 'bg-black/20 font-semibold' : 'hover:bg-black/10'}`}
              >
                {l.label}
              </Link>
            ))}
            <a
              href={manualHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="py-3 px-1 text-[11px] text-center truncate transition hover:bg-black/10"
            >
              Manual
            </a>
          </div>
        )}
      </nav>
    </>
  );
}
