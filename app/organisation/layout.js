'use client';

// app/organisation/layout.js - Haupttab "Organisation" mit 2 Untertabs
import { Package, Shirt } from 'lucide-react';
import SubTabs from '@/components/SubTabs';

const TABS = [
  { href: '/organisation/material', label: 'Material', Icon: Package },
  { href: '/organisation/laundry', label: 'Trikotwäsche', Icon: Shirt },
];

export default function OrganisationLayout({ children }) {
  return (
    <div>
      <SubTabs tabs={TABS} title="Organisation" subtitle="Material und Trikotwäsche" />
      {children}
    </div>
  );
}
