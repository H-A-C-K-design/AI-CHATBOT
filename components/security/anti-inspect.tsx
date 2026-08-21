'use client';

import { useEffect } from 'react';

/**
 * AntiInspect Component
 * Disables right-click context menu and inspect shortcut keys.
 */
export function AntiInspect() {
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable common inspection keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 (DevTools)
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl) {
        // Ctrl+Shift+I / Cmd+Option+I (Inspect)
        // Ctrl+Shift+J / Cmd+Option+J (Console)
        // Ctrl+Shift+C / Cmd+Option+C (Element Inspector)
        if (
          e.shiftKey &&
          (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')
        ) {
          e.preventDefault();
          return;
        }

        // Ctrl+U / Cmd+Option+U (View Page Source)
        if (e.key === 'U' || e.key === 'u') {
          e.preventDefault();
          return;
        }

        // Ctrl+S (Save Page)
        if (e.key === 'S' || e.key === 's') {
          e.preventDefault();
          return;
        }
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
}
