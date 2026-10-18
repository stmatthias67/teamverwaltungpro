// app/teammanagement/tactics/page.js - Untertab "Kader / Taktik"
// Ablauf pro Spiel:
// 1. Aufteilung: Spieler auf Spielfeld (Slot), Ersatzbank oder nicht dabei (nicht platziert)
// 2. Rückennummer je Spieler vergeben
// 3. Aufstellung: Spieler auf die Positionskästchen ziehen (oder antippen)
// Speichern schreibt alles über PUT /api/nominations (Status, Rückennummer, Position).
'use client';

import { useEffect, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// Formationen. Koordinaten in % (x: links→rechts, y: 0 = oben/Gegner, 100 = unten/eigenes Tor)
// Reihen werden automatisch gleichmäßig verteilt.
// ---------------------------------------------------------------------------
const ROW_Y = { ST: 14, MF: 40, AB: 66, TW: 90 };

function row(label, count, y) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${label}-${i + 1}`,
    label,
    x: Math.round(((i + 1) * 100) / (count + 1)),
    y,
  }));
}

function formation(parts) {
  // parts: [AB, MF, ST] ohne Torwart; Torwart wird immer ergänzt
  const [ab, mf, st] = parts;
  return [...row('TW', 1, ROW_Y.TW), ...row('AB', ab, ROW_Y.AB), ...row('MF', mf, ROW_Y.MF), ...row('ST', st, ROW_Y.ST)];
}

const FORMATIONS = {
  '7v7-2-3-1': { name: '7v7 · 2-3-1', slots: formation([2, 3, 1]) },
  '9v9-3-3-2': { name: '9v9 · 3-3-2', slots: formation([3, 3, 2]) },
  '9v9-3-2-3': { name: '9v9 · 3-2-3', slots: formation([3, 2, 3]) },
  '11v11-4-3-3': { name: '11v11 · 4-3-3', slots: formation([4, 3, 3]) },
  'halle-5v5': { name: 'Halle · 5v5 (1-2-1)', slots: formation([1, 2, 1]), indoor: true },
};

const GROUPS = ['A', 'B', 'C', 'D'];

export default function KaderTaktikPage() {
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [formationKey, setFormationKey] = useState('11v11-4-3-3');
  const [slots, setSlots] = useState({});          // slotId -> playerId
  const [bench, setBench] = useState([]);          // playerId[]
  const [jerseys, setJerseys] = useState({});      // playerId -> number
  const [selected, setSelected] = useState(null);  // playerId (Tap-Auswahl für Mobile)
  const [dragging, setDragging] = useState(null);  // playerId (Drag-Auswahl Desktop)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const formationDef = FORMATIONS[formationKey];

  useEffect(() => {
    (async () => {
      try {
        const [pRes, eRes] = await Promise.all([fetch('/api/players'), fetch('/api/events')]);
        const [pJson, eJson] = await Promise.all([pRes.json(), eRes.json()]);
        setPlayers(pJson.data || []);
        const games = (eJson.data || [])
          .filter((e) => e.type === 'MATCH' || e.type === 'TOURNAMENT')
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(games);
        if (games.length > 0) setEventId(games[0].id);
      } catch (err) {
        setError('Daten konnten nicht geladen werden');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Nominierung des gewählten Spiels laden
  useEffect(() => {
    if (!eventId) return;
    (async () => {
      try {
        const res = await fetch(`/api/nominations?eventId=${eventId}`);
        const json = await res.json();
        const noms = json.data || [];
        const j = {};
        const b = [];
        const s = {};
        noms.forEach((n) => {
          if (n.jerseyNumber != null) j[n.playerId] = n.jerseyNumber;
          if (n.status === 'BENCH') b.push(n.playerId);
          if (n.status === 'FIELD' && n.position) s[n.position] = n.playerId;
        });
        setJerseys(j);
        setBench(b);
        setSlots(s);
        setSelected(null);
      } catch (err) {
        setError('Nominierung konnte nicht geladen werden');
      }
    })();
  }, [eventId]);

  // Wenn Formation wechselt: Spieler auf Feldslots bleiben nur erhalten, wenn ihr Slot existiert
  useEffect(() => {
    if (!formationDef) return;
    const valid = new Set(formationDef.slots.map((s) => s.id));
    setSlots((prev) => {
      const next = {};
      Object.entries(prev).forEach(([slotId, playerId]) => {
        if (valid.has(slotId)) next[slotId] = playerId;
      });
      return next;
    });
  }, [formationKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-Torwart: Spieler mit Rückennummer 1 steht automatisch im TW-Kasten (wenn frei)
  useEffect(() => {
    const keeper = players.find((p) => Number(jerseys[p.id]) === 1);
    if (!keeper) return;
    const alreadyPlaced = Object.values(slots).includes(keeper.id);
    if (alreadyPlaced) return;
    if (slots['TW-1']) return;
    setSlots((prev) => ({ ...prev, 'TW-1': keeper.id }));
    setBench((prev) => prev.filter((id) => id !== keeper.id));
  }, [jerseys, players]); // eslint-disable-line react-hooks/exhaustive-deps

  const placedIds = useMemo(() => new Set([...Object.values(slots), ...bench]), [slots, bench]);
  const notNominated = useMemo(() => players.filter((p) => !placedIds.has(p.id)), [players, placedIds]);

  const groupedPlayers = useMemo(() => {
    const groups = { A: [], B: [], C: [], D: [], none: [] };
    players.forEach((p) => {
      const g = GROUPS.includes(p.performanceGroup) ? p.performanceGroup : 'none';
      groups[g].push(p);
    });
    return groups;
  }, [players]);

  const nameOf = (id) => {
    const p = players.find((x) => x.id === id);
    return p ? `${p.firstName} ${p.lastName}` : '?';
  };

  // Spieler aus allen Zielen entfernen, dann an Ziel setzen
  function place(playerId, target) {
    setSlots((prev) => {
      const next = {};
      Object.entries(prev).forEach(([k, v]) => {
        if (v !== playerId) next[k] = v;
      });
      if (target.type === 'slot') next[target.id] = playerId;
      return next;
    });
    setBench((prev) => {
      const without = prev.filter((id) => id !== playerId);
      return target.type === 'bench' ? [...without, playerId] : without;
    });
    setSelected(null);
  }

  function removeFromBoard(playerId) {
    place(playerId, { type: 'none' });
  }

  // Firefox startet Drag nur, wenn im dragstart Daten gesetzt werden
  function startDrag(e, playerId) {
    e.dataTransfer.setData('text/plain', playerId);
    e.dataTransfer.effectAllowed = 'move';
    setDragging(playerId);
  }

  function handleSlotTap(slotId) {
    const occupant = slots[slotId];
    if (selected) {
      // Falls Zielslot belegt: Besetzer zurück auf "nicht dabei"
      if (occupant && occupant !== selected) {
        setSlots((prev) => {
          const next = { ...prev };
          delete next[slotId];
          return next;
        });
      }
      place(selected, { type: 'slot', id: slotId });
    } else if (occupant) {
      setSelected(occupant);
    }
  }

  function handleBenchTap() {
    if (selected) place(selected, { type: 'bench' });
  }

  function handleDropSlot(e, slotId) {
    e.preventDefault();
    const pid = dragging || e.dataTransfer.getData('text/plain');
    if (!pid) return;
    const occupant = slots[slotId];
    if (occupant && occupant !== pid) {
      setSlots((prev) => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
    }
    place(pid, { type: 'slot', id: slotId });
    setDragging(null);
  }

  function handleDropBench(e) {
    e.preventDefault();
    const pid = dragging || e.dataTransfer.getData('text/plain');
    if (!pid) return;
    place(pid, { type: 'bench' });
    setDragging(null);
  }

  function handleDropPool(e) {
    e.preventDefault();
    const pid = dragging || e.dataTransfer.getData('text/plain');
    if (!pid) return;
    removeFromBoard(pid);
    setDragging(null);
  }

  function setJersey(playerId, value) {
    const n = value === '' ? null : Number(value);
    if (n !== null && (!Number.isInteger(n) || n < 1 || n > 99)) return;
    setJerseys((prev) => {
      const next = { ...prev };
      if (n === null) delete next[playerId];
      else next[playerId] = n;
      return next;
    });
  }

  async function save() {
    if (!eventId) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const slotOf = {};
      Object.entries(slots).forEach(([slotId, pid]) => (slotOf[pid] = slotId));
      const payload = players.map((p) => {
        if (slotOf[p.id]) {
          return { playerId: p.id, status: 'FIELD', jerseyNumber: jerseys[p.id] ?? null, position: slotOf[p.id] };
        }
        if (bench.includes(p.id)) {
          return { playerId: p.id, status: 'BENCH', jerseyNumber: jerseys[p.id] ?? null, position: null };
        }
        return { playerId: p.id, status: 'NOT_NOMINATED', jerseyNumber: null, position: null };
      });
      const res = await fetch('/api/nominations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, nominations: payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Speichern fehlgeschlagen');
      setMessage('Aufstellung gespeichert');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="card text-center text-slate-400 py-10">
        Noch kein Spiel oder Turnier angelegt. Lege zuerst einen Termin unter Events an.
      </div>
    );
  }

  const field = formationDef.indoor ? 'bg-[#3b2314]' : 'bg-[#1e3a29]';
  const lineColor = formationDef.indoor ? '#f6ad55' : '#48bb78';

  return (
    <div className="space-y-4">
      {/* Kopf: Spiel + Formation + Speichern */}
      <div className="card grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <label>
          <span className="block text-sm text-slate-400 mb-1">Spiel</span>
          <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {new Date(ev.date).toLocaleDateString('de-DE')} · {ev.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-sm text-slate-400 mb-1">Formation / Spielfeld</span>
          <select value={formationKey} onChange={(e) => setFormationKey(e.target.value)}>
            {Object.entries(FORMATIONS).map(([k, f]) => (
              <option key={k} value={k}>{f.name}</option>
            ))}
          </select>
        </label>
        <button onClick={save} disabled={saving} className="btn btn-primary w-full">
          {saving ? 'Speichert…' : 'Aufstellung speichern'}
        </button>
      </div>

      {message && <div className="p-3 bg-green-900/30 border border-green-700 rounded text-green-200 text-sm">✅ {message}</div>}
      {error && <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm">⚠️ {error}</div>}

      <p className="text-xs text-slate-400">
        Tipp: Spieler anklicken (oder ziehen), dann Kasten oder Ersatzbank antippen. Spieler mit Rückennummer 1 steht automatisch im Tor.
        Ohne Platz auf dem Board = nicht dabei.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Links: Spielfeld + Ersatzbank oben */}
        <div className="lg:col-span-2 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 text-sm text-slate-400 self-center">
              Spielfeld · {formationDef.name}
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropBench}
              onClick={handleBenchTap}
              className={`rounded-lg border-2 border-dashed p-3 min-h-[72px] transition ${
                selected ? 'border-primary cursor-pointer' : 'border-slate-600'
              }`}
            >
              <div className="text-xs font-semibold text-slate-400 mb-2">🔄 Ersatzbank ({bench.length})</div>
              <div className="flex flex-wrap gap-2">
                {bench.map((pid) => (
                  <Chip
                    key={pid}
                    label={nameOf(pid)}
                    number={jerseys[pid]}
                    onDragStart={(e) => startDrag(e, pid)}
                    onClick={(e) => { e.stopPropagation(); setSelected(selected === pid ? null : pid); }}
                    active={selected === pid}
                  />
                ))}
                {bench.length === 0 && <span className="text-xs text-slate-500">leer</span>}
              </div>
            </div>
          </div>

          {/* Spielfeld */}
          <div className={`relative w-full aspect-[3/4] sm:aspect-[4/3] rounded-lg border-2 border-slate-600 ${field} overflow-hidden`}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
              <rect x="3" y="3" width="94" height="94" fill="none" stroke={lineColor} strokeWidth="0.4" />
              <line x1="3" y1="50" x2="97" y2="50" stroke={lineColor} strokeWidth="0.4" />
              <circle cx="50" cy="50" r="9" fill="none" stroke={lineColor} strokeWidth="0.4" />
              <rect x="30" y="3" width="40" height="14" fill="none" stroke={lineColor} strokeWidth="0.4" />
              <rect x="30" y="83" width="40" height="14" fill="none" stroke={lineColor} strokeWidth="0.4" />
            </svg>

            {formationDef.slots.map((slot) => {
              const pid = slots[slot.id];
              return (
                <div
                  key={slot.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropSlot(e, slot.id)}
                  onClick={() => handleSlotTap(slot.id)}
                  style={{ left: `${slot.x}%`, top: `${slot.y}%`, transform: 'translate(-50%, -50%)' }}
                  className={`absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center text-center cursor-pointer transition border-2 ${
                    pid
                      ? 'bg-primary border-white text-white shadow-lg'
                      : selected
                        ? 'bg-slate-800/80 border-primary text-slate-200'
                        : 'bg-slate-800/60 border-slate-500 text-slate-400'
                  }`}
                >
                  {pid ? (
                    <div
                      draggable
                      onDragStart={(e) => startDrag(e, pid)}
                      className="w-full h-full flex flex-col items-center justify-center"
                    >
                      <span className="text-[10px] font-bold leading-none">{jerseys[pid] ?? '–'}</span>
                      <span className="text-[9px] leading-tight px-1 truncate w-full">{nameOf(pid).split(' ')[0]}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold">{slot.label}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rechts: Spielerliste nach Gruppen, mit Rückennummer */}
        <div
          className="space-y-3"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropPool}
        >
          <div className="text-sm text-slate-400">
            Kader · {notNominated.length} nicht dabei
          </div>
          {[...GROUPS, 'none'].map((g) => {
            const list = groupedPlayers[g];
            if (!list || list.length === 0) return null;
            return (
              <div key={g} className="card !p-3">
                <div className="text-xs font-semibold text-slate-400 mb-2">
                  {g === 'none' ? 'Ohne Gruppe' : `Gruppe ${g}`}
                </div>
                <div className="space-y-1">
                  {list.map((p) => {
                    const onBoard = placedIds.has(p.id);
                    const isSlot = Object.values(slots).includes(p.id);
                    return (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={(e) => startDrag(e, p.id)}
                        onClick={() => setSelected(selected === p.id ? null : p.id)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-grab transition border ${
                          selected === p.id
                            ? 'border-primary bg-primary/20'
                            : isSlot
                              ? 'border-green-800 bg-green-900/30'
                              : bench.includes(p.id)
                                ? 'border-yellow-800 bg-yellow-900/20'
                                : 'border-slate-700 bg-slate-800/40 hover:border-slate-500'
                        }`}
                      >
                        <input
                          type="number"
                          min="1"
                          max="99"
                          placeholder="#"
                          value={jerseys[p.id] ?? ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setJersey(p.id, e.target.value)}
                          className="!w-12 !p-1 text-center text-sm"
                        />
                        <span className="flex-1 text-sm text-white truncate">{p.firstName} {p.lastName}</span>
                        <span className="text-[10px] text-slate-400">
                          {isSlot ? 'Feld' : bench.includes(p.id) ? 'Bank' : onBoard ? '' : 'nein'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {players.length === 0 && <div className="text-sm text-slate-400">Noch keine Spieler im Kader.</div>}
        </div>
      </div>
    </div>
  );
}

function Chip({ label, number, onClick, onDragStart, active }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-sm cursor-grab border transition ${
        active ? 'border-primary bg-primary/30 text-white' : 'border-yellow-800 bg-yellow-900/30 text-white'
      }`}
    >
      {number != null && <span className="font-bold mr-1">#{number}</span>}
      {label}
    </div>
  );
}
