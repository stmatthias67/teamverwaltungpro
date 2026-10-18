// app/teammanagement/matches/page.js - Untertab "Spielbeteiligung"
'use client';

import ParticipationGrid from '@/components/ParticipationGrid';

export default function SpielbeteiligungPage() {
  return (
    <ParticipationGrid
      eventTypes={['MATCH', 'TOURNAMENT']}
      showScore={true}
      emptyText="Keine Spiele oder Turniere im gewählten Zeitraum. Termine legst du unter Events an."
    />
  );
}
