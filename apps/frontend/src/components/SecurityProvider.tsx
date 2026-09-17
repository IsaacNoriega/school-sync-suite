'use client';

import React, { useEffect } from 'react';

export default function SecurityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Permitir el uso de DevTools e inspección en entorno de desarrollo o auditorías
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    // 1. Disable Right-Click Context Menu en producción
    const disableContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Disable Keyboard Shortcuts en producción
    const disableKeyShortcuts = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.code === 'KeyI')) {
        e.preventDefault();
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'j' || e.key === 'J' || e.code === 'KeyJ')) {
        e.preventDefault();
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'c' || e.key === 'C' || e.code === 'KeyC')) {
        e.preventDefault();
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U' || e.code === 'KeyU')) {
        e.preventDefault();
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('keydown', disableKeyShortcuts);

    return () => {
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('keydown', disableKeyShortcuts);
    };
  }, []);

  return <>{children}</>;
}
