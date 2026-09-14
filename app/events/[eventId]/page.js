// app/events/[eventId]/page.js (UPDATED VERSION)
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { X } from 'lucide-react';

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

  // Modals
  const [showNominationModal, setShowNominationModal] = useState(false);
  const [showJerseyModal, setShowJerseyModal] = useState(false);
  const [showTacticsModal, setShowTacticsModal] = useState(false);

  // Nomination State
  const [nominationField, setNominationField] = useState([]);
  const [nominationBench, setNominationBench] = useState([]);
  const [notNominated, setNotNominated] = useState([]);

  // Jersey State
  const [jerseyNumbers, setJerseyNumbers] = useState({});

  // Tactics State
  const [selectedFormation, setSelectedFormation] = useState('4-3-3');
  const [tacticsPositions, setTacticsPositions] = useState({});

  const isMatchOrTournament = event && (event.type === 'MATCH' || event.type === 'TOURNAMENT');

  useEffect(() => {
    loadEventData();
  }, [eventId]);

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

      // Initialize jersey numbers from nominations
      const jerseys = {};
      (nominationsData.data || []).forEach((nom) => {
        if (nom.jerseyNumber) {
          jerseys[nom.playerId] = nom.jerseyNumber;
        }
      });
      setJerseyNumbers(jerseys);

      // Initialize nomination groups
      const field = (nominationsData.data || []).filter(n => n.status === 'FIELD').map(n => n.playerId);
      const bench = (nominationsData.data || []).filter(n => n.status === 'BENCH').map(n => n.playerId);
      const notNom = playersData.data.filter(p => !field.includes(p.id) && !bench.includes(p.id)).map(p => p.id);

      setNominationField(field);
      setNominationBench(bench);
      setNotNominated(notNom);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveNominations() {
    try {
      const nominationsList = [
        ...nominationField.map(id => ({ playerId: id, status: 'FIELD' })),
        ...nominationBench.map(id => ({ playerId: id, status: 'BENCH' })),
        ...notNominated.map(id => ({ playerId: id, status: 'NOT_NOMINATED' })),
      ];

      const res = await fetch('/api/nominations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          nominations: nominationsList,
        }),
      });

      if (!res.ok) throw new Error('Nominierungen konnten nicht gespeichert werden');

      setShowNominationModal(false);
      setShowJerseyModal(true);
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveJerseyNumbers() {
    try {
      // Update each nomination with jersey number
      for (const playerId of [...nominationField, ...nominationBench]) {
        const number = jerseyNumbers[playerId];
        if (number) {
          await fetch('/api/nominations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId,
              playerId,
              status: nominationField.includes(playerId) ? 'FIELD' : 'BENCH',
              jerseyNumber: parseInt(number),
            }),
          });
        }
      }

      setShowJerseyModal(false);
      setShowTacticsModal(true);
    } catch (err) {
      setError(err.message);
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

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? `${player.firstName} ${player.lastName}` : 'Unbekannt';
  };

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

      {/* Quick Actions für Match/Tournament */}
      {isMatchOrTournament && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowNominationModal(true)}
            className="btn btn-primary text-sm"
          >
            👥 Nominierung
          </button>
          <button
            onClick={() => setShowJerseyModal(true)}
            className="btn btn-primary text-sm"
          >
            👕 Rückennummern
          </button>
          <button
            onClick={() => setShowTacticsModal(true)}
            className="btn btn-primary text-sm"
          >
            📋 Aufstellung
          </button>
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
        {isMatchOrTournament && (
          <button
            onClick={() => setActiveTab('nominations')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'nominations'
                ? 'text-primary border-b-2 border-primary'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Nominierungen
          </button>
        )}
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
              <p className="text-slate-400 text-sm">Gesamt</p>
              <p className="text-3xl font-bold text-primary">{players.length}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'nominations' && isMatchOrTournament && (
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
            <div className="card">
              <h3 className="font-bold text-slate-400 mb-3">Nicht dabei ({notNominated.length})</h3>
              <div className="space-y-2">
                {notNominated.map(playerId => (
                  <div key={playerId} className="text-sm text-slate-400">
                    {getPlayerName(playerId)}
                  </div>
                ))}
              </div>
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

      {/* NOMINIERUNG MODAL */}
      {showNominationModal && (
        <div className="modal-overlay">
          <div className="modal max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Spieler nominieren</h2>
              <button onClick={() => setShowNominationModal(false)} className="text-slate-400">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Not Nominated */}
              <div className="bg-slate-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                <h3 className="font-bold text-white mb-3">Alle Spieler</h3>
                <div className="space-y-2">
                  {players.map(player => {
                    const inField = nominationField.includes(player.id);
                    const inBench = nominationBench.includes(player.id);
                    if (inField || inBench) return null;

                    return (
                      <div
                        key={player.id}
                        onClick={() => setNominationField([...nominationField, player.id])}
                        className="p-2 bg-slate-700 rounded cursor-pointer hover:bg-primary/50 text-white text-sm"
                      >
                        {player.firstName} {player.lastName}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Field */}
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                <h3 className="font-bold text-green-400 mb-3">Spielfeld ({nominationField.length})</h3>
                <div className="space-y-2">
                  {nominationField.map(playerId => {
                    const player = players.find(p => p.id === playerId);
                    return (
                      <div
                        key={playerId}
                        onClick={() => setNominationField(nominationField.filter(id => id !== playerId))}
                        className="p-2 bg-green-700 rounded cursor-pointer hover:bg-red-600/50 text-white text-sm"
                      >
                        {player?.firstName} {player?.lastName}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bench */}
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                <h3 className="font-bold text-yellow-400 mb-3">Ersatzbank ({nominationBench.length})</h3>
                <div className="space-y-2">
                  {nominationBench.map(playerId => {
                    const player = players.find(p => p.id === playerId);
                    return (
                      <div
                        key={playerId}
                        onClick={() => setNominationBench(nominationBench.filter(id => id !== playerId))}
                        className="p-2 bg-yellow-700 rounded cursor-pointer hover:bg-red-600/50 text-white text-sm"
                      >
                        {player?.firstName} {player?.lastName}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowNominationModal(false)} className="flex-1 btn btn-secondary">
                Abbrechen
              </button>
              <button onClick={saveNominations} className="flex-1 btn btn-primary">
                Weiter zu Rückennummern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JERSEY MODAL */}
      {showJerseyModal && (
        <div className="modal-overlay">
          <div className="modal max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Rückennummern vergeben</h2>
              <button onClick={() => setShowJerseyModal(false)} className="text-slate-400">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
              {[...nominationField, ...nominationBench].map(playerId => {
                const player = players.find(p => p.id === playerId);
                return (
                  <div key={playerId} className="flex items-center gap-3">
                    <span className="flex-1 text-white">{player?.firstName} {player?.lastName}</span>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={jerseyNumbers[playerId] || ''}
                      onChange={(e) => setJerseyNumbers({ ...jerseyNumbers, [playerId]: e.target.value })}
                      placeholder="Nr."
                      className="w-20"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowJerseyModal(false)} className="flex-1 btn btn-secondary">
                Abbrechen
              </button>
              <button onClick={saveJerseyNumbers} className="flex-1 btn btn-primary">
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TACTICS MODAL */}
      {showTacticsModal && (
        <div className="modal-overlay">
          <div className="modal max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Aufstellung erstellen</h2>
              <button onClick={() => setShowTacticsModal(false)} className="text-slate-400">
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-white mb-2 text-sm font-medium">Formation</label>
              <select
                value={selectedFormation}
                onChange={(e) => setSelectedFormation(e.target.value)}
                className="w-full"
              >
                <option value="4-3-3">4-3-3</option>
                <option value="4-4-2">4-4-2</option>
                <option value="3-5-2">3-5-2</option>
                <option value="5-3-2">5-3-2</option>
              </select>
            </div>

            <div className="bg-green-900/20 border-2 border-green-600 rounded-lg p-8 mb-6 aspect-video flex items-center justify-center">
              <div className="text-center">
                <p className="text-white text-2xl font-bold">Fußballfeld</p>
                <p className="text-slate-400 text-sm mt-2">Formation: {selectedFormation}</p>
                <p className="text-slate-400 text-sm">Spieler auf Positionen ziehen</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowTacticsModal(false)} className="flex-1 btn btn-secondary">
                Abbrechen
              </button>
              <button onClick={() => setShowTacticsModal(false)} className="flex-1 btn btn-primary">
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
