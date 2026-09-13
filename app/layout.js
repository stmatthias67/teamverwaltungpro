'use client';

import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Lade Settings und wende an
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          const settings = data.data;
          const root = document.documentElement;
          
          root.style.setProperty('--color-primary', settings.primaryColor);
          root.style.setProperty('--color-secondary', settings.secondaryColor);
          root.style.setProperty('--color-accent', settings.accentColor);
          root.style.setProperty('--color-bg-main', settings.bgMain);
          root.style.setProperty('--color-bg-card', settings.bgCard);
          
          if (settings.colorMode === 'DARK') {
            root.classList.add('dark');
          } else if (settings.colorMode === 'LIGHT') {
            root.classList.add('light');
          }
        }
      });
  }, []);

  return (
    <html>
      <body>
        {/* ... */}
      </body>
    </html>
  );
}
