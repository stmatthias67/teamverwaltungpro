'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId;
  
  const [event, setEvent] = useState(null);
  const [players, setPlayers] = useState([]);
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, nomination, attendance, tactics

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  async function loadEventData() {
    try {
      // Lade Event
      const eventRes = await fetch(`/api/events/${eventId}`);
      const eventData = await eventRes.json();
      setEvent(eventData.data);

      // Lade Spieler
      const playersRes = await fetch('/api/players');
      const playersData = await playersRes.json();
      setPlayers(playersData.data);

      // Lade Nominierungen (nur für Match/Tournament)
      if (eventData.data.type !== 'TRAINING') {
        const nomRes = await fetch(`/api/nominations?eventId=${eventId}`);
        const nomData = await nomRes.json();
        setNominations(nomData.data);
      }
    } catch (err) {
      console.error('Error loading event:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Laden...</div>;
  if (!event) return <div>Event nicht gefunden</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-slate-700 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-white">{event.title}</h1>
        <p className="text-slate-400 mt-2">
          {new Date(event.date).toLocaleDateString('de-DE')} • {event.location}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'overview'
              ? 'text-primary border-b-2 border-primary'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Übersicht
        </button>

        {event.type !== 'TRAINING' && (
          <>
            <button
              onClick={() => setActiveTab('nomination')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'nomination'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Nominierung
            </button>
            <button
              onClick={() => setActiveTab('tactics')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'tactics'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Taktik
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'attendance'
              ? 'text-primary border-b-2 border-primary'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Anwesenheit
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="bg-card border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Event-Details</h2>
            {/* Event details here */}
          </div>
        )}

        {activeTab === 'nomination' && event.type !== 'TRAINING' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Spieler nominieren</h2>
            {/* Drag & Drop Nominierungs-Interface */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border-2 border-primary/50 rounded-lg p-4">
                <h3 className="font-bold text-white mb-4">Spielfeld (Startelf)</h3>
                {/* FIELD nominierungen hier */}
              </div>
              <div className="bg-card border-2 border-yellow-500/50 rounded-lg p-4">
                <h3 className="font-bold text-white mb-4">Ersatzbank</h3>
                {/* BENCH nominierungen hier */}
              </div>
              <div className="bg-card border-2 border-slate-600/50 rounded-lg p-4">
                <h3 className="font-bold text-white mb-4">Nicht dabei</h3>
                {/* NOT_NOMINATED nominierungen hier */}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Anwesenheit</h2>
            {/* Anwesenheitsliste hier */}
          </div>
        )}

        {activeTab === 'tactics' && event.type !== 'TRAINING' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Taktik-Board</h2>
            {/* Fußball-Feld mit nominiert Spielern */}
          </div>
        )}
      </div>
    </div>
  );
}
