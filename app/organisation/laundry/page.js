// app/organisation/laundry/page.js - Untertab "Trikotwäsche"
// Teil 1: Fairness-Glocke - wer hat den geringsten Waschzähler (count ASC, lastWashedAt ASC)
// Teil 2: Trikotsatz-Protokoll - Spieler, Trikotsatz, Ausgegeben am, Rückgabe Soll, Status, Sauberkeits-Check
'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Trash2 } from 'lucide-react';

const STATUS = {
  PLANNED: { label: 'Geplant', cls: 'bg-slate-700 text-slate-200 border-slate-600' },
  TAKEN_HOME: { label: 'Mitgenommen', cls: 'bg-blue-900/50 text-blue-300 border-blue-700' },
  RETURNED: { label: 'Abgegeben', cls: 'bg-green-900/50 text-green-300 border-green-700' },
};

const EMPTY = { playerId: '', jerseySet: 'D2-Heim', returnDue: '', status: 'PLANNED', notes: '' };

export default function LaundryPage() {
  const [players, setPlayers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [pRes, lRes, iRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/laundry'),
        fetch('/api/jersey-issues'),
      ]);
      const [pJson, lJson, iJson] = await Promise.all([pRes.json(), lRes.json(), iRes.json()]);
      if (!pRes.ok || !lRes.ok || !iRes.ok) throw new Error('Daten konnten nicht geladen werden');
      setPlayers(pJson.data || []);
      setLogs(lJson.data || []);
      setIssues(iJson.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const nameOf = (id) => {
    const p = players.find((x) => x.id === id);
    return p ? `${p.firstName} ${p.lastName}` : '–';
  };

  // Fairness: Spieler mit geringstem Zähler zuerst, bei Gleichstand die längste Zeit ohne Wäsche
  const ranking = useMemo(() => {
    const byPlayer = new Map(logs.map((l) => [l.playerId, l]));
    return players
      .map((p) => {
        const log = byPlayer.get(p.id);
        return {
          id: p.id,
          name: `${p.firstName} ${p.lastName}`,
          count: log?.count ?? 0,
          lastWashedAt: log?.lastWashedAt ?? null,
        };
      })
      .sort((a, b) => {
        if (a.count !== b.count) return a.count - b.count;
        const ta = a.lastWashedAt ? new Date(a.lastWashedAt).getTime() : 0;
        const tb = b.lastWashedAt ? new Date(b.lastWashedAt).getTime() : 0;
        return ta - tb;
      });
  }, [players, logs]);

  const next = ranking[0];

  async function addWash(playerId) {
    try {
      const res = await fetch('/api/laundry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
      if (!res.ok) throw new Error('Wäsche konnte nicht eingetragen werden');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function patchIssue(id, data) {
    setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
    try {
      const res = await fetch('/api/jersey-issues', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) throw new Error('Änderung konnte nicht gespeichert werden');
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  async function saveIssue(e) {
    e.preventDefault();
    if (!form.playerId || !form.jerseySet.trim()) {
      setFormError('Spieler und Trikotsatz sind Pflicht');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch('/api/jersey-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, returnDue: form.returnDue || null }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Speichern fehlgeschlagen');
      setModal(false);
      setForm(EMPTY);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    try {
      const res = await fetch(`/api/jersey-issues?id=${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Löschen fehlgeschlagen');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  }

  const fmt = (d) => (d ? new Date(d).toLocaleDateString('de-DE') : '–');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm flex justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="hover:text-white">×</button>
        </div>
      )}

      {/* Fairness-Glocke */}
      <section className="space-y-3">
        <div className="card border-l-4 border-l-yellow-500 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <div className="text-sm text-slate-400">🔔 Wer ist als Nächstes dran?</div>
            {next ? (
              <div className="text-xl font-bold text-white">
                {next.name} <span className="text-base font-normal text-slate-400">· {next.count} Wäsche(n), zuletzt {fmt(next.lastWashedAt)}</span>
              </div>
            ) : (
              <div className="text-slate-400">Noch keine Spieler</div>
            )}
          </div>
          {next && (
            <button onClick={() => addWash(next.id)} className="btn btn-primary">+1 Wäsche eintragen</button>
          )}
        </div>

        {ranking.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-card text-slate-400 text-left">
                <tr>
                  <th className="p-3 font-medium">#</th>
                  <th className="p-3 font-medium">Spieler</th>
                  <th className="p-3 font-medium text-center">Wäschen</th>
                  <th className="p-3 font-medium">Zuletzt gewaschen</th>
                  <th className="p-3 font-medium text-right">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, idx) => (
                  <tr key={r.id} className="border-t border-slate-700">
                    <td className="p-3 text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-medium text-white">{r.name}</td>
                    <td className="p-3 text-center text-slate-300">{r.count}</td>
                    <td className="p-3 text-slate-300">{fmt(r.lastWashedAt)}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => addWash(r.id)} className="btn btn-secondary px-3 py-1">+1 Wäsche</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Trikotsatz-Protokoll */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Trikotsätze</h2>
          <button onClick={() => { setForm(EMPTY); setFormError(null); setModal(true); }} className="btn btn-primary">+ Eintrag</button>
        </div>

        {issues.length === 0 ? (
          <div className="card text-center text-slate-400 py-8">Noch keine Trikotsätze ausgegeben</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-card text-slate-400 text-left">
                <tr>
                  <th className="p-3 font-medium">Spieler</th>
                  <th className="p-3 font-medium">Trikotsatz</th>
                  <th className="p-3 font-medium">Ausgegeben am</th>
                  <th className="p-3 font-medium">Rückgabe Soll</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-center">Sauber ✓</th>
                  <th className="p-3 font-medium text-right">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => {
                  const overdue = i.returnDue && i.status !== 'RETURNED' && new Date(i.returnDue) < new Date();
                  const st = STATUS[i.status] || STATUS.PLANNED;
                  return (
                    <tr key={i.id} className="border-t border-slate-700">
                      <td className="p-3 font-medium text-white">
                        {i.player ? `${i.player.firstName} ${i.player.lastName}` : nameOf(i.playerId)}
                      </td>
                      <td className="p-3 text-slate-300">{i.jerseySet}</td>
                      <td className="p-3 text-slate-300">{fmt(i.issuedAt)}</td>
                      <td className={`p-3 ${overdue ? 'text-red-400 font-semibold' : 'text-slate-300'}`}>
                        {fmt(i.returnDue)}{overdue && ' · überfällig'}
                      </td>
                      <td className="p-3">
                        <select
                          value={i.status}
                          onChange={(e) => patchIssue(i.id, { status: e.target.value })}
                          className={`!w-auto !py-1 text-xs border ${st.cls}`}
                        >
                          <option value="PLANNED">Geplant</option>
                          <option value="TAKEN_HOME">Mitgenommen</option>
                          <option value="RETURNED">Abgegeben</option>
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={i.cleanCheck}
                          onChange={(e) => patchIssue(i.id, { cleanCheck: e.target.checked })}
                          className="w-5 h-5"
                          aria-label="Sauberkeits-Check"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => setDeleteTarget(i)} className="btn btn-danger px-2 py-1" aria-label="Löschen">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal: Trikotsatz eintragen */}
      {modal && (
        <div className="modal-overlay" onClick={() => !saving && setModal(false)}>
          <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Trikotsatz eintragen</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white" aria-label="Schließen"><X size={22} /></button>
            </div>
            <form onSubmit={saveIssue} className="space-y-4">
              <Field label="Spieler *">
                <select value={form.playerId} onChange={(e) => setForm({ ...form, playerId: e.target.value })} required>
                  <option value="">– wählen –</option>
                  {players.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Trikotsatz *"><input value={form.jerseySet} onChange={(e) => setForm({ ...form, jerseySet: e.target.value })} placeholder="z.B. D2-Heim" /></Field>
                <Field label="Rückgabe Soll"><input type="date" value={form.returnDue} onChange={(e) => setForm({ ...form, returnDue: e.target.value })} /></Field>
                <Field label="Status">
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="PLANNED">Geplant</option>
                    <option value="TAKEN_HOME">Mitgenommen</option>
                    <option value="RETURNED">Abgegeben</option>
                  </select>
                </Field>
              </div>
              <Field label="Notiz"><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>

              {formError && <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm">{formError}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 btn btn-secondary" disabled={saving}>Abbrechen</button>
                <button type="submit" className="flex-1 btn btn-primary" disabled={saving}>{saving ? 'Speichert…' : 'Speichern'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Eintrag löschen?</h2>
            <p className="text-slate-300 mb-6">Trikotsatz „{deleteTarget.jerseySet}“ wird aus dem Protokoll entfernt.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 btn btn-secondary">Abbrechen</button>
              <button onClick={confirmDelete} className="flex-1 btn btn-danger">Löschen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-white mb-2">{label}</span>
      {children}
    </label>
  );
}
