import type { Metadata } from 'next';
import { Archivo_Narrow } from 'next/font/google';
import './globals.css';
// PROTOTYPE — borrar al plegar el mundo ganador. Issue: .scratch/prototipo-mundo-visual/
import '../styles/prototipo/variantes.css';
import VariantSwitcher from '@/components/prototipo/VariantSwitcher';

// Display condensed (eco del logo del club): headers en Archivo Narrow.
// UI: system stack (definido en tailwind.config → fontFamily.sans).
const archivo = Archivo_Narrow({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Riverside Tenis - Gestión de Clases',
  description: 'Sistema de gestión de clases de tenis - Riverside',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${archivo.variable} font-sans`}>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var v=new URLSearchParams(location.search).get('variant')||localStorage.getItem('prototipo-mundo');if(v==='a'||v==='b'||v==='c')document.documentElement.setAttribute('data-mundo',v)}catch(e){}",
          }}
        />
        {children}
        <VariantSwitcher />
      </body>
    </html>
  );
}
