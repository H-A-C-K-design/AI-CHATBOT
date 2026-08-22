'use client';

// ============================================================
// Client Theme Provider (React 19 & Next.js 16 Compatible)
// ============================================================
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = (localStorage.getItem('nexus_theme') ||
        localStorage.getItem('nexora_theme') ||
        localStorage.getItem('theme')) as Theme | null;

      let initialTheme: Theme = 'dark';
      if (saved === 'light' || saved === 'dark') {
        initialTheme = saved;
      } else if (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches
      ) {
        initialTheme = 'light';
      }

      setThemeState(initialTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
      document.documentElement.style.colorScheme = initialTheme;
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('nexus_theme', newTheme);
      localStorage.setItem('nexora_theme', newTheme);
      localStorage.setItem('theme', newTheme);
    } catch {
      // ignore
    }
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.style.colorScheme = newTheme;
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

