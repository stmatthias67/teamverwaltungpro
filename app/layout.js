'use client';

import './globals.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Haupttabs: Untertabs liegen in den jeweiligen Layouts (teammanagement/, organisation/)
const MAIN_TABS = [
  { href: '/teammanagement', label: 'Teammanagement', icon: '⚽', match: '/teammanagement' },
  { href: '/organisation/material', label: 'Organisation', icon: '📦', match: '/organisation' },
];

// Zusatzseiten, die nicht im Spec-Baum stehen, aber erhalten bleiben
const EXTRA_LINKS = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/events', label: 'Events', icon: '📅' },
  { href: '/settings', label: 'Einstellungen', icon: '⚙️' },
];

export default function RootLayout({ children }) {
  const pathname = usePathname() || '/';
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', '#2ea043');
    root.style.setProperty('--color-secondary', '#1f6feb');
    root.style.setProperty('--color-accent', '#58a6ff');
    root.style.setProperty('--color-bg-main', '#0d1117');
    root.style.setProperty('--color-bg-card', '#161b22');
    root.classList.add('dark');
  }, []);

  const isActive = (match) => pathname.startsWith(match);

  return (
    <html lang="de">
      <head>
        <title>TeamManager Pro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="flex h-screen bg-main text-white">
          {/* Desktop/Tablet Sidebar */}
          <aside
            className={`hidden md:flex flex-col ${collapsed ? 'w-20' : 'w-64'} bg-card border-r border-slate-700 transition-all duration-300`}
          >
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h1 className="font-bold text-primary text-lg truncate">
                {collapsed ? 'TM' : '⚽ SV Schloßberg'}
              </h1>
              <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-slate-700 rounded" aria-label="Sidebar umschalten">
                {collapsed ? '►' : '◄'}
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-2">
              {MAIN_TABS.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive(tab.match) ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  {!collapsed && <span className="font-medium">{tab.label}</span>}
                </Link>
              ))}

              <div className="pt-4 mt-4 border-t border-slate-700 space-y-1">
                {EXTRA_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition ${
                      pathname === link.href ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <span>{link.icon}</span>
                    {!collapsed && <span>{link.label}</span>}
                  </Link>
                ))}
              </div>
            </nav>
          </aside>

          {/* Hauptbereich */}
          <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
            <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
          </main>
        </div>

        {/* Mobile Bottom Navigation (< 768px) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-slate-700 flex z-40">
          {MAIN_TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center text-xs gap-1 ${
                isActive(tab.match) ? 'text-primary' : 'text-slate-400'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              {tab.label}
            </Link>
          ))}
          <Link href="/settings" className={`flex-1 flex flex-col items-center justify-center text-xs gap-1 ${pathname.startsWith('/settings') ? 'text-primary' : 'text-slate-400'}`}>
            <span className="text-xl">⚙️</span>
            Einstellungen
          </Link>
        </nav>
      </body>
    </html>
  );
            }
