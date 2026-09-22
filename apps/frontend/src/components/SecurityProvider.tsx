'use client';

import React from 'react';

/**
 * SecurityProvider: Mantenido como componente transparente para compatibilidad.
 * Los bloqueos artificiales de clic derecho y DevTools fueron retirados para
 * cumplir con las pautas de accesibilidad y usabilidad W3C/WCAG.
 */
export default function SecurityProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

