'use client';

// components/SubTabs.js - Untertab-Leiste für Teammanagement und Organisation
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SubTabs({ tabs, title, subtitle }) {
  const pathname = usePathname() || '';

  return (
    <div className="space-y-4 mb-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className="flex gap-2 overflow-x-auto border-b border-slate-700 pb-0">
        {tabs.map((tab) => {
          // Alle Untertabs sind Blätter: exakter Vergleich, sonst wäre "/teammanagement" immer mit aktiv
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 whitespace-nowrap font-medium transition border-b-2 -mb-px ${
                active ? 'text-primary border-primary' : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
