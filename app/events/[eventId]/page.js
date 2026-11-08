// app/events/[eventId]/page.js
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  X,
  Upload,
  Plus,
  Minus,
  ChevronLeft,
  Dumbbell,
  Flag,
  Trophy,
  CalendarDays,
  Clock,
  MapPin,
  Target,
  Square,
  ArrowLeftRight,
  Star,
  Video,
  Check,
  AlertCircle,
} from 'lucide-react';

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

const EVENT_TYPE_LABEL = { TRAINING: 'Training', MATCH: 'Spiel', TOURNAMENT: 'Turnier' };
const EVENT_TYPE_ICON = { TRAINING: Dumbbell, MATCH: Flag, TOURNAMENT: Trophy };

const inputClass = 'w-full';
const labelClass = 'block text-sm text-fg2 mb-1.5';
const sectionTitle = 'text-[15px] font-medium text-fg';

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 px-3 -mb-px border-b-2 whitespace-nowrap text-[14px] transition-colors duration-150 ease-ui ${
        active ? 'border-fg text-fg' : 'border-transparent text-muted hover:text-fg'
      }`}
    >
      {children}
    </button>
  );
}

function ScoreCounter({ label, value, onMinus, onPlus }) {
  return (
    <div className="text-center">
      <p className="text-sm text-fg2 mb-3">{label}</p>
      <div className="flex items-center justify-center gap-3">
        <button type="button" onClick={onMinus} className="btn btn-secondary w-9 px-0" aria-label={`${label} minus eins`}>
          <Minus size={16} strokeWidth={1.5} />
        </button>
        <p className="num text-[48px] leading-none font-medium text-fg w-20 text-center">{value}</p>
        <button type="button" onClick={onPlus} className="btn btn-secondary w-9 px-0" aria-label={`${label} plus eins`}>
          <Plus size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

function AttendanceToggle({ status, onPresent, onAbsent }) {
  const isPresent = status === 'PRESENT';
  const isAbsent = status === 'ABSENT';
  return (
    <div className="flex gap-2 shrink-0">
      <button
        type="button"
        onClick={onPresent}
        aria-pressed={isPresent}
        className={`btn ${isPresent ? 'btn-primary' : 'btn-secondary'} w-10 px-0`}
        aria-label="Anwesend"
      >
        <Check size={16} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={onAbsent}
        aria-pressed={isAbsent}
        className={`btn ${isAbsent ? 'btn-primary' : 'btn-secondary'} w-10 px-0`}
        aria-label="Abwesend"
      >
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}

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

  // Event Data
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
    trainingFocus: '',
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
        FORMATIONS[selectedFormation].positions.map((pos) => ({
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

      const field = (nominationsData.data || []).filter((n) => n.status === 'FIELD').map((n) => n.playerId);
      const bench = (nominationsData.data || []).filter((n) => n.status === 'BENCH').map((n) => n.playerId);

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
          return prev.map((a) => (a.playerId === playerId ? { ...a, status: newStatus } : a));
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

    setFieldPositions((prev) =>
      prev.map((pos) => (pos.id === positionId ? { ...pos, playerId: draggedPlayer } : pos))
    );

    setDraggedPlayer(null);
  };

  if (loading) {
    return <p className="text-muted py-12 text-center">Lädt …</p>;
  }

  if (!event) {
    return (
      <div className="space-y-4">
        <h1 className="text-[28px] leading-[1.15] font-medium text-fg">Event nicht gefunden</h1>
        <Link href="/events" className="btn btn-secondary">
          <ChevronLeft size={16} strokeWidth={1.5} />
          Zurück zu Events
        </Link>
      </div>
    );
  }

  const EventIcon = EVENT_TYPE_ICON[event.type] || CalendarDays;
  const formatDate = (date) =>
    new Date(date).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  const formatTime = (date) => new Date(date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  const nominatedPlayers = [...nominationField, ...nominationBench];
  const getPlayerName = (playerId) => {
    const player = players.find((p) => p.id === playerId);
    return player ? `${player.firstName} ${player.lastName}` : 'Unbekannt';
  };

  const tabs = [{ key: 'overview', label: 'Übersicht' }];
  if (isMatchOrTournament) {
    tabs.push(
      { key: 'live', label: 'Live' },
      { key: 'nomination', label: 'Nominierung' },
      { key: 'tactics', label: 'Aufstellung' },
      { key: 'analysis', label: 'Analyse' }
    );
  }
  if (isTraining) {
    tabs.push({ key: 'training', label: 'Trainingsplan' });
  }
  tabs.push({ key: 'checklist', label: 'Checkliste' }, { key: 'media', label: 'Medien' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <EventIcon size={18} strokeWidth={1.5} className="shrink-0 text-muted" />
            <h1 className="text-[28px] leading-[1.15] font-medium text-fg">{event.title}</h1>
          </div>
          <div className="mt-3 space-y-1.5 text-[14px] text-fg2">
            <p className="flex items-center gap-2">
              <CalendarDays size={14} strokeWidth={1.5} className="shrink-0 text-muted" />
              <span>{formatDate(event.date)}</span>
              <Clock size={14} strokeWidth={1.5} className="shrink-0 text-muted ml-1" />
              <span className="num">{formatTime(event.date)} Uhr</span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin size={14} strokeWidth={1.5} className="shrink-0 text-muted" />
              {event.location}
            </p>
          </div>
        </div>
        <Link href="/events" className="btn btn-secondary">
          <ChevronLeft size={16} strokeWidth={1.5} />
          Zurück
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-neg/40 text-neg">
          <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line overflow-x-auto">
        {tabs.map((tab) => (
          <TabButton key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </TabButton>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {isMatchOrTournament && (
            <>
              {/* Spielstand */}
              <section className="card">
                <h2 className={`${sectionTitle} mb-6`}>Spielstand</h2>
                <div className="flex items-center justify-around gap-4">
                  <ScoreCounter
                    label="Wir"
                    value={eventData.score.home}
                    onMinus={() =>
                      setEventData({ ...eventData, score: { ...eventData.score, home: Math.max(0, eventData.score.home - 1) } })
                    }
                    onPlus={() =>
                      setEventData({ ...eventData, score: { ...eventData.score, home: eventData.score.home + 1 } })
                    }
                  />
                  <span className="text-[28px] text-muted">:</span>
                  <ScoreCounter
                    label="Gegner"
                    value={eventData.score.away}
                    onMinus={() =>
                      setEventData({ ...eventData, score: { ...eventData.score, away: Math.max(0, eventData.score.away - 1) } })
                    }
                    onPlus={() =>
                      setEventData({ ...eventData, score: { ...eventData.score, away: eventData.score.away + 1 } })
                    }
                  />
                </div>
              </section>

              {/* Statistiken */}
              <div className="grid grid-cols-2 gap-3">
                <div className="card py-4">
                  <p className="text-sm text-fg2">Torschützen</p>
                  <p className="num text-[28px] leading-none font-medium text-fg mt-3">{eventData.scorers.length}</p>
                  <button type="button" onClick={() => setShowScorerModal(true)} className="btn btn-secondary w-full mt-4">
                    <Plus size={16} strokeWidth={1.5} />
                    Tor
                  </button>
                </div>
                <div className="card py-4">
                  <p className="text-sm text-fg2">Karten</p>
                  <p className="num text-[28px] leading-none font-medium text-fg mt-3">{eventData.cards.length}</p>
                  <button type="button" onClick={() => setShowCardModal(true)} className="btn btn-secondary w-full mt-4">
                    <Plus size={16} strokeWidth={1.5} />
                    Karte
                  </button>
                </div>
              </div>

              {/* Torschützen Liste */}
              {eventData.scorers.length > 0 && (
                <section className="card">
                  <h3 className={`${sectionTitle} mb-3`}>Torschützen</h3>
                  <div className="space-y-2 text-[14px] text-fg">
                    {eventData.scorers.map((scorer, idx) => (
                      <p key={idx} className="flex items-center gap-2">
                        <Target size={14} strokeWidth={1.5} className="shrink-0 text-muted" />
                        {getPlayerName(scorer.playerId)} <span className="num text-fg2">({scorer.minute}')</span>
                      </p>
                    ))}
                  </div>
                </section>
              )}

              {/* Karten */}
              {eventData.cards.length > 0 && (
                <section className="card">
                  <h3 className={`${sectionTitle} mb-3`}>Karten</h3>
                  <div className="space-y-2 text-[14px] text-fg">
                    {eventData.cards.map((card, idx) => (
                      <p key={idx} className="flex items-center gap-2">
                        <span className={`inline-block w-2.5 h-3.5 rounded-sm ${card.type === 'YELLOW' ? 'bg-amber-400' : 'bg-neg'}`} />
                        {getPlayerName(card.playerId)} <span className="num text-fg2">({card.minute}')</span>
                      </p>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {isTraining && (
            <section className="card">
              <h2 className={`${sectionTitle} mb-4`}>Trainingsinfo</h2>
              <div>
                <label className={labelClass}>Trainings-Fokus</label>
                <input
                  type="text"
                  value={eventData.trainingFocus}
                  onChange={(e) => setEventData({ ...eventData, trainingFocus: e.target.value })}
                  placeholder="z.B. Standardsituationen, Defensivtraining"
                  className={inputClass}
                />
              </div>
            </section>
          )}
        </div>
      )}

      {/* LIVE TAB */}
      {activeTab === 'live' && isMatchOrTournament && (
        <div className="space-y-6">
          <h2 className={sectionTitle}>Live-Tracking</h2>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Tor', Icon: Target, onClick: () => setShowScorerModal(true) },
              { label: 'Karte', Icon: Square, onClick: () => setShowCardModal(true) },
              { label: 'Einwechslung', Icon: ArrowLeftRight, onClick: () => setShowSubstitutionModal(true) },
              { label: 'Bewertung', Icon: Star, onClick: () => setShowRatingModal(true) },
            ].map(({ label, Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className="card py-4 flex items-center gap-3 text-left transition-colors duration-150 ease-ui hover:bg-raised"
              >
                <Icon size={18} strokeWidth={1.5} className="shrink-0 text-muted" />
                <span className="text-[14px] text-fg">{label}</span>
              </button>
            ))}
          </div>

          {/* Timeline */}
          <section className="card">
            <h3 className={`${sectionTitle} mb-4`}>Spielverlauf</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {eventData.scorers.length === 0 && eventData.cards.length === 0 && (
                <p className="text-muted text-sm">Noch keine Ereignisse</p>
              )}

              {[...eventData.scorers, ...eventData.cards, ...eventData.substitutions]
                .sort((a, b) => a.minute - b.minute)
                .map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <span className="num text-muted w-8">{item.minute}'</span>
                    {item.type === 'GOAL' && <Target size={16} strokeWidth={1.5} className="text-muted" />}
                    {item.type === 'YELLOW' && <span className="inline-block w-2.5 h-3.5 rounded-sm bg-amber-400" />}
                    {item.type === 'RED' && <span className="inline-block w-2.5 h-3.5 rounded-sm bg-neg" />}
                    {item.type === 'SUB' && <ArrowLeftRight size={16} strokeWidth={1.5} className="text-muted" />}
                    <span className="text-fg">{getPlayerName(item.playerId)}</span>
                  </div>
                ))}
            </div>
          </section>
        </div>
      )}

      {/* NOMINATION TAB */}
      {activeTab === 'nomination' && isMatchOrTournament && (
        <div className="space-y-6">
          <h2 className={sectionTitle}>Nominierung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <section className="card">
              <h3 className="text-sm text-fg2 mb-3">Spielfeld ({nominationField.length})</h3>
              <div className="space-y-2">
                {nominationField.map((playerId) => (
                  <p key={playerId} className="text-[14px] text-fg flex gap-3">
                    <span className="num text-muted w-6">{jerseyNumbers[playerId] || '–'}</span>
                    {getPlayerName(playerId)}
                  </p>
                ))}
              </div>
            </section>
            <section className="card">
              <h3 className="text-sm text-fg2 mb-3">Ersatzbank ({nominationBench.length})</h3>
              <div className="space-y-2">
                {nominationBench.map((playerId) => (
                  <p key={playerId} className="text-[14px] text-fg flex gap-3">
                    <span className="num text-muted w-6">{jerseyNumbers[playerId] || '–'}</span>
                    {getPlayerName(playerId)}
                  </p>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TACTICS TAB */}
      {activeTab === 'tactics' && isMatchOrTournament && (
        <div className="space-y-6">
          <h2 className={sectionTitle}>Aufstellung</h2>

          <div className="max-w-xs">
            <label className={labelClass}>Formation</label>
            <select value={selectedFormation} onChange={(e) => setSelectedFormation(e.target.value)} className={inputClass}>
              {Object.keys(FORMATIONS).map((key) => (
                <option key={key} value={key}>
                  {FORMATIONS[key].name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              {/* Spielfeld mit Kreidelinien */}
              <div className="relative rounded-[12px] border border-line bg-accent/10 aspect-[3/4] md:aspect-[4/3] overflow-hidden">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full text-fg/40" aria-hidden="true">
                  <rect x="4" y="4" width="92" height="92" fill="none" stroke="currentColor" strokeWidth="0.4" />
                  <line x1="4" y1="50" x2="96" y2="50" stroke="currentColor" strokeWidth="0.4" />
                  <circle cx="50" cy="50" r="9" fill="none" stroke="currentColor" strokeWidth="0.4" />
                  <circle cx="50" cy="50" r="0.8" fill="currentColor" />
                  <rect x="25" y="4" width="50" height="16" fill="none" stroke="currentColor" strokeWidth="0.4" />
                  <rect x="25" y="80" width="50" height="16" fill="none" stroke="currentColor" strokeWidth="0.4" />
                </svg>

                <div className="absolute inset-4">
                  {fieldPositions.map((pos) => (
                    <div
                      key={pos.id}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDropOnPosition(pos.id)}
                      className={`absolute w-11 h-11 rounded-full flex items-center justify-center text-[12px] num transition-colors duration-150 ease-ui ${
                        pos.playerId ? 'bg-fg text-bg' : 'bg-card border border-slate-700 text-muted'
                      }`}
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {pos.playerId ? jerseyNumbers[pos.playerId] || '–' : pos.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm text-fg2">Verfügbar</h3>
              <div className="card p-2 space-y-1 max-h-96 overflow-y-auto">
                {nominationField.map((playerId) => {
                  const isPlaced = fieldPositions.some((pos) => pos.playerId === playerId);
                  if (isPlaced) return null;

                  return (
                    <div
                      key={playerId}
                      draggable
                      onDragStart={() => handleDragStart(playerId)}
                      className="h-9 px-2.5 flex items-center gap-3 rounded-lg cursor-grab text-[14px] text-fg hover:bg-raised transition-colors duration-150 ease-ui"
                    >
                      <span className="num text-muted w-6">{jerseyNumbers[playerId] || '–'}</span>
                      {getPlayerName(playerId)}
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
        <div className="space-y-6">
          <h2 className={sectionTitle}>Analyse und Bewertung</h2>

          <section className="card">
            <label className={labelClass}>Spielbericht</label>
            <textarea
              value={eventData.notes}
              onChange={(e) => setEventData({ ...eventData, notes: e.target.value })}
              placeholder="Wie lief das Spiel? Besonderheiten?"
              rows="4"
              className={inputClass}
            />
          </section>

          <section className="card">
            <label className={labelClass}>Nachbereitung</label>
            <textarea
              value={eventData.postMatchAnalysis}
              onChange={(e) => setEventData({ ...eventData, postMatchAnalysis: e.target.value })}
              placeholder="Was lief gut? Was können wir verbessern?"
              rows="4"
              className={inputClass}
            />
          </section>

          <section className="card">
            <h3 className={`${sectionTitle} mb-4`}>Spieler-Bewertungen</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {nominationField.map((playerId) => (
                <div key={playerId} className="flex items-center justify-between gap-4">
                  <span className="text-[14px] text-fg truncate">{getPlayerName(playerId)}</span>
                  <div className="flex gap-1 shrink-0">
                    {[1, 2, 3, 4, 5].map((rating) => {
                      const filled = (eventData.ratings[playerId] || 0) >= rating;
                      return (
                        <button
                          key={rating}
                          type="button"
                          aria-label={`${rating} von 5`}
                          onClick={() =>
                            setEventData({
                              ...eventData,
                              ratings: { ...eventData.ratings, [playerId]: rating },
                            })
                          }
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-raised transition-colors duration-150 ease-ui"
                        >
                          <Star
                            size={16}
                            strokeWidth={1.5}
                            className={filled ? 'text-fg' : 'text-muted'}
                            fill={filled ? 'currentColor' : 'none'}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TRAINING TAB */}
      {activeTab === 'training' && isTraining && (
        <div className="space-y-6">
          <h2 className={sectionTitle}>Trainingsplan</h2>

          <section className="card">
            <label className={labelClass}>Fokus-Bereich</label>
            <input
              type="text"
              value={eventData.trainingFocus}
              onChange={(e) => setEventData({ ...eventData, trainingFocus: e.target.value })}
              placeholder="z.B. Standardsituationen, Defensivtraining, Ballbesitz"
              className={inputClass}
            />
          </section>

          <section className="card">
            <label className={labelClass}>Übungen</label>
            <textarea
              value={eventData.trainingExercises.join('\n')}
              onChange={(e) => setEventData({ ...eventData, trainingExercises: e.target.value.split('\n') })}
              placeholder="Eine Übung pro Zeile"
              rows="4"
              className={inputClass}
            />
          </section>

          <section className="card">
            <label className={labelClass}>Notizen</label>
            <textarea
              value={eventData.notes}
              onChange={(e) => setEventData({ ...eventData, notes: e.target.value })}
              placeholder="Wie lief das Training?"
              rows="4"
              className={inputClass}
            />
          </section>
        </div>
      )}

      {/* CHECKLIST TAB */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          <h2 className={sectionTitle}>{isMatchOrTournament ? 'Nominierte Spieler' : 'Anwesenheit'}</h2>

          {isMatchOrTournament ? (
            <div className="space-y-2">
              {nominatedPlayers.length === 0 ? (
                <div className="card text-center text-fg2 py-8">Keine Spieler nominiert</div>
              ) : (
                nominatedPlayers.map((playerId) => {
                  const player = players.find((p) => p.id === playerId);
                  const att = attendance.find((a) => a.playerId === playerId);
                  const status = att?.status || 'UNKNOWN';
                  const isBench = nominationBench.includes(playerId);

                  return (
                    <div key={playerId} className="card py-3 px-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[15px] text-fg truncate">
                          <span className="num text-muted mr-2">{jerseyNumbers[playerId] || '–'}</span>
                          {player?.firstName} {player?.lastName}
                        </p>
                        <p className="text-[13px] text-muted">{isBench ? 'Ersatzbank' : 'Spielfeld'}</p>
                      </div>
                      <AttendanceToggle
                        status={status}
                        onPresent={() => toggleAttendance(playerId, status)}
                        onAbsent={() => toggleAttendance(playerId, status)}
                      />
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {players.length === 0 ? (
                <div className="card text-center text-fg2 py-8">Keine Spieler vorhanden</div>
              ) : (
                players.map((player) => {
                  const att = attendance.find((a) => a.playerId === player.id);
                  const status = att?.status || 'UNKNOWN';

                  return (
                    <div key={player.id} className="card py-3 px-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[15px] text-fg truncate">
                          {player.firstName} {player.lastName}
                        </p>
                        <p className="text-[13px] text-muted truncate">{player.parentName}</p>
                      </div>
                      <AttendanceToggle
                        status={status}
                        onPresent={() => toggleAttendance(player.id, status)}
                        onAbsent={() => toggleAttendance(player.id, status)}
                      />
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
        <div className="space-y-6">
          <h2 className={sectionTitle}>Fotos und Videos</h2>

          <section className="card">
            <label className={labelClass}>Video-Link</label>
            <input
              type="url"
              value={eventData.videoLink}
              onChange={(e) => setEventData({ ...eventData, videoLink: e.target.value })}
              placeholder="z.B. YouTube-Link"
              className={inputClass}
            />
          </section>

          {eventData.videoLink && (
            <a
              href={eventData.videoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex items-center gap-3 transition-colors duration-150 ease-ui hover:bg-raised"
            >
              <Video size={18} strokeWidth={1.5} className="shrink-0 text-muted" />
              <span className="text-[14px] text-fg">Video öffnen</span>
            </a>
          )}

          <section className="card">
            <label className={labelClass}>Fotos</label>
            <div className="rounded-[12px] border border-dashed border-slate-700 p-8 text-center transition-colors duration-150 ease-ui hover:bg-raised cursor-pointer">
              <Upload size={18} strokeWidth={1.5} className="mx-auto text-muted mb-3" />
              <p className="text-[14px] text-fg">Fotos hochladen</p>
              <p className="text-[13px] text-muted mt-1">Dateien hierher ziehen oder auswählen</p>
            </div>
          </section>
        </div>
      )}

      {/* MODALS */}
      {/* Scorer Modal */}
      {showScorerModal && (
        <div className="modal-overlay">
          <div className="modal max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-fg flex items-center gap-2">
                <Target size={18} strokeWidth={1.5} className="text-muted" />
                Tor
              </h2>
              <button type="button" onClick={() => setShowScorerModal(false)} className="text-muted hover:text-fg transition-colors duration-150 ease-ui" aria-label="Schließen">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-4">
              <select className={inputClass}>
                <option>Spieler wählen</option>
                {nominationField.map((playerId) => (
                  <option key={playerId} value={playerId}>
                    {jerseyNumbers[playerId] || '–'} {getPlayerName(playerId)}
                  </option>
                ))}
              </select>

              <input type="number" placeholder="Minute" className={inputClass} min="0" max="120" />

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowScorerModal(false)} className="flex-1 btn btn-secondary">
                  Abbrechen
                </button>
                <button type="button" className="flex-1 btn btn-primary">
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-fg">Karte</h2>
              <button type="button" onClick={() => setShowCardModal(false)} className="text-muted hover:text-fg transition-colors duration-150 ease-ui" aria-label="Schließen">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-4">
              <select className={inputClass}>
                <option>Spieler wählen</option>
                {[...nominationField, ...nominationBench].map((playerId) => (
                  <option key={playerId} value={playerId}>
                    {jerseyNumbers[playerId] || '–'} {getPlayerName(playerId)}
                  </option>
                ))}
              </select>

              <select className={inputClass}>
                <option value="YELLOW">Gelbe Karte</option>
                <option value="RED">Rote Karte</option>
              </select>

              <input type="number" placeholder="Minute" className={inputClass} min="0" max="120" />

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCardModal(false)} className="flex-1 btn btn-secondary">
                  Abbrechen
                </button>
                <button type="button" className="flex-1 btn btn-primary">
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
