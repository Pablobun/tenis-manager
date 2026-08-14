'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

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

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Barra superior (PC y mobile) — header oscuro */}
      <header className="bg-primary-800 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href={isAdminOrProfesor ? '/tablero' : '/mis-clases'} className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-lg truncate">{title}</span>
          </Link>

          {/* Enlaces en PC */}
          <nav className="hidden md:flex items-center gap-5 text-sm">
            {mainLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`transition ${isActive(l.href) ? 'text-white font-semibold underline underline-offset-4' : 'text-primary-100 hover:text-white'}`}
              >
                {l.label}
              </Link>
            ))}
            {menuLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`transition ${isActive(l.href) ? 'text-white font-semibold underline underline-offset-4' : 'text-primary-100 hover:text-white'}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-primary-100">{user?.full_name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-white bg-primary-700 hover:bg-primary-600 px-3 py-1.5 rounded-lg transition"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Panel desplegable "Menú" (mobile) */}
      {menuOpen && (
        <div className="md:hidden bg-primary-900 text-white shadow-lg z-30 border-t border-primary-700">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
            {menuLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`py-2 px-2 rounded-lg text-sm ${isActive(l.href) ? 'bg-primary-700 font-semibold' : 'hover:bg-primary-800'}`}
              >
                {l.label}
              </Link>
            ))}
            {menuLinks.length === 0 && (
              <span className="py-2 px-2 text-sm text-primary-200">Sin módulos adicionales</span>
            )}
          </div>
        </div>
      )}

      {/* Barra inferior fija (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-primary-900 text-white border-t border-primary-700">
        <div className="flex items-stretch">
          {mainLinks.slice(0, 4).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex-1 py-3 text-xs text-center transition ${isActive(l.href) ? 'bg-primary-700 font-semibold' : 'hover:bg-primary-800'}`}
            >
              {l.label}
            </Link>
          ))}
          {menuLinks.length > 0 && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`flex-1 py-3 text-xs text-center transition ${menuOpen ? 'bg-primary-700 font-semibold' : 'hover:bg-primary-800'}`}
            >
              Menú
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
