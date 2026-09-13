'use client';

import './globals.css';
import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', '#2ea043');
    root.style.setProperty('--color-secondary', '#1f6feb');
    root.style.setProperty('--color-accent', '#58a6ff');
    root.style.setProperty('--color-bg-main', '#0d1117');
    root.style.setProperty('--color-bg-card', '#161b22');
    root.classList.add('dark');
  }, []);

  return (
    <html lang="de">
      <head>
        <title>TeamManager</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="p-4 max-w-7xl mx-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
