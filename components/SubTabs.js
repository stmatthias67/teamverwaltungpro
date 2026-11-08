'use client';

// components/SubTabs.js - Untertab-Leiste für Teammanagement und Organisation
// Tabs erhalten ein Icon als Komponente unter dem Schlüssel "Icon" (lucide-react).
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SubTabs({ tabs, title, subtitle }) {
  const pathname = usePathname() || '';

  return (
    <div className="space-y-4 mb-6">
      <div>
        <h1 className="text-[28px] md:text-[32px] leading-[1.15] font-medium text-fg">{title}</h1>
        {subtitle && <p className="mt-1 text-fg2">{subtitle}</p>}
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((tab) => {
          // Alle Untertabs sind Blätter: exakter Vergleich, sonst wäre "/teammanagement" immer mit aktiv
          const active = pathname === tab.href;
          const Icon = tab.Icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`-mb-px flex items-center gap-2 h-10 px-3 whitespace-nowrap border-b-2 transition-colors duration-150 ease-ui ${
                active ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'
              }`}
            >
              {Icon && <Icon size={16} strokeWidth={1.5} className="shrink-0" />}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
