// app/events/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Plus, Dumbbell, Flag, Trophy, CalendarDays, Clock, MapPin, Car, AlertCircle } from 'lucide-react';

const TYPE_LABEL = {
  TRAINING: 'Training',
  MATCH: 'Spiel',
  TOURNAMENT: 'Turnier',
};

const TYPE_ICON = {
  TRAINING: Dumbbell,
  MATCH: Flag,
  TOURNAMENT: Trophy,
};

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

  const closeModal = () => {
    setShowModal(false);
    setFormErrors({});
  };

  const inputClass = (name) => (formErrors[name] ? 'border-neg' : '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-[1.15] font-medium text-fg">Events</h1>
          <p className="text-fg2 mt-1">Training, Spiele und Turniere</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} strokeWidth={1.5} />
          Event erstellen
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-neg/40 text-neg">
          <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <p className="text-muted py-12 text-center">Lädt …</p>
      ) : (
        <div className="space-y-2">
          {events.length === 0 ? (
            <div className="card text-center text-fg2 py-12">Keine Events vorhanden</div>
          ) : (
            events.map((event) => {
              const Icon = TYPE_ICON[event.type] || CalendarDays;
              const isUpcoming = new Date(event.date) > new Date();

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className={`card block transition-colors duration-150 ease-ui hover:bg-raised ${!isUpcoming ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <Icon size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-muted" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-medium text-fg">{event.title}</h3>
                        <span className="badge">{TYPE_LABEL[event.type]}</span>
                        {event.isAway && <span className="badge">Auswärts</span>}
                        {!isUpcoming && <span className="text-xs text-muted">Vorbei</span>}
                      </div>
                      <div className="mt-2 space-y-1 text-[13px] text-fg2">
                        <p className="flex items-center gap-2">
                          <CalendarDays size={14} strokeWidth={1.5} className="shrink-0 text-muted" />
                          <span className="num">{formatDate(event.date)}</span>
                          <Clock size={14} strokeWidth={1.5} className="shrink-0 text-muted ml-1" />
                          <span className="num">{formatTime(event.date)}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin size={14} strokeWidth={1.5} className="shrink-0 text-muted" />
                          {event.location}
                        </p>
                        {event.distanceInfo && (
                          <p className="flex items-center gap-2">
                            <Car size={14} strokeWidth={1.5} className="shrink-0 text-muted" />
                            {event.distanceInfo}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[13px] text-muted shrink-0">{isUpcoming ? 'Kommend' : 'Vorbei'}</span>
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-fg">Event erstellen</h2>
              <button onClick={closeModal} className="text-muted hover:text-fg transition-colors duration-150 ease-ui" aria-label="Schließen">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              {/* Titel */}
              <div>
                <label className="block text-sm text-fg2 mb-1.5">Titel *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="z.B. Training Montagsgruppe"
                  className={inputClass('title')}
                />
                {formErrors.title && <p className="text-neg text-sm mt-1">{formErrors.title}</p>}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm text-fg2 mb-1.5">Typ</label>
                <select name="type" value={formData.type} onChange={handleInputChange}>
                  <option value="TRAINING">Training</option>
                  <option value="MATCH">Spiel</option>
                  <option value="TOURNAMENT">Turnier</option>
                </select>
              </div>

              {/* Match Type (nur wenn MATCH) */}
              {formData.type === 'MATCH' && (
                <div>
                  <label className="block text-sm text-fg2 mb-1.5">Spieltyp</label>
                  <select name="matchType" value={formData.matchType} onChange={handleInputChange}>
                    <option value="FRIENDLY">Freundschaftsspiel</option>
                    <option value="LEAGUE">Punktspiel</option>
                  </select>
                </div>
              )}

              {/* Datum */}
              <div>
                <label className="block text-sm text-fg2 mb-1.5">Datum *</label>
                <input
                  type="datetime-local"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={inputClass('date')}
                />
                {formErrors.date && <p className="text-neg text-sm mt-1">{formErrors.date}</p>}
              </div>

              {/* Treffzeit */}
              <div>
                <label className="block text-sm text-fg2 mb-1.5">Treffzeit (optional)</label>
                <input type="datetime-local" name="meetTime" value={formData.meetTime} onChange={handleInputChange} />
              </div>

              {/* Ort */}
              <div>
                <label className="block text-sm text-fg2 mb-1.5">Ort *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="z.B. Schloßbergplatz"
                  className={inputClass('location')}
                />
                {formErrors.location && <p className="text-neg text-sm mt-1">{formErrors.location}</p>}
              </div>

              {/* Fahrstrecke */}
              <div>
                <label className="block text-sm text-fg2 mb-1.5">Fahrstrecke (optional)</label>
                <input
                  type="text"
                  name="distanceInfo"
                  value={formData.distanceInfo}
                  onChange={handleInputChange}
                  placeholder="z.B. 15,3 km, 20 Min"
                />
              </div>

              {/* Auswärts */}
              <label className="flex items-center gap-2.5 text-sm text-fg2">
                <input type="checkbox" name="isAway" checked={formData.isAway} onChange={handleInputChange} />
                Auswärts
              </label>

              {/* Submit Error */}
              {formErrors.submit && (
                <div className="p-3 rounded-lg border border-neg/40 text-neg text-sm">{formErrors.submit}</div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 btn btn-secondary">
                  Abbrechen
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
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
