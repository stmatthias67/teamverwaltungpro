'use client';

// app/teammanagement/layout.js - Haupttab "Teammanagement" mit 4 Untertabs
import SubTabs from '@/components/SubTabs';

const TABS = [
  { href: '/teammanagement', label: 'Spielberechtigung', icon: '📋' },
  { href: '/teammanagement/training', label: 'Trainingsbeteiligung', icon: '🏋️' },
  { href: '/teammanagement/matches', label: 'Spielbeteiligung', icon: '🏟️' },
  { href: '/teammanagement/tactics', label: 'Kader / Taktik', icon: '👥' },
];

export default function TeammanagementLayout({ children }) {
  return (
    <div>
      <SubTabs tabs={TABS} title="⚽ Teammanagement" subtitle="Spielberechtigung, Beteiligung und Taktik" />
      {children}
    </div>
  );
}
