// app/events/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'TRAINING',
    date: '',
    meetTime: '',
    location: '',
    distanceInfo: '',
    isAway: false,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents((data.data || []).sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEvent(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: new Date(formData.date).toISOString(),
          meetTime: formData.meetTime ? new Date(formData.meetTime).toISOString() : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to create event');
      setFormData({
        title: '',
        type: 'TRAINING',
        date: '',
        meetTime: '',
        location: '',
        distanceInfo: '',
        isAway: false,
      });
      setShowForm(false);
      loadEvents();
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
  }

  const getTypeBadge = (type) => {
    const colors = { MATCH: 'bg-red-900', TRAINING: 'bg-blue-900', TOURNAMENT: 'bg-purple-900' };
    const labels = { MATCH: 'Spiel', TRAINING: 'Training', TOURNAMENT: 'Turnier' };
    return <span className={`badge ${colors[type]} text-white`}>{labels[type]}</span>;
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('de-DE', {
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-4xl font-bold mb-2">⚽ Events & Termine</h1>
        <p className="text-gray-400">Verwaltung von Training, Spielen und Turnieren</p>
      </div>

      <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
        + Event hinzufügen
      </button>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Neues Event erstellen</h3>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Titel"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
              />
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input-field"
              >
                <option value="TRAINING">Training</option>
                <option value="MATCH">Spiel</option>
                <option value="TOURNAMENT">Turnier</option>
              </select>
              <input
                type="datetime-local"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-field"
              />
              <input
                type="datetime-local"
                placeholder="Treffzeit"
                value={formData.meetTime}
                onChange={(e) => setFormData({ ...formData, meetTime: e.target.value })}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Ort"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Fahrstrecke (z.B. 8.6 km)"
                value={formData.distanceInfo}
                onChange={(e) => setFormData({ ...formData, distanceInfo: e.target.value })}
                className="input-field"
              />
              <label className="flex items-center gap-2 col-span-2">
                <input
                  type="checkbox"
                  checked={formData.isAway}
                  onChange={(e) => setFormData({ ...formData, isAway: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Auswärts</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">
                Erstellen
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-green-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="card text-center text-gray-400">Keine Events vorhanden</div>
          ) : (
            events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="block hover:border-primary transition">
                <div className="card">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold">{event.title}</h3>
                        {getTypeBadge(event.type)}
                        {event.isAway && <span className="badge bg-orange-900 text-white">Auswärts</span>}
                      </div>
                      <p className="text-sm text-gray-400">📅 {formatDate(event.date)}</p>
                      <p className="text-sm text-gray-400">📍 {event.location}</p>
                      {event.distanceInfo && <p className="text-sm text-gray-400">🚗 {event.distanceInfo}</p>}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {error && <div className="card bg-red-900 border-red-700 text-red-200">⚠️ {error}</div>}
    </div>
  );
}
