'use client';

// components/ParticipationGrid.js
// Gemeinsame Logik für Trainingsbeteiligung (TRAINING) und Spielbeteiligung (MATCH/TOURNAMENT).
// Raster: Zeilen = Spieler, Spalten = Termine. Klick auf "x" (anwesend) / "n" (abwesend).
// Zeitraum-Filter, Zähler und Quote berechnen sich nur auf die sichtbaren Termine.

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

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
    return <p className="py-12 text-center text-muted">Lädt …</p>;
  }

  return (
    <div className="space-y-4">
      {/* Zeitraum-Filter */}
      <div className="card flex flex-col sm:flex-row gap-3 sm:items-end">
        <label className="flex-1">
          <span className="block text-[13px] text-fg2 mb-1.5">Von</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="flex-1">
          <span className="block text-[13px] text-fg2 mb-1.5">Bis</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button
          onClick={() => { setFrom(''); setTo(''); }}
          className="btn btn-secondary"
          disabled={!from && !to}
        >
          Zeitraum zurücksetzen
        </button>
        <div className="text-fg2 num sm:pb-2">
          {columns.length} {columns.length === 1 ? 'Termin' : 'Termine'} im Zeitraum
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-neg/10 px-3 py-2.5 text-[13px] text-neg">
          <span className="flex items-center gap-2">
            <AlertTriangle size={16} strokeWidth={1.5} className="shrink-0" />
            {error}
          </span>
          <button onClick={() => setError(null)} className="text-neg hover:opacity-80" aria-label="Meldung schließen">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {columns.length === 0 ? (
        <div className="card text-center text-fg2 py-10">{emptyText}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="text-sm border-collapse">
            <thead className="bg-card">
              <tr>
                <th className="sticky left-0 bg-card p-3 text-left text-[12px] font-medium text-muted min-w-[180px] z-10">Spieler</th>
                {columns.map((c) => (
                  <th key={c.id} className="p-2 text-center font-medium text-fg2 min-w-[96px] align-top">
                    <div className="text-[12px] text-muted num">{fmtDate(c.date)}</div>
                    <div className="text-[12px] truncate max-w-[120px] mx-auto" title={c.title}>{c.title}</div>
                  </th>
                ))}
                <th className="p-3 text-center text-[12px] font-medium text-muted">Anw.</th>
                <th className="p-3 text-center text-[12px] font-medium text-muted">Abw.</th>
                <th className="p-3 text-center text-[12px] font-medium text-muted">Quote</th>
              </tr>
            </thead>

            {showScore && (
              <tbody>
                <tr className="border-t border-line bg-raised/50">
                  <td className="sticky left-0 bg-raised p-2 text-muted text-[12px] z-10">Ergebnis (00:00)</td>
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
                          className="w-20 text-center num"
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
                  <tr key={p.id} className="border-t border-line hover:bg-raised/40 transition-colors duration-150 ease-ui">
                    <td className="sticky left-0 bg-bg p-3 text-fg whitespace-nowrap z-10">
                      {p.firstName} {p.lastName}
                      {p.performanceGroup && <span className="ml-2 text-[12px] text-muted">{p.performanceGroup}</span>}
                    </td>
                    {columns.map((c) => {
                      const st = statusMap.get(`${c.id}|${p.id}`);
                      return (
                        <td key={c.id} className="p-2 text-center">
                          <div className="inline-flex overflow-hidden rounded-lg border border-line">
                            <button
                              onClick={() => setStatus(c.id, p.id, st, 'PRESENT')}
                              className={`h-7 w-9 text-[13px] transition-colors duration-150 ease-ui ${
                                st === 'PRESENT' ? 'bg-accent/20 text-accent font-medium' : 'text-muted hover:text-fg hover:bg-raised'
                              }`}
                              aria-label="anwesend"
                            >
                              x
                            </button>
                            <button
                              onClick={() => setStatus(c.id, p.id, st, 'ABSENT')}
                              className={`h-7 w-9 text-[13px] transition-colors duration-150 ease-ui ${
                                st === 'ABSENT' ? 'bg-neg/15 text-neg font-medium' : 'text-muted hover:text-fg hover:bg-raised'
                              }`}
                              aria-label="abwesend"
                            >
                              n
                            </button>
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-3 text-center num text-fg">{s.present}</td>
                    <td className="p-3 text-center num text-fg2">{s.absent}</td>
                    <td className="p-3 text-center min-w-[120px]">
                      {s.quota === null ? (
                        <span className="text-muted">–</span>
                      ) : (
                        <div>
                          <div className="num text-fg">{s.quota} %</div>
                          <div className="h-1 rounded-full bg-raised mt-1.5 overflow-hidden">
                            <div className="h-full rounded-full bg-accent" style={{ width: `${s.quota}%` }} />
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
