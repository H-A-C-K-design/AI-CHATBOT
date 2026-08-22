import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth/auth-provider';
import { ProjectProvider } from '@/lib/context/project-context';
import { AntiInspect } from '@/components/security/anti-inspect';
import './globals.css';

export const metadata: Metadata = {
  title: 'NEXORA AI — Intelligent AI Workspace & Coding Companion',
  description:
    'NEXORA AI is a production-grade AI platform for developers and creators. Code generation, deep debugging, automated workflows, and conversational intelligence.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('nexus_theme') || localStorage.getItem('nexora_theme') || localStorage.getItem('theme');
                  var theme = (saved === 'light' || saved === 'dark') ? saved : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                  document.documentElement.setAttribute('data-theme', theme);
                  document.documentElement.style.colorScheme = theme;
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <AntiInspect />
        <ThemeProvider>
          <AuthProvider>
            <ProjectProvider>{children}</ProjectProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
