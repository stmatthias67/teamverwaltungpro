'use client';

import './globals.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Package, CalendarDays, LayoutDashboard, Settings, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';

// Haupttabs: Untertabs liegen in den jeweiligen Layouts (teammanagement/, organisation/)
const MAIN_TABS = [
  { href: '/teammanagement', label: 'Teammanagement', Icon: Users, match: '/teammanagement' },
  { href: '/organisation/material', label: 'Organisation', Icon: Package, match: '/organisation' },
];

// Zusatzseiten, die nicht im Spec-Baum stehen, aber erhalten bleiben
const EXTRA_LINKS = [
  { href: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/events', label: 'Events', Icon: CalendarDays },
  { href: '/settings', label: 'Einstellungen', Icon: Settings },
];

const SETTINGS_KEY = 'themeSettings';

function readStoredMode() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return stored.colorMode || 'DARK';
  } catch {
    return 'DARK';
  }
}

function applyMode(mode) {
  const root = document.documentElement;
  const isLight =
    mode === 'LIGHT' || (mode === 'SYSTEM' && window.matchMedia('(prefers-color-scheme: light)').matches);
  root.classList.toggle('light', isLight);
  root.classList.toggle('dark', !isLight);
}

function saveMode(mode) {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...stored, colorMode: mode }));
  } catch {
    // Speicher nicht verfügbar: Theme gilt nur für diese Sitzung
  }
}

export default function RootLayout({ children }) {
  const pathname = usePathname() || '/';
  const [collapsed, setCollapsed] = useState(false);
  const [mode, setMode] = useState('DARK');

  useEffect(() => {
    const stored = readStoredMode();
    setMode(stored);
    applyMode(stored);
  }, []);

  function toggleMode() {
    const next = document.documentElement.classList.contains('light') ? 'DARK' : 'LIGHT';
    setMode(next);
    saveMode(next);
    applyMode(next);
  }

  const isActive = (match) => pathname.startsWith(match);
  const isLight = mode === 'LIGHT';

  return (
    <html lang="de">
      <head>
        <title>TeamManager Pro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="flex h-screen bg-bg text-fg">
          {/* Desktop/Tablet Sidebar */}
          <aside
            className={`hidden md:flex flex-col shrink-0 ${collapsed ? 'w-16' : 'w-60'} bg-deep border-r border-line transition-[width] duration-300 ease-ui`}
          >
            <div className="h-14 px-4 flex items-center justify-between">
              {!collapsed && (
                <span className="font-medium text-fg text-[15px] truncate">SV Schloßberg</span>
              )}
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted hover:text-fg hover:bg-raised transition-colors duration-150 ease-ui"
                aria-label="Sidebar umschalten"
              >
                {collapsed ? <ChevronRight size={16} strokeWidth={1.5} /> : <ChevronLeft size={16} strokeWidth={1.5} />}
              </button>
            </div>

            <nav className="flex-1 px-2 pt-2 flex flex-col">
              <div className="space-y-1">
                {MAIN_TABS.map(({ href, label, Icon, match }) => (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={`flex items-center gap-2.5 h-9 px-2.5 rounded-lg transition-colors duration-150 ease-ui ${
                      isActive(match) ? 'bg-raised text-fg' : 'text-fg2 hover:text-fg hover:bg-raised'
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.5} className="shrink-0" />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-line space-y-1">
                {EXTRA_LINKS.map(({ href, label, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={`flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-[13px] transition-colors duration-150 ease-ui ${
                      pathname === href ? 'bg-raised text-fg' : 'text-muted hover:text-fg hover:bg-raised'
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.5} className="shrink-0" />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="p-2 border-t border-line">
              <button
                type="button"
                onClick={toggleMode}
                className="w-full h-9 px-2.5 flex items-center gap-2.5 rounded-lg text-[13px] text-muted hover:text-fg hover:bg-raised transition-colors duration-150 ease-ui"
                aria-label={isLight ? 'Dunkles Design aktivieren' : 'Helles Design aktivieren'}
              >
                {isLight ? <Moon size={16} strokeWidth={1.5} className="shrink-0" /> : <Sun size={16} strokeWidth={1.5} className="shrink-0" />}
                {!collapsed && <span>{isLight ? 'Dunkel' : 'Hell'}</span>}
              </button>
            </div>
          </aside>

          {/* Hauptbereich */}
          <main className="flex-1 min-w-0 overflow-y-auto pb-20 md:pb-0">
            <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-8">{children}</div>
          </main>
        </div>

        {/* Mobile Bottom Navigation (< 768px) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-deep border-t border-line flex z-40">
          {MAIN_TABS.map(({ href, label, Icon, match }) => (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-[12px] transition-colors duration-150 ease-ui ${
                isActive(match) ? 'text-fg' : 'text-muted'
              }`}
            >
              <Icon size={18} strokeWidth={1.5} />
              {label}
            </Link>
          ))}
          <Link
            href="/settings"
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-[12px] transition-colors duration-150 ease-ui ${
              pathname.startsWith('/settings') ? 'text-fg' : 'text-muted'
            }`}
          >
            <Settings size={18} strokeWidth={1.5} />
            Einstellungen
          </Link>
        </nav>
      </body>
    </html>
  );
}
