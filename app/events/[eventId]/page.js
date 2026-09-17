// app/events/[eventId]/page.js - EXTENDED VERSION WITH ALL FEATURES
// (Ersetze den COMPLETE Teil mit diesem erweiterten Code)

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { X, Upload, Plus, Minus } from 'lucide-react';

const FORMATIONS = {
  '4-3-3': {
    name: '4-3-3',
    positions: [
      { id: 1, x: 50, y: 10, label: 'TW', type: 'goalkeeper' },
      { id: 2, x: 20, y: 25, label: 'AB', type: 'defender' },
      { id: 3, x: 35, y: 25, label: 'AB', type: 'defender' },
      { id: 4, x: 65, y: 25, label: 'AB', type: 'defender' },
      { id: 5, x: 80, y: 25, label: 'AB', type: 'defender' },
      { id: 6, x: 30, y: 50, label: 'MF', type: 'midfielder' },
      { id: 7, x: 50, y: 50, label: 'MF', type: 'midfielder' },
      { id: 8, x: 70, y: 50, label: 'MF', type: 'midfielder' },
      { id: 9, x: 25, y: 75, label: 'ST', type: 'forward' },
      { id: 10, x: 50, y: 75, label: 'ST', type: 'forward' },
      { id: 11, x: 75, y: 75, label: 'ST', type: 'forward' },
    ],
  },
  '4-4-2': {
    name: '4-4-2',
    positions: [
      { id: 1, x: 50, y: 10, label: 'TW', type: 'goalkeeper' },
      { id: 2, x: 20, y: 25, label: 'AB', type: 'defender' },
      { id: 3, x: 35, y: 25, label: 'AB', type: 'defender' },
      { id: 4, x: 65, y: 25, label: 'AB', type: 'defender' },
      { id: 5, x: 80, y: 25, label: 'AB', type: 'defender' },
      { id: 6, x: 25, y: 50, label: 'MF', type: 'midfielder' },
      { id: 7, x: 40, y: 50, label: 'MF', type: 'midfielder' },
      { id: 8, x: 60, y: 50, label: 'MF', type: 'midfielder' },
      { id: 9, x: 75, y: 50, label: 'MF', type: 'midfielder' },
      { id: 10, x: 35, y: 75, label: 'ST', type: 'forward' },
      { id: 11, x: 65, y: 75, label: 'ST', type: 'forward' },
    ],
  },
  '3-5-2': {
    name: '3-5-2',
    positions: [
      { id: 1, x: 50, y: 10, label: 'TW', type: 'goalkeeper' },
      { id: 2, x: 30, y: 25, label: 'AB', type: 'defender' },
      { id: 3, x: 50, y: 25, label: 'AB', type: 'defender' },
      { id: 4, x: 70, y: 25, label: 'AB', type: 'defender' },
      { id: 5, x: 20, y: 50, label: 'MF', type: 'midfielder' },
      { id: 6, x: 35, y: 55, label: 'MF', type: 'midfielder' },
      { id: 7, x: 50, y: 60, label: 'MF', type: 'midfielder' },
      { id: 8, x: 65, y: 55, label: 'MF', type: 'midfielder' },
      { id: 9, x: 80, y: 50, label: 'MF', type: 'midfielder' },
      { id: 10, x: 35, y: 80, label: 'ST', type: 'forward' },
      { id: 11, x: 65, y: 80, label: 'ST', type: 'forward' },
    ],
  },
  '5-3-2': {
    name: '5-3-2',
    positions: [
      { id: 1, x: 50, y: 10, label: 'TW', type: 'goalkeeper' },
      { id: 2, x: 15, y: 25, label: 'AB', type: 'defender' },
      { id: 3, x: 35, y: 25, label: 'AB', type: 'defender' },
      { id: 4, x: 50, y: 25, label: 'AB', type: 'defender' },
      { id: 5, x: 65, y: 25, label: 'AB', type: 'defender' },
      { id: 6, x: 85, y: 25, label: 'AB', type: 'defender' },
      { id: 7, x: 30, y: 55, label: 'MF', type: 'midfielder' },
      { id: 8, x: 50, y: 55, label: 'MF', type: 'midfielder' },
      { id: 9, x: 70, y: 55, label: 'MF', type: 'midfielder' },
      { id: 10, x: 35, y: 80, label: 'ST', type: 'forward' },
      { id: 11, x: 65, y: 80, label: 'ST', type: 'forward' },
    ],
  },
};

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId;

  const [event, setEvent] = useState(null);
  const [players, setPlayers] = useState([]);
  const [nominations, setNominations] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Event Data - ALLE FUNKTIONEN
  const [eventData, setEventData] = useState({
    // Spielstand
    score: { home: 0, away: 0 },
    
    // Torschützen
    scorers: [],
    
    // Karten
    cards: [],
    
    // Einwechslungen
    substitutions: [],
    
    // Spielbericht
    notes: '',
    postMatchAnalysis: '',
    
    // Fotos
    photos: [],
    videoLink: '',
    
    // Spieler-Bewertungen (1-5 Sterne)
    ratings: {},
    
    // Training spezifisch
    trainingFocus: '', // z.B. "Standardsituationen", "Defensivtraining"
    trainingExercises: [],
  });

  // Modals
  const [showScorerModal, setShowScorerModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Nomination State
  const [nominationField, setNominationField] = useState([]);
  const [nominationBench, setNominationBench] = useState([]);
  const [selectedFormation, setSelectedFormation] = useState('4-3-3');
  const [fieldPositions, setFieldPositions] = useState([]);
  const [draggedPlayer, setDraggedPlayer] = useState(null);

  // Jersey State
  const [jerseyNumbers, setJerseyNumbers] = useState({});

  const isMatchOrTournament = event && (event.type === 'MATCH' || event.type === 'TOURNAMENT');
  const isTraining = event && event.type === 'TRAINING';

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  useEffect(() => {
    if (selectedFormation) {
      setFieldPositions(
        FORMATIONS[selectedFormation].positions.map(pos => ({
          ...pos,
          playerId: null,
        }))
      );
    }
  }, [selectedFormation]);

  async function loadEventData() {
    try {
      setLoading(true);
      setError(null);

      const [eventRes, playersRes, nominationsRes, attendanceRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch('/api/players'),
        fetch(`/api/nominations?eventId=${eventId}`),
        fetch(`/api/attendance?eventId=${eventId}`),
      ]);

      if (!eventRes.ok) throw new Error('Event nicht gefunden');

      const eventData = await eventRes.json();
      const playersData = await playersRes.json();
      const nominationsData = await nominationsRes.json();
      const attendanceData = await attendanceRes.json();

      setEvent(eventData.data);
      setPlayers(playersData.data || []);
      setNominations(nominationsData.data || []);
      setAttendance(attendanceData.data || []);

      const jerseys = {};
      (nominationsData.data || []).forEach((nom) => {
        if (nom.jerseyNumber) {
          jerseys[nom.playerId] = nom.jerseyNumber;
        }
      });
      setJerseyNumbers(jerseys);

      const field = (nominationsData.data || []).filter(n => n.status === 'FIELD').map(n => n.playerId);
      const bench = (nominationsData.data || []).filter(n => n.status === 'BENCH').map(n => n.playerId);

      setNominationField(field);
      setNominationBench(bench);
    } catch (err) {
      setError(err.message);
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

  const handleDragStart = (playerId) => {
    setDraggedPlayer(playerId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropOnPosition = (positionId) => {
    if (!draggedPlayer) return;

    setFieldPositions(prev =>
      prev.map(pos =>
        pos.id === positionId ? { ...pos, playerId: draggedPlayer } : pos
      )
    );

    setDraggedPlayer(null);
  };

  const handleRemoveFromPosition = (positionId) => {
    setFieldPositions(prev =>
      prev.map(pos =>
        pos.id === positionId ? { ...pos, playerId: null } : pos
      )
    );
  };

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

  const nominatedPlayers = [...nominationField, ...nominationBench];
  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? `${player.firstName} ${player.lastName}` : 'Unbekannt';
  };

  const availableFieldPlayers = nominationField.filter(
    id => !fieldPositions.some(pos => pos.playerId === id)
  );

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
      <div className="flex gap-2 border-b border-slate-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'text-primary border-b-2 border-primary'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Übersicht
        </button>

        {isMatchOrTournament && (
          <>
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 font-medium transition whitespace-nowrap ${
                activeTab === 'live'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Live
            </button>
            <button
              onClick={() => setActiveTab('nomination')}
              className={`px-4 py-2 font-medium transition whitespace-nowrap ${
                activeTab === 'nomination'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Nominierung
            </button>
            <button
              onClick={() => setActiveTab('tactics')}
              className={`px-4 py-2 font-medium transition whitespace-nowrap ${
                activeTab === 'tactics'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Aufstellung
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 font-medium transition whitespace-nowrap ${
                activeTab === 'analysis'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Analyse
            </button>
          </>
        )}

        {isTraining && (
          <button
            onClick={() => setActiveTab('training')}
            className={`px-4 py-2 font-medium transition whitespace-nowrap ${
              activeTab === 'training'
                ? 'text-primary border-b-2 border-primary'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Trainingsplan
          </button>
        )}

        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'checklist'
              ? 'text-primary border-b-2 border-primary'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Checkliste
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === 'media'
              ? 'text-primary border-b-2 border-primary'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📷 Medien
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {isMatchOrTournament && (
            <>
              {/* Spielstand */}
              <div className="card">
                <h2 className="text-xl font-bold text-white mb-4">⚽ Spielstand</h2>
                <div className="flex items-center justify-around gap-4">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm mb-2">Wir</p>
                    <div className="flex gap-2 items-center justify-center">
                      <button onClick={() => setEventData({ ...eventData, score: { ...eventData.score, home: Math.max(0, eventData.score.home - 1) } })} className="btn btn-secondary px-2 py-1">
                        <Minus size={16} />
                      </button>
                      <p className="text-5xl font-bold text-primary w-20 text-center">{eventData.score.home}</p>
                      <button onClick={() => setEventData({ ...eventData, score: { ...eventData.score, home: eventData.score.home + 1 } })} className="btn btn-primary px-2 py-1">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="text-2xl text-slate-400">:</div>
                  <div className="text-center">
                    <p className="text-slate-400 text-sm mb-2">Gegner</p>
                    <div className="flex gap-2 items-center justify-center">
                      <button onClick={() => setEventData({ ...eventData, score: { ...eventData.score, away: Math.max(0, eventData.score.away - 1) } })} className="btn btn-secondary px-2 py-1">
                        <Minus size={16} />
                      </button>
                      <p className="text-5xl font-bold text-primary w-20 text-center">{eventData.score.away}</p>
                      <button onClick={() => setEventData({ ...eventData, score: { ...eventData.score, away: eventData.score.away + 1 } })} className="btn btn-primary px-2 py-1">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistiken */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card">
                  <p className="text-slate-400 text-sm">Torschützen</p>
                  <p className="text-2xl font-bold text-primary">{eventData.scorers.length}</p>
                  <button onClick={() => setShowScorerModal(true)} className="btn btn-primary text-sm mt-2 w-full">
                    + Tor
                  </button>
                </div>
                <div className="card">
                  <p className="text-slate-400 text-sm">Karten</p>
                  <p className="text-2xl font-bold text-primary">{eventData.cards.length}</p>
                  <button onClick={() => setShowCardModal(true)} className="btn btn-primary text-sm mt-2 w-full">
                    + Karte
                  </button>
                </div>
              </div>

              {/* Torschützen Liste */}
              {eventData.scorers.length > 0 && (
                <div className="card">
                  <h3 className="font-bold text-white mb-3">Torschützen</h3>
                  <div className="space-y-2">
                    {eventData.scorers.map((scorer, idx) => (
                      <div key={idx} className="text-sm text-white">
                        ⚽ {getPlayerName(scorer.playerId)} ({scorer.minute}')
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Karten */}
              {eventData.cards.length > 0 && (
                <div className="card">
                  <h3 className="font-bold text-white mb-3">Karten</h3>
                  <div className="space-y-2">
                    {eventData.cards.map((card, idx) => (
                      <div key={idx} className="text-sm text-white">
                        <span className={`inline-block w-3 h-4 rounded mr-2 ${card.type === 'YELLOW' ? 'bg-yellow-400' : 'bg-red-600'}`} />
                        {getPlayerName(card.playerId)} ({card.minute}')
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {isTraining && (
            <div className="card">
              <h2 className="text-xl font-bold text-white mb-4">🏃 Trainingsinfo</h2>
              <div>
                <label className="block text-white text-sm mb-2">Trainings-Fokus</label>
                <input
                  type="text"
                  value={eventData.trainingFocus}
                  onChange={(e) => setEventData({ ...eventData, trainingFocus: e.target.value })}
                  placeholder="z.B. Standardsituationen, Defensivtraining"
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* LIVE TAB */}
      {activeTab === 'live' && isMatchOrTournament && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">🔴 Live-Tracking</h2>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setShowScorerModal(true)} className="card hover:border-primary cursor-pointer">
              <p className="text-2xl mb-2">⚽</p>
              <p className="font-bold text-white">Tor</p>
            </button>
            <button onClick={() => setShowCardModal(true)} className="card hover:border-primary cursor-pointer">
              <p className="text-2xl mb-2">🟥</p>
              <p className="font-bold text-white">Karte</p>
            </button>
            <button onClick={() => setShowSubstitutionModal(true)} className="card hover:border-primary cursor-pointer">
              <p className="text-2xl mb-2">🔄</p>
              <p className="font-bold text-white">Einwechslung</p>
            </button>
            <button onClick={() => setShowRatingModal(true)} className="card hover:border-primary cursor-pointer">
              <p className="text-2xl mb-2">⭐</p>
              <p className="font-bold text-white">Bewertung</p>
            </button>
          </div>

          {/* Timeline */}
          <div className="card">
            <h3 className="font-bold text-white mb-4">Spielverlauf</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {eventData.scorers.length === 0 && eventData.cards.length === 0 && (
                <p className="text-slate-400 text-sm">Noch keine Ereignisse</p>
              )}
              
              {[...eventData.scorers, ...eventData.cards, ...eventData.substitutions]
                .sort((a, b) => a.minute - b.minute)
                .map((event, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <span className="text-slate-400 w-8">{event.minute}'</span>
                    {event.type === 'GOAL' && <span className="text-lg">⚽</span>}
                    {event.type === 'YELLOW' && <span className="text-lg">🟨</span>}
                    {event.type === 'RED' && <span className="text-lg">🟥</span>}
                    {event.type === 'SUB' && <span className="text-lg">🔄</span>}
                    <span className="text-white">{getPlayerName(event.playerId)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* NOMINATION TAB */}
      {activeTab === 'nomination' && isMatchOrTournament && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Nominierungen</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="card">
              <h3 className="font-bold text-primary mb-3">Spielfeld ({nominationField.length})</h3>
              <div className="space-y-2">
                {nominationField.map(playerId => (
                  <div key={playerId} className="text-sm text-white">
                    #{jerseyNumbers[playerId] || '?'} {getPlayerName(playerId)}
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold text-yellow-500 mb-3">Ersatzbank ({nominationBench.length})</h3>
              <div className="space-y-2">
                {nominationBench.map(playerId => (
                  <div key={playerId} className="text-sm text-white">
                    #{jerseyNumbers[playerId] || '?'} {getPlayerName(playerId)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TACTICS TAB */}
      {activeTab === 'tactics' && isMatchOrTournament && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Aufstellung</h2>

          <div>
            <label className="block text-white mb-2 text-sm font-medium">Formation</label>
            <select
              value={selectedFormation}
              onChange={(e) => setSelectedFormation(e.target.value)}
              className="w-full"
            >
              {Object.keys(FORMATIONS).map(key => (
                <option key={key} value={key}>{FORMATIONS[key].name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <div className="bg-green-900/40 border-2 border-green-600 rounded-lg p-4 aspect-video relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <rect x="5" y="5" width="90" height="90" fill="none" stroke="#22c55e" strokeWidth="0.5"/>
                  <line x1="50" y1="5" x2="50" y2="95" stroke="#22c55e" strokeWidth="0.5"/>
                  <circle cx="50" cy="50" r="8" fill="none" stroke="#22c55e" strokeWidth="0.5"/>
                  <circle cx="50" cy="50" r="1" fill="#22c55e"/>
                </svg>

                <div className="absolute inset-4">
                  {fieldPositions.map(pos => (
                    <div
                      key={pos.id}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDropOnPosition(pos.id)}
                      className="absolute w-12 h-12 bg-slate-700/50 border-2 border-slate-600 rounded-full flex items-center justify-center cursor-grab hover:border-primary transition text-xs font-bold text-white"
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {pos.playerId ? (
                        <div className="text-center">
                          <div>{jerseyNumbers[pos.playerId] || '?'}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">{pos.label}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-white text-sm">Verfügbar</h3>
              <div className="bg-slate-800 rounded-lg p-3 space-y-2 max-h-96 overflow-y-auto">
                {nominationField.map(playerId => {
                  const isPlaced = fieldPositions.some(pos => pos.playerId === playerId);
                  if (isPlaced) return null;

                  return (
                    <div
                      key={playerId}
                      draggable
                      onDragStart={() => handleDragStart(playerId)}
                      className="p-2 bg-primary/30 border border-primary rounded cursor-grab hover:bg-primary/50 text-white text-sm"
                    >
                      #{jerseyNumbers[playerId] || '?'} {getPlayerName(playerId)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANALYSIS TAB */}
      {activeTab === 'analysis' && isMatchOrTournament && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">📊 Analyse & Bewertung</h2>

          <div className="card">
            <label className="block text-white text-sm font-medium mb-2">Spielbericht</label>
            <textarea
              value={eventData.notes}
              onChange={(e) => setEventData({ ...eventData, notes: e.target.value })}
              placeholder="Wie lief das Spiel? Besonderheiten?"
              rows="4"
              className="w-full"
            />
          </div>

          <div className="card">
            <label className="block text-white text-sm font-medium mb-2">Post-Match Analyse</label>
            <textarea
              value={eventData.postMatchAnalysis}
              onChange={(e) => setEventData({ ...eventData, postMatchAnalysis: e.target.value })}
              placeholder="Was lief gut? Was können wir verbessern?"
              rows="4"
              className="w-full"
            />
          </div>

          <div className="card">
            <h3 className="font-bold text-white mb-3">Spieler-Bewertungen</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {nominationField.map(playerId => (
                <div key={playerId} className="flex items-center justify-between">
                  <span className="text-white text-sm">{getPlayerName(playerId)}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setEventData({
                          ...eventData,
                          ratings: { ...eventData.ratings, [playerId]: rating }
                        })}
                        className={`text-2xl ${
                          (eventData.ratings[playerId] || 0) >= rating ? 'opacity-100' : 'opacity-30'
                        }`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TRAINING TAB */}
      {activeTab === 'training' && isTraining && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">🏃 Trainingsplan</h2>

          <div className="card">
            <label className="block text-white text-sm font-medium mb-2">Fokus-Bereich</label>
            <input
              type="text"
              value={eventData.trainingFocus}
              onChange={(e) => setEventData({ ...eventData, trainingFocus: e.target.value })}
              placeholder="z.B. Standardsituationen, Defensivtraining, Ballbesitz"
              className="w-full"
            />
          </div>

          <div className="card">
            <label className="block text-white text-sm font-medium mb-2">Übungen</label>
            <textarea
              value={eventData.trainingExercises.join('\n')}
              onChange={(e) => setEventData({ ...eventData, trainingExercises: e.target.value.split('\n') })}
              placeholder="Eine Übung pro Zeile"
              rows="4"
              className="w-full"
            />
          </div>

          <div className="card">
            <label className="block text-white text-sm font-medium mb-2">Notizen</label>
            <textarea
              value={eventData.notes}
              onChange={(e) => setEventData({ ...eventData, notes: e.target.value })}
              placeholder="Wie lief das Training?"
              rows="4"
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* CHECKLIST TAB */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">
            {isMatchOrTournament ? '✅ Nominierte Spieler' : '✅ Anwesenheit'}
          </h2>

          {isMatchOrTournament ? (
            <div className="space-y-3">
              {nominatedPlayers.length === 0 ? (
                <div className="card text-center text-slate-400 py-8">
                  Keine Spieler nominiert
                </div>
              ) : (
                nominatedPlayers.map((playerId) => {
                  const player = players.find(p => p.id === playerId);
                  const att = attendance.find((a) => a.playerId === playerId);
                  const status = att?.status || 'UNKNOWN';
                  const isPresent = status === 'PRESENT';
                  const isAbsent = status === 'ABSENT';
                  const isBench = nominationBench.includes(playerId);

                  return (
                    <div key={playerId} className="card flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">
                          #{jerseyNumbers[playerId] || '?'} {player?.firstName} {player?.lastName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {isBench ? '🔄 Ersatzbank' : '⚽ Spielfeld'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleAttendance(playerId, status)}
                          className={`px-4 py-2 rounded font-medium transition ${
                            isPresent
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-green-600/50'
                          }`}
                        >
                          ✅
                        </button>
                        <button
                          onClick={() => toggleAttendance(playerId, status)}
                          className={`px-4 py-2 rounded font-medium transition ${
                            isAbsent
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-red-600/50'
                          }`}
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {players.length === 0 ? (
                <div className="card text-center text-slate-400 py-8">
                  Keine Spieler vorhanden
                </div>
              ) : (
                players.map((player) => {
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
                          ✅
                        </button>
                        <button
                          onClick={() => toggleAttendance(player.id, status)}
                          className={`px-4 py-2 rounded font-medium transition ${
                            isAbsent
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-red-600/50'
                          }`}
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* MEDIA TAB */}
      {activeTab === 'media' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">📷 Fotos & Videos</h2>

          <div className="card">
            <label className="block text-white text-sm font-medium mb-2">Video-Link</label>
            <input
              type="url"
              value={eventData.videoLink}
              onChange={(e) => setEventData({ ...eventData, videoLink: e.target.value })}
              placeholder="z.B. YouTube Link"
              className="w-full"
            />
          </div>

          {eventData.videoLink && (
            <div className="card">
              <a href={eventData.videoLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">
                🎬 Video anschauen
              </a>
            </div>
          )}

          <div className="card">
            <label className="block text-white text-sm font-medium mb-2">🖼️ Fotos</label>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition">
              <Upload size={32} className="mx-auto text-slate-400 mb-2" />
              <p className="text-white text-sm">Fotos hochladen</p>
              <p className="text-xs text-slate-400">Drag & Drop oder klicken</p>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* Scorer Modal */}
      {showScorerModal && (
        <div className="modal-overlay">
          <div className="modal max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">⚽ Tor</h2>
              <button onClick={() => setShowScorerModal(false)} className="text-slate-400">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <select className="w-full">
                <option>-- Spieler wählen --</option>
                {nominationField.map(playerId => (
                  <option key={playerId} value={playerId}>
                    #{jerseyNumbers[playerId] || '?'} {getPlayerName(playerId)}
                  </option>
                ))}
              </select>

              <input type="number" placeholder="Minute" className="w-full" min="0" max="120" />

              <div className="flex gap-3">
                <button onClick={() => setShowScorerModal(false)} className="flex-1 btn btn-secondary">
                  Abbrechen
                </button>
                <button className="flex-1 btn btn-primary">
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Modal */}
      {showCardModal && (
        <div className="modal-overlay">
          <div className="modal max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">🟥 Karte</h2>
              <button onClick={() => setShowCardModal(false)} className="text-slate-400">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <select className="w-full">
                <option>-- Spieler wählen --</option>
                {[...nominationField, ...nominationBench].map(playerId => (
                  <option key={playerId} value={playerId}>
                    #{jerseyNumbers[playerId] || '?'} {getPlayerName(playerId)}
                  </option>
                ))}
              </select>

              <select className="w-full">
                <option value="YELLOW">🟨 Gelbe Karte</option>
                <option value="RED">🟥 Rote Karte</option>
              </select>

              <input type="number" placeholder="Minute" className="w-full" min="0" max="120" />

              <div className="flex gap-3">
                <button onClick={() => setShowCardModal(false)} className="flex-1 btn btn-secondary">
                  Abbrechen
                </button>
                <button className="flex-1 btn btn-primary">
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
