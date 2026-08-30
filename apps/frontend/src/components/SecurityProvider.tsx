'use client';

import React, { useEffect } from 'react';

export default function SecurityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1. Disable Right-Click Context Menu
    const disableContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Disable Keyboard Shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C, Ctrl+S)
    const disableKeyShortcuts = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I or Cmd+Opt+I (Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.code === 'KeyI')) {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+J or Cmd+Opt+J (Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'j' || e.key === 'J' || e.code === 'KeyJ')) {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+C or Cmd+Opt+C (Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'c' || e.key === 'C' || e.code === 'KeyC')) {
        e.preventDefault();
        return false;
      }

      // Ctrl+U or Cmd+Opt+U (Mac) - View Source
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U' || e.code === 'KeyU')) {
        e.preventDefault();
        return false;
      }

      // Ctrl+S or Cmd+S (Mac) - Save Page
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
        e.preventDefault();
        return false;
      }
    };

    // 3. DevTools Detector / Anti-Debugger Loop
    const antiDebugger = () => {
      const startTime = performance.now();
      debugger;
      const endTime = performance.now();
      if (endTime - startTime > 100) {
        console.warn('Developer tools detected. Inspection is disabled.');
      }
    };

    const interval = setInterval(antiDebugger, 1000);

    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('keydown', disableKeyShortcuts);

    return () => {
      clearInterval(interval);
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('keydown', disableKeyShortcuts);
    };
  }, []);

  return <>{children}</>;
}
