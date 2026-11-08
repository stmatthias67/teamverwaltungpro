// app/check-in/page.js
'use client';

import { useEffect, useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

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
  const rate = Math.round((stats.present / total) * 100);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-[28px] leading-[1.15] font-medium text-fg">Check-in</h1>
        <p className="text-fg2 mt-1">Anwesenheit für Trainings und Spiele erfassen</p>
      </div>

      {/* Event Selection */}
      <div>
        <label className="block text-sm text-fg2 mb-1.5">Event</label>
        <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
          <option value="">Bitte wählen</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} ({new Date(event.date).toLocaleDateString('de-DE')})
            </option>
          ))}
        </select>
      </div>

      {selectedEventId && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card py-4">
              <p className="text-sm text-fg2">Anwesend</p>
              <p className="num text-[28px] leading-none font-medium text-fg mt-2">{stats.present}</p>
            </div>
            <div className="card py-4">
              <p className="text-sm text-fg2">Abwesend</p>
              <p className="num text-[28px] leading-none font-medium text-fg mt-2">{stats.absent}</p>
            </div>
            <div className="card py-4">
              <p className="text-sm text-fg2">Quote</p>
              <p className="num text-[28px] leading-none font-medium text-fg mt-2">{rate}%</p>
            </div>
          </div>

          {/* Players Check-In */}
          {loading ? (
            <p className="text-muted py-12 text-center">Lädt …</p>
          ) : (
            <div className="space-y-2">
              {players.map((player) => {
                const playerStatus = getPlayerAttendance(player.id);
                return (
                  <div key={player.id} className="card py-3 px-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[15px] text-fg truncate">
                        {player.firstName} {player.lastName}
                      </p>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => toggleAttendance(player.id, 'PRESENT')}
                          className={`btn ${playerStatus === 'PRESENT' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                          <Check size={16} strokeWidth={1.5} />
                          Anwesend
                        </button>
                        <button
                          onClick={() => toggleAttendance(player.id, 'ABSENT')}
                          className={`btn ${playerStatus === 'ABSENT' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                          <X size={16} strokeWidth={1.5} />
                          Abwesend
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

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-neg/40 text-neg">
          <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
