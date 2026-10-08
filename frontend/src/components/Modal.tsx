'use client';

import { ReactNode } from 'react';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  /** Clases Tailwind de ancho máximo (default: max-w-lg) */
  maxWidth?: string;
  ariaLabel?: string;
}

// Modal centrado (lote 3): reemplaza al bottom sheet "desde la base de la página".
// Backdrop black/40, panel blanco redondeado con scroll propio; se cierra con
// clic afuera (el contenido usa stopPropagation).
export default function Modal({ onClose, children, maxWidth = 'max-w-lg', ariaLabel }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className={`bg-ficha w-full ${maxWidth} rounded-2xl p-6 pb-8 max-h-[85vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
