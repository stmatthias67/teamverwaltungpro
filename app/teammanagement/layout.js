'use client';

// app/teammanagement/layout.js - Haupttab "Teammanagement" mit 4 Untertabs
import SubTabs from '@/components/SubTabs';
import { ClipboardList, Dumbbell, Trophy, Shirt } from 'lucide-react';

const TABS = [
  { href: '/teammanagement', label: 'Spielberechtigung', Icon: ClipboardList },
  { href: '/teammanagement/training', label: 'Trainingsbeteiligung', Icon: Dumbbell },
  { href: '/teammanagement/matches', label: 'Spielbeteiligung', Icon: Trophy },
  { href: '/teammanagement/tactics', label: 'Kader / Taktik', Icon: Shirt },
];

export default function TeammanagementLayout({ children }) {
  return (
    <div>
      <SubTabs tabs={TABS} title="Teammanagement" subtitle="Spielberechtigung, Beteiligung und Taktik" />
      {children}
    </div>
  );
}
