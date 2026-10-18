'use client';

// app/organisation/layout.js - Haupttab "Organisation" mit 2 Untertabs
import SubTabs from '@/components/SubTabs';

const TABS = [
  { href: '/organisation/material', label: 'Material', icon: '🎒' },
  { href: '/organisation/laundry', label: 'Trikotwäsche', icon: '👕' },
];

export default function OrganisationLayout({ children }) {
  return (
    <div>
      <SubTabs tabs={TABS} title="📦 Organisation" subtitle="Material und Trikotwäsche" />
      {children}
    </div>
  );
}
