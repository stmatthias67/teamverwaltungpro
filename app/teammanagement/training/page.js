// app/teammanagement/training/page.js - Untertab "Trainingsbeteiligung"
'use client';

import ParticipationGrid from '@/components/ParticipationGrid';

export default function TrainingsbeteiligungPage() {
  return (
    <ParticipationGrid
      eventTypes={['TRAINING']}
      showScore={false}
      emptyText="Keine Trainingstermine im gewählten Zeitraum. Termine legst du unter Events an."
    />
  );
}
