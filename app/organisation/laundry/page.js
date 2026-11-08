// app/organisation/laundry/page.js - Untertab "Trikotwäsche"
// Teil 1: Fairness-Glocke - wer hat den geringsten Waschzähler (count ASC, lastWashedAt ASC)
// Teil 2: Trikotsatz-Protokoll - Spieler, Trikotsatz, Ausgegeben am, Rückgabe Soll, Status, Sauberkeits-Check
'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Trash2, Bell, Plus, AlertTriangle } from 'lucide-react';

const STATUS = {
  PLANNED: { label: 'Geplant', cls: 'text-fg2' },
  TAKEN_HOME: { label: 'Mitgenommen', cls: 'text-fg' },
  RETURNED: { label: 'Abgegeben', cls: 'text-pos' },
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
    return <p className="py-12 text-center text-muted">Lädt …</p>;
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-line bg-raised p-3 text-sm text-neg">
          <span className="flex items-center gap-2">
            <AlertTriangle size={16} strokeWidth={1.5} className="shrink-0" />
            {error}
          </span>
          <button type="button" onClick={() => setError(null)} className="text-muted transition-colors duration-150 ease-ui hover:text-fg" aria-label="Meldung schließen">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Fairness-Glocke */}
      <section className="space-y-3">
        <div className="card flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[13px] text-muted">
              <Bell size={16} strokeWidth={1.5} />
              Als Nächstes dran
            </div>
            {next ? (
              <div className="text-lg font-medium text-fg">
                {next.name}
                <span className="ml-2 text-sm font-normal text-fg2">
                  {next.count} {next.count === 1 ? 'Wäsche' : 'Wäschen'}, zuletzt {fmt(next.lastWashedAt)}
                </span>
              </div>
            ) : (
              <div className="text-muted">Noch keine Spieler</div>
            )}
          </div>
          {next && (
            <button type="button" onClick={() => addWash(next.id)} className="btn btn-primary">
              <Plus size={16} strokeWidth={1.5} />
              Wäsche eintragen
            </button>
          )}
        </div>

        {ranking.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="text-left text-[13px] text-muted">
                <tr>
                  <th className="px-3 py-3 font-normal">#</th>
                  <th className="px-3 py-3 font-normal">Spieler</th>
                  <th className="px-3 py-3 text-right font-normal">Wäschen</th>
                  <th className="px-3 py-3 font-normal">Zuletzt gewaschen</th>
                  <th className="px-3 py-3 text-right font-normal">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, idx) => (
                  <tr key={r.id} className="border-t border-line transition-colors duration-150 ease-ui hover:bg-raised">
                    <td className="num px-3 py-3 text-muted">{idx + 1}</td>
                    <td className="px-3 py-3 font-medium text-fg">{r.name}</td>
                    <td className="num px-3 py-3 text-right text-fg2">{r.count}</td>
                    <td className="num px-3 py-3 text-fg2">{fmt(r.lastWashedAt)}</td>
                    <td className="px-3 py-3 text-right">
                      <button type="button" onClick={() => addWash(r.id)} className="btn btn-secondary">+1 Wäsche</button>
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-fg">Trikotsätze</h2>
          <button type="button" onClick={() => { setForm(EMPTY); setFormError(null); setModal(true); }} className="btn btn-primary">
            <Plus size={16} strokeWidth={1.5} />
            Eintrag
          </button>
        </div>

        {issues.length === 0 ? (
          <div className="card py-8 text-center text-muted">Noch keine Trikotsätze ausgegeben</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="text-left text-[13px] text-muted">
                <tr>
                  <th className="px-3 py-3 font-normal">Spieler</th>
                  <th className="px-3 py-3 font-normal">Trikotsatz</th>
                  <th className="px-3 py-3 font-normal">Ausgegeben am</th>
                  <th className="px-3 py-3 font-normal">Rückgabe Soll</th>
                  <th className="px-3 py-3 font-normal">Status</th>
                  <th className="px-3 py-3 text-center font-normal">Sauber</th>
                  <th className="px-3 py-3 text-right font-normal">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => {
                  const overdue = i.returnDue && i.status !== 'RETURNED' && new Date(i.returnDue) < new Date();
                  const st = STATUS[i.status] || STATUS.PLANNED;
                  return (
                    <tr key={i.id} className="border-t border-line transition-colors duration-150 ease-ui hover:bg-raised">
                      <td className="px-3 py-3 font-medium text-fg">
                        {i.player ? `${i.player.firstName} ${i.player.lastName}` : nameOf(i.playerId)}
                      </td>
                      <td className="px-3 py-3 text-fg2">{i.jerseySet}</td>
                      <td className="num px-3 py-3 text-fg2">{fmt(i.issuedAt)}</td>
                      <td className={`num px-3 py-3 ${overdue ? 'text-neg' : 'text-fg2'}`}>
                        {fmt(i.returnDue)}{overdue && <span className="ml-2 text-[13px]">überfällig</span>}
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={i.status}
                          onChange={(e) => patchIssue(i.id, { status: e.target.value })}
                          aria-label="Status"
                          className={`!w-auto !py-1 text-[13px] ${st.cls}`}
                        >
                          <option value="PLANNED">Geplant</option>
                          <option value="TAKEN_HOME">Mitgenommen</option>
                          <option value="RETURNED">Abgegeben</option>
                        </select>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={i.cleanCheck}
                          onChange={(e) => patchIssue(i.id, { cleanCheck: e.target.checked })}
                          className="h-4 w-4"
                          aria-label="Sauberkeits-Check"
                        />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(i)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted transition-colors duration-150 ease-ui hover:text-neg"
                          aria-label="Löschen"
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-medium text-fg">Trikotsatz eintragen</h2>
              <button type="button" onClick={() => setModal(false)} className="text-muted transition-colors duration-150 ease-ui hover:text-fg" aria-label="Schließen"><X size={20} strokeWidth={1.5} /></button>
            </div>
            <form onSubmit={saveIssue} className="space-y-4">
              <Field label="Spieler *">
                <select value={form.playerId} onChange={(e) => setForm({ ...form, playerId: e.target.value })} required>
                  <option value="">Wählen</option>
                  {players.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              {formError && <div className="rounded-lg border border-line bg-raised p-3 text-sm text-neg">{formError}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn btn-secondary flex-1" disabled={saving}>Abbrechen</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>{saving ? 'Speichert …' : 'Speichern'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-xl font-medium text-fg">Eintrag löschen?</h2>
            <p className="mb-6 text-fg2">Trikotsatz „{deleteTarget.jerseySet}“ wird aus dem Protokoll entfernt.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="btn btn-secondary flex-1">Abbrechen</button>
              <button type="button" onClick={confirmDelete} className="btn btn-danger flex-1">Löschen</button>
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
      <span className="mb-2 block text-sm text-fg2">{label}</span>
      {children}
    </label>
  );
}
