'use client';

import './globals.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', '#2ea043');
    root.style.setProperty('--color-secondary', '#1f6feb');
    root.style.setProperty('--color-accent', '#58a6ff');
    root.style.setProperty('--color-bg-main', '#0d1117');
    root.style.setProperty('--color-bg-card', '#161b22');
    root.classList.add('dark');
  }, []);

  const navItems = [
    { href: '/', label: '📊 Dashboard', icon: '📊' },
    { href: '/squad', label: '👥 Kader', icon: '👥' },
    { href: '/events', label: '⚽ Events', icon: '⚽' },
    { href: '/material', label: '🧥 Material', icon: '🧥' },
    { href: '/settings', label: '⚙️ Einstellungen', icon: '⚙️' },
  ];

  return (
    <html lang="de">
      <head>
        <title>TeamManager</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="flex h-screen bg-main text-white">
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-card border-r border-slate-700 transition-all duration-300 flex flex-col`}>
            {/* Logo */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h1 className={`${sidebarOpen ? 'text-xl' : 'text-sm'} font-bold text-primary transition-all`}>
                {sidebarOpen ? '⚽ TeamManager' : 'TM'}
              </h1>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                {sidebarOpen ? '◄' : '►'}
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {sidebarOpen && <span className="text-sm">{item.label.split(' ')[1]}</span>}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700 text-xs text-slate-400">
              {sidebarOpen && <p>SV Schloßberg</p>}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
