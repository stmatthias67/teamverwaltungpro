'use client';

// components/ParticipationGrid.js
// Gemeinsame Logik für Trainingsbeteiligung (TRAINING) und Spielbeteiligung (MATCH/TOURNAMENT).
// Raster: Zeilen = Spieler, Spalten = Termine. Klick auf "x" (anwesend) / "n" (abwesend).
// Zeitraum-Filter, Zähler und Quote berechnen sich nur auf die sichtbaren Termine.

import { useEffect, useMemo, useState } from 'react';

const SCORE_RE = /^\s*(\d{1,2})\s*:\s*(\d{1,2})\s*$/;

export default function ParticipationGrid({ eventTypes, showScore = false, emptyText }) {
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [scoreDrafts, setScoreDrafts] = useState({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [pRes, eRes, aRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/events'),
        fetch('/api/attendance'),
      ]);
      const [pJson, eJson, aJson] = await Promise.all([pRes.json(), eRes.json(), aRes.json()]);
      if (!pRes.ok || !eRes.ok || !aRes.ok) throw new Error('Daten konnten nicht geladen werden');
      setPlayers(pJson.data || []);
      setEvents(eJson.data || []);
      setAttendance(aJson.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Termine dieses Typs im gewählten Zeitraum, chronologisch
  const columns = useMemo(() => {
    const fromTs = from ? new Date(from + 'T00:00:00').getTime() : -Infinity;
    const toTs = to ? new Date(to + 'T23:59:59').getTime() : Infinity;
    return events
      .filter((e) => eventTypes.includes(e.type))
      .filter((e) => {
        const t = new Date(e.date).getTime();
        return t >= fromTs && t <= toTs;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events, eventTypes, from, to]);

  // Schneller Zugriff: "eventId|playerId" -> status
  const statusMap = useMemo(() => {
    const m = new Map();
    attendance.forEach((a) => m.set(`${a.eventId}|${a.playerId}`, a.status));
    return m;
  }, [attendance]);

  const stats = useMemo(() => {
    const total = columns.length;
    return players.map((p) => {
      let present = 0;
      let absent = 0;
      columns.forEach((c) => {
        const s = statusMap.get(`${c.id}|${p.id}`);
        if (s === 'PRESENT') present++;
        if (s === 'ABSENT') absent++;
      });
      const quota = total > 0 ? Math.round((present / total) * 100) : null;
      return { playerId: p.id, present, absent, quota };
    });
  }, [players, columns, statusMap]);

  const statsById = useMemo(() => {
    const m = new Map();
    stats.forEach((s) => m.set(s.playerId, s));
    return m;
  }, [stats]);

  // Anwesenheit setzen. Gleicher Button erneut = Eintrag leeren.
  async function setStatus(eventId, playerId, current, next) {
    const prevAttendance = attendance;
    try {
      if (current === next) {
        // Eintrag entfernen
        setAttendance((prev) => prev.filter((a) => !(a.eventId === eventId && a.playerId === playerId)));
        const res = await fetch(`/api/attendance?eventId=${eventId}&playerId=${playerId}`, { method: 'DELETE' });
        if (!res.ok && res.status !== 404) throw new Error('Eintrag konnte nicht entfernt werden');
      } else {
        // Optimistisch aktualisieren
        setAttendance((prev) => {
          const others = prev.filter((a) => !(a.eventId === eventId && a.playerId === playerId));
          return [...others, { eventId, playerId, status: next }];
        });
        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId, playerId, status: next }),
        });
        if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      }
    } catch (err) {
      setAttendance(prevAttendance);
      setError(err.message);
    }
  }

  async function saveScore(event) {
    const draft = scoreDrafts[event.id];
    if (draft === undefined) return;
    const m = SCORE_RE.exec(draft);
    if (!m) {
      setError('Ergebnis bitte im Format 00:00 eingeben');
      return;
    }
    const scoreHome = Number(m[1]);
    const scoreAway = Number(m[2]);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoreHome, scoreAway }),
      });
      if (!res.ok) throw new Error('Ergebnis konnte nicht gespeichert werden');
      setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, scoreHome, scoreAway } : e)));
      setScoreDrafts((prev) => {
        const next = { ...prev };
        delete next[event.id];
        return next;
      });
    } catch (err) {
      setError(err.message);
    }
  }

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Zeitraum-Filter */}
      <div className="card flex flex-col sm:flex-row gap-3 sm:items-end">
        <label className="flex-1">
          <span className="block text-sm text-slate-400 mb-1">Von</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="flex-1">
          <span className="block text-sm text-slate-400 mb-1">Bis</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button
          onClick={() => { setFrom(''); setTo(''); }}
          className="btn btn-secondary"
          disabled={!from && !to}
        >
          Zeitraum zurücksetzen
        </button>
        <div className="text-sm text-slate-400 sm:pb-2">
          {columns.length} {columns.length === 1 ? 'Termin' : 'Termine'} im Zeitraum
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm flex justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-red-200 hover:text-white">×</button>
        </div>
      )}

      {columns.length === 0 ? (
        <div className="card text-center text-slate-400 py-10">{emptyText}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="text-sm border-collapse">
            <thead className="bg-card">
              <tr>
                <th className="sticky left-0 bg-card p-3 text-left text-slate-400 font-medium min-w-[180px] z-10">Spieler</th>
                {columns.map((c) => (
                  <th key={c.id} className="p-2 text-center font-medium text-slate-300 min-w-[96px] align-top">
                    <div className="text-xs text-slate-400">{fmtDate(c.date)}</div>
                    <div className="text-xs truncate max-w-[120px] mx-auto" title={c.title}>{c.title}</div>
                  </th>
                ))}
                <th className="p-3 text-center text-slate-400 font-medium">Anw.</th>
                <th className="p-3 text-center text-slate-400 font-medium">Abw.</th>
                <th className="p-3 text-center text-slate-400 font-medium">Quote</th>
              </tr>
            </thead>

            {showScore && (
              <tbody>
                <tr className="border-t border-slate-700 bg-slate-800/40">
                  <td className="sticky left-0 bg-slate-800/40 p-2 text-slate-400 text-xs z-10">Ergebnis (00:00)</td>
                  {columns.map((c) => {
                    const shown = c.scoreHome != null && c.scoreAway != null
                      ? `${String(c.scoreHome).padStart(2, '0')}:${String(c.scoreAway).padStart(2, '0')}`
                      : '';
                    const draft = scoreDrafts[c.id];
                    return (
                      <td key={c.id} className="p-2 text-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="00:00"
                          className="w-20 text-center"
                          value={draft !== undefined ? draft : shown}
                          onChange={(e) => setScoreDrafts({ ...scoreDrafts, [c.id]: e.target.value })}
                          onBlur={() => saveScore(c)}
                          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        />
                      </td>
                    );
                  })}
                  <td colSpan={3} />
                </tr>
              </tbody>
            )}

            <tbody>
              {players.map((p) => {
                const s = statsById.get(p.id) || { present: 0, absent: 0, quota: null };
                return (
                  <tr key={p.id} className="border-t border-slate-700">
                    <td className="sticky left-0 bg-main p-3 font-medium text-white whitespace-nowrap z-10">
                      {p.firstName} {p.lastName}
                      {p.performanceGroup && <span className="ml-2 text-xs text-slate-400">{p.performanceGroup}</span>}
                    </td>
                    {columns.map((c) => {
                      const st = statusMap.get(`${c.id}|${p.id}`);
                      return (
                        <td key={c.id} className="p-2 text-center">
                          <div className="inline-flex rounded-md overflow-hidden border border-slate-600">
                            <button
                              onClick={() => setStatus(c.id, p.id, st, 'PRESENT')}
                              className={`px-2.5 py-1 text-xs font-bold transition ${
                                st === 'PRESENT' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-green-900/60'
                              }`}
                              aria-label="anwesend"
                            >
                              x
                            </button>
                            <button
                              onClick={() => setStatus(c.id, p.id, st, 'ABSENT')}
                              className={`px-2.5 py-1 text-xs font-bold transition ${
                                st === 'ABSENT' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-red-900/60'
                              }`}
                              aria-label="abwesend"
                            >
                              n
                            </button>
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-3 text-center text-green-400 font-semibold">{s.present}</td>
                    <td className="p-3 text-center text-red-400 font-semibold">{s.absent}</td>
                    <td className="p-3 text-center min-w-[120px]">
                      {s.quota === null ? (
                        <span className="text-slate-500">–</span>
                      ) : (
                        <div>
                          <div className="font-bold text-white">{s.quota} %</div>
                          <div className="h-1.5 bg-slate-700 rounded mt-1 overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${s.quota}%` }} />
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
