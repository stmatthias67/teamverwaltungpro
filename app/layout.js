// app/layout.js
/**
 * Root Layout für TeamManager
 * Enthält Sidebar Navigation mit echten Next.js <Link> Komponenten
 * Responsive für Desktop (Sidebar) und Mobile (Bottom Navigation)
 */

import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'TeamManager - SV Schloßberg',
  description: 'Professional Football Club Management System for SV Schloßberg',
  viewport: 'width=device-width, initial-scale=1.0',
  icons: {
    icon: '⚽',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#2ea043" />
        <link 
          rel="icon" 
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75'>⚽</text></svg>" 
        />
      </head>
      <body className="bg-slate-900 text-white">
        <div className="flex h-screen bg-slate-900">
          {/* ===== DESKTOP SIDEBAR ===== */}
          <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col p-4 overflow-y-auto hidden lg:flex">
            {/* Header/Logo */}
            <div className="mb-8 pb-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="text-3xl">⚽</div>
                <div>
                  <h1 className="font-bold text-white text-lg">TeamManager</h1>
                  <p className="text-xs text-gray-400">SV Schloßberg</p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-2 flex-1">
              <NavLink href="/" icon="📊" label="Dashboard" />
              <NavLink href="/squad" icon="👥" label="Kader" />
              <NavLink href="/events" icon="⚽" label="Events" />
              <NavLink href="/check-in" icon="📋" label="Check-In" />
              <NavLink href="/tactics" icon="👕" label="Taktik" />
              <NavLink href="/material" icon="🧥" label="Material" />
              <NavLink href="/settings" icon="⚙️" label="Settings" />
            </nav>

            {/* Footer */}
            <div className="text-xs text-gray-500 text-center pt-4 border-t border-slate-700 space-y-1">
              <p>© 2026 SV Schloßberg</p>
              <p className="font-semibold">TeamManager v1.0.0</p>
            </div>
          </aside>

          {/* ===== MAIN CONTENT ===== */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile Header */}
            <header className="lg:hidden bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚽</span>
                <span className="font-bold text-sm">TeamManager</span>
              </div>
              <span className="text-lg">📱</span>
            </header>

            {/* Desktop Header */}
            <header className="bg-slate-800 border-b border-slate-700 px-8 py-6 hidden lg:block">
              <h2 className="text-2xl font-bold text-white">TeamManager</h2>
              <p className="text-sm text-gray-400">SV Schloßberg Vereinsverwaltung</p>
            </header>

            {/* Page Content */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 pb-24 lg:pb-8">
              <div className="animate-fadeIn">
                {children}
              </div>
            </div>
          </main>
        </div>

        {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex justify-around items-center h-16 px-2 z-50">
          <MobileNavLink href="/" icon="📊" label="Dashboard" />
          <MobileNavLink href="/squad" icon="👥" label="Kader" />
          <MobileNavLink href="/events" icon="⚽" label="Events" />
          <MobileNavLink href="/check-in" icon="📋" label="Check-In" />
          <MobileNavLink href="/tactics" icon="👕" label="Taktik" />
        </nav>
      </body>
    </html>
  );
}

/**
 * Desktop Navigation Link Component
 * Verwendet Next.js <Link> für Client-Side Navigation
 */
function NavLink({ href, icon, label }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-slate-700 active:bg-green-600 active:text-white transition-all duration-200"
    >
      <span className="text-lg w-6">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

/**
 * Mobile Navigation Link Component
 * Optimiert für kleine Bildschirme
 */
function MobileNavLink({ href, icon, label }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 py-2 px-3 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-center flex-1"
      title={label}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs leading-tight">{label}</span>
    </Link>
  );
}
