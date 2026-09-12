// app/check-in/page.js
'use client';

import { useEffect, useState } from 'react';

export default function CheckInPage() {
  const [events, setEvents] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedEventId) loadAttendance(selectedEventId);
  }, [selectedEventId]);

  async function loadData() {
    try {
      const [eventsRes, playersRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/players'),
      ]);

      if (!eventsRes.ok || !playersRes.ok) throw new Error('Failed to load data');

      const eventsData = await eventsRes.json();
      const playersData = await playersRes.json();

      setEvents(eventsData.data || []);
      setPlayers(playersData.data || []);

      if (eventsData.data?.[0]) {
        setSelectedEventId(eventsData.data[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAttendance(eventId) {
    try {
      const res = await fetch(`/api/attendance?eventId=${eventId}`);
      if (!res.ok) throw new Error('Failed to load attendance');
      const data = await res.json();
      setAttendance(data.data || []);
    } catch (err) {
      console.error('Error loading attendance:', err);
    }
  }

  async function toggleAttendance(playerId, status) {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId,
          playerId,
          status,
        }),
      });

      if (!res.ok) throw new Error('Failed to update attendance');
      loadAttendance(selectedEventId);
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
  }

  const getPlayerAttendance = (playerId) => {
    return attendance.find((a) => a.playerId === playerId)?.status || null;
  };

  const stats = {
    present: attendance.filter((a) => a.status === 'PRESENT').length,
    absent: attendance.filter((a) => a.status === 'ABSENT').length,
  };

  const total = stats.present + stats.absent || 1;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-4xl font-bold mb-2">📋 Check-In & Anwesenheit</h1>
        <p className="text-gray-400">Erfassen Sie die Anwesenheit für Trainings und Spiele</p>
      </div>

      {/* Event Selection */}
      <div>
        <label className="block text-sm font-semibold mb-2">Event wählen:</label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="input-field"
        >
          <option value="">-- Bitte wählen --</option>
          {events.map((event) => (
            <key key={event.id}>
              {event.title} ({new Date(event.date).toLocaleDateString('de-DE')})
            </key>
          ))}
        </select>
      </div>

      {selectedEventId && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <div className="text-2xl font-bold text-green-500">{stats.present}</div>
              <div className="text-xs text-gray-400">Anwesend</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-red-500">{stats.absent}</div>
              <div className="text-xs text-gray-400">Abwesend</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-blue-500">{Math.round((stats.present / total) * 100)}%</div>
              <div className="text-xs text-gray-400">Quote</div>
            </div>
          </div>

          {/* Players Check-In */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-slate-700 border-t-green-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player) => {
                const playerStatus = getPlayerAttendance(player.id);
                return (
                  <div key={player.id} className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          #{player.jerseyNumber} {player.name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleAttendance(player.id, 'PRESENT')}
                          className={`btn btn-small ${
                            playerStatus === 'PRESENT'
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          🟢 Anwesend
                        </button>
                        <button
                          onClick={() => toggleAttendance(player.id, 'ABSENT')}
                          className={`btn btn-small ${
                            playerStatus === 'ABSENT'
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          🔴 Abwesend
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {error && <div className="card bg-red-900 border-red-700 text-red-200">⚠️ {error}</div>}
    </div>
  );
}
