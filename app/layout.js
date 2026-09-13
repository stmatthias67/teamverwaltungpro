'use client';

import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Settings laden deaktiviert - nur Standard-Farben
    const root = document.documentElement;
    root.style.setProperty('--color-primary', '#2ea043');
    root.style.setProperty('--color-secondary', '#1f6feb');
    root.style.setProperty('--color-accent', '#58a6ff');
    root.style.setProperty('--color-bg-main', '#0d1117');
    root.style.setProperty('--color-bg-card', '#161b22');
    root.classList.add('dark');
  }, []);

  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}
