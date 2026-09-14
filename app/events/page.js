// app/events/page.js (UPDATED VERSION)
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'TRAINING',
    matchType: 'FRIENDLY', // FRIENDLY oder LEAGUE (nur für MATCH)
    date: '',
    meetTime: '',
    location: '',
    distanceInfo: '',
    isAway: false,
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Events konnten nicht geladen werden');
      const data = await res.json();
      setEvents((data.data || []).sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Titel erforderlich';
    if (!formData.date) errors.date = 'Datum erforderlich';
    if (!formData.location.trim()) errors.location = 'Ort erforderlich';
    return errors;
  }

  async function handleAddEvent(e) {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const eventData = {
        title: formData.title,
        type: formData.type,
        date: new Date(formData.date).toISOString(),
        meetTime: formData.meetTime ? new Date(formData.meetTime).toISOString() : null,
        location: formData.location,
        distanceInfo: formData.distanceInfo,
        isAway: formData.isAway,
      };

      // Für MATCH: matchType in title oder als eigenes Feld speichern
      if (formData.type === 'MATCH') {
        eventData.title = `${formData.title} (${formData.matchType === 'FRIENDLY' ? 'Freundschaftsspiel' : 'Punktspiel'})`;
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Event konnte nicht erstellt werden');
      }

      setFormData({
        title: '',
        type: 'TRAINING',
        matchType: 'FRIENDLY',
        date: '',
        meetTime: '',
        location: '',
        distanceInfo: '',
        isAway: false,
      });
      setFormErrors({});
      setShowModal(false);
      await loadEvents();
    } catch (err) {
      setFormErrors({ submit: err.message });
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const getTypeBadge = (type) => {
    const badges = {
      TRAINING: { bg: 'bg-blue-900', text: '🏃 Training' },
      MATCH: { bg: 'bg-red-900', text: '⚽ Spiel' },
      TOURNAMENT: { bg: 'bg-purple-900', text: '🏆 Turnier' },
    };
    return badges[type];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('de-DE', {
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white">⚽ Events</h1>
          <p className="text-slate-400 mt-1">Training, Spiele und Turniere</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          + Event erstellen
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="card text-center text-slate-400 py-12">
              Keine Events vorhanden
            </div>
          ) : (
            events.map((event) => {
              const badge = getTypeBadge(event.type);
              const isUpcoming = new Date(event.date) > new Date();
              
              return (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div className={`card hover:border-primary cursor-pointer transition ${!isUpcoming ? 'opacity-60' : ''}`}>
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{event.type === 'TRAINING' ? '🏃' : event.type === 'MATCH' ? '⚽' : '🏆'}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-white">{event.title}</h3>
                          <span className={`badge ${badge.bg} text-white text-xs px-2 py-1 rounded`}>
                            {badge.text.split(' ')[1]}
                          </span>
                          {event.isAway && <span className="badge bg-orange-900 text-white text-xs px-2 py-1 rounded">Auswärts</span>}
                          {!isUpcoming && <span className="text-xs text-slate-500">Vorbei</span>}
                        </div>
                        <div className="space-y-1 text-sm text-slate-300">
                          <p>📅 {formatDate(event.date)} • 🕐 {formatTime(event.date)}</p>
                          <p>📍 {event.location}</p>
                          {event.distanceInfo && <p>🚗 {event.distanceInfo}</p>}
                        </div>
                      </div>
                      <div className="text-right text-sm text-slate-400">
                        {isUpcoming ? 'Kommend' : 'Vorbei'}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Event erstellen</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormErrors({});
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              {/* Titel */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Titel *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="z.B. Training Montagsgruppe"
                  className={formErrors.title ? 'border-red-500' : ''}
                />
                {formErrors.title && <p className="text-red-400 text-sm mt-1">{formErrors.title}</p>}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Typ</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                >
                  <option value="TRAINING">🏃 Training</option>
                  <option value="MATCH">⚽ Spiel</option>
                  <option value="TOURNAMENT">🏆 Turnier</option>
                </select>
              </div>

              {/* Match Type (nur wenn MATCH) */}
              {formData.type === 'MATCH' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Spieltyp</label>
                  <select
                    name="matchType"
                    value={formData.matchType}
                    onChange={handleInputChange}
                  >
                    <option value="FRIENDLY">🤝 Freundschaftsspiel</option>
                    <option value="LEAGUE">🏆 Punktspiel</option>
                  </select>
                </div>
              )}

              {/* Datum */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Datum *</label>
                <input
                  type="datetime-local"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={formErrors.date ? 'border-red-500' : ''}
                />
                {formErrors.date && <p className="text-red-400 text-sm mt-1">{formErrors.date}</p>}
              </div>

              {/* Treffzeit */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Treffzeit (optional)</label>
                <input
                  type="datetime-local"
                  name="meetTime"
                  value={formData.meetTime}
                  onChange={handleInputChange}
                  placeholder="Wann sollen sich alle treffen?"
                />
              </div>

              {/* Ort */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Ort *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="z.B. Schloßbergplatz"
                  className={formErrors.location ? 'border-red-500' : ''}
                />
                {formErrors.location && <p className="text-red-400 text-sm mt-1">{formErrors.location}</p>}
              </div>

              {/* Fahrstrecke */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Fahrstrecke (optional)</label>
                <input
                  type="text"
                  name="distanceInfo"
                  value={formData.distanceInfo}
                  onChange={handleInputChange}
                  placeholder="z.B. 15.3 km / 20 Min"
                />
              </div>

              {/* Auswärts */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isAway"
                  checked={formData.isAway}
                  onChange={handleInputChange}
                />
                <span className="text-white text-sm">Auswärts</span>
              </label>

              {/* Submit Error */}
              {formErrors.submit && (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm">
                  {formErrors.submit}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormErrors({});
                  }}
                  className="flex-1 btn btn-secondary"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                >
                  Event erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
