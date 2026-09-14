// app/events/[eventId]/page.js
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId;

  const [event, setEvent] = useState(null);
  const [players, setPlayers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  async function loadEventData() {
    try {
      setLoading(true);
      setError(null);

      // Event laden
      const eventRes = await fetch(`/api/events/${eventId}`);
      if (!eventRes.ok) throw new Error('Event nicht gefunden');
      const eventData = await eventRes.json();
      setEvent(eventData.data);

      // Spieler laden
      const playersRes = await fetch('/api/players');
      const playersData = await playersRes.json();
      setPlayers(playersData.data || []);

      // Anwesenheit laden
      const attendanceRes = await fetch(`/api/attendance?eventId=${eventId}`);
      const attendanceData = await attendanceRes.json();
      setAttendance(attendanceData.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAttendance(playerId, currentStatus) {
    try {
      const newStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          playerId,
          status: newStatus,
        }),
      });

      if (!res.ok) throw new Error('Status konnte nicht aktualisiert werden');

      // Update lokal
      setAttendance((prev) => {
        const existing = prev.find((a) => a.playerId === playerId);
        if (existing) {
          return prev.map((a) =>
            a.playerId === playerId ? { ...a, status: newStatus } : a
          );
        }
        return [...prev, { eventId, playerId, status: newStatus }];
      });
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-white">Event nicht gefunden</h1>
        <Link href="/events" className="btn btn-primary">
          ← Zurück zu Events
        </Link>
      </div>
    );
  }

  const eventIcon = event.type === 'TRAINING' ? '🏃' : event.type === 'MATCH' ? '⚽' : '🏆';
  const formatDate = (date) =>
    new Date(date).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  const formatTime = (date) =>
    new Date(date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const absentCount = attendance.filter((a) => a.status === 'ABSENT').length;
  const unknownCount = players.length - presentCount - absentCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{eventIcon}</span>
            <h1 className="text-4xl font-bold text-white">{event.title}</h1>
          </div>
          <p className="text-slate-400">
            📅 {formatDate(event.date)} • 🕐 {formatTime(event.date)}
          </p>
          <p className="text-slate-400 mt-1">📍 {event.location}</p>
          {event.distanceInfo && <p className="text-slate-400">🚗 {event.distanceInfo}</p>}
        </div>
        <Link href="/events" className="btn btn-secondary text-sm">
          ← Zurück
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
          ⚠️ {error}
        </div>
      )}

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
        <button
          onClick={() => setActiveTab('checkin')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'checkin'
              ? 'text-primary border-b-2 border-primary'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Check-In
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card">
              <p className="text-slate-400 text-sm">Anwesend</p>
              <p className="text-3xl font-bold text-green-400">{presentCount}</p>
            </div>
            <div className="card">
              <p className="text-slate-400 text-sm">Abwesend</p>
              <p className="text-3xl font-bold text-red-400">{absentCount}</p>
            </div>
            <div className="card">
              <p className="text-slate-400 text-sm">Unbekannt</p>
              <p className="text-3xl font-bold text-yellow-400">{unknownCount}</p>
            </div>
          </div>

          {/* Anwesenheitsliste */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">Spielerstatus</h2>
            <div className="space-y-2">
              {players.length === 0 ? (
                <p className="text-slate-400">Keine Spieler vorhanden</p>
              ) : (
                players.map((player) => {
                  const att = attendance.find((a) => a.playerId === player.id);
                  const status = att?.status || 'UNKNOWN';

                  return (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-slate-800 rounded">
                      <div>
                        <p className="font-medium text-white">
                          {player.firstName} {player.lastName}
                        </p>
                        <p className="text-xs text-slate-400">{player.parentName}</p>
                      </div>
                      <div className="text-sm font-medium">
                        {status === 'PRESENT' ? (
                          <span className="text-green-400">✅ Dabei</span>
                        ) : status === 'ABSENT' ? (
                          <span className="text-red-400">❌ Abwesend</span>
                        ) : (
                          <span className="text-slate-400">❓ Unbekannt</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'checkin' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Anwesenheit erfassen</h2>
          
          {players.length === 0 ? (
            <div className="card text-center text-slate-400 py-8">
              Keine Spieler vorhanden
            </div>
          ) : (
            <div className="space-y-3">
              {players.map((player) => {
                const att = attendance.find((a) => a.playerId === player.id);
                const status = att?.status || 'UNKNOWN';
                const isPresent = status === 'PRESENT';
                const isAbsent = status === 'ABSENT';

                return (
                  <div key={player.id} className="card flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">
                        {player.firstName} {player.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{player.parentName}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleAttendance(player.id, status)}
                        className={`px-4 py-2 rounded font-medium transition ${
                          isPresent
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-green-600/50'
                        }`}
                      >
                        ✅ Dabei
                      </button>
                      <button
                        onClick={() => toggleAttendance(player.id, status)}
                        className={`px-4 py-2 rounded font-medium transition ${
                          isAbsent
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-red-600/50'
                        }`}
                      >
                        ❌ Nicht dabei
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
