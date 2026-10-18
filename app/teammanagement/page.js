// app/teammanagement/page.js - Untertab "Spielberechtigungsliste"
'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Pencil, Trash2, Phone, MessageCircle } from 'lucide-react';

const EMPTY = {
  firstName: '',
  lastName: '',
  birthYear: '',
  strongFoot: '',
  performanceGroup: '',
  nationality: '',
  parentName: '',
  parentPhone: '',
  parentWhatsapp: '',
};

const GROUP_STYLE = {
  A: 'bg-green-900/50 text-green-300 border-green-700',
  B: 'bg-blue-900/50 text-blue-300 border-blue-700',
  C: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  D: 'bg-slate-700 text-slate-300 border-slate-600',
};

export default function SpielberechtigungPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [modal, setModal] = useState(null); // null | { mode: 'create' | 'edit', id? }
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
      const res = await fetch('/api/players');
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Spieler konnten nicht geladen werden');
      setPlayers(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((p) => {
      if (groupFilter !== 'ALL' && p.performanceGroup !== groupFilter) return false;
      if (!q) return true;
      return (
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        (p.parentName || '').toLowerCase().includes(q)
      );
    });
  }, [players, search, groupFilter]);

  function openCreate() {
    setForm(EMPTY);
    setFormError(null);
    setModal({ mode: 'create' });
  }

  function openEdit(p) {
    setForm({
      firstName: p.firstName || '',
      lastName: p.lastName || '',
      birthYear: p.birthYear ?? '',
      strongFoot: p.strongFoot || '',
      performanceGroup: p.performanceGroup || '',
      nationality: p.nationality || '',
      parentName: p.parentName || '',
      parentPhone: p.parentPhone || '',
      parentWhatsapp: p.parentWhatsapp || '',
    });
    setFormError(null);
    setModal({ mode: 'edit', id: p.id });
  }

  async function save(e) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError('Vor- und Nachname sind Pflicht');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const isEdit = modal.mode === 'edit';
      const res = await fetch(isEdit ? `/api/players/${modal.id}` : '/api/players', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Speichern fehlgeschlagen');
      setModal(null);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    try {
      const res = await fetch(`/api/players/${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Löschen fehlgeschlagen');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="text-sm text-slate-400">{players.length} Spieler im Kader</div>
        <button onClick={openCreate} className="btn btn-primary">+ Spieler hinzufügen</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Nach Name oder Elternteil suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="sm:w-48">
          <option value="ALL">Alle Gruppen</option>
          <option value="A">Gruppe A</option>
          <option value="B">Gruppe B</option>
          <option value="C">Gruppe C</option>
          <option value="D">Gruppe D</option>
        </select>
      </div>

      {error && <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">⚠️ {error}</div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-primary rounded-full animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="card text-center text-slate-400 py-10">
          {players.length === 0 ? 'Noch keine Spieler angelegt' : 'Keine Treffer'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-card text-slate-400 text-left">
              <tr>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Jahrgang</th>
                <th className="p-3 font-medium">Fuß</th>
                <th className="p-3 font-medium">Gruppe</th>
                <th className="p-3 font-medium">Nationalität</th>
                <th className="p-3 font-medium">Eltern</th>
                <th className="p-3 font-medium text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                  <td className="p-3 font-medium text-white">{p.firstName} {p.lastName}</td>
                  <td className="p-3 text-slate-300">{p.birthYear ?? '–'}</td>
                  <td className="p-3 text-slate-300">{p.strongFoot ?? '–'}</td>
                  <td className="p-3">
                    {p.performanceGroup ? (
                      <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${GROUP_STYLE[p.performanceGroup]}`}>
                        {p.performanceGroup}
                      </span>
                    ) : '–'}
                  </td>
                  <td className="p-3 text-slate-300">{p.nationality || '–'}</td>
                  <td className="p-3 text-slate-300">
                    <div>{p.parentName || '–'}</div>
                    <div className="flex gap-2 mt-1">
                      {p.parentPhone && (
                        <a href={`tel:${p.parentPhone}`} className="text-blue-400 hover:underline inline-flex items-center gap-1 text-xs">
                          <Phone size={12} /> {p.parentPhone}
                        </a>
                      )}
                      {p.parentWhatsapp && /^\+?[0-9\s]+$/.test(p.parentWhatsapp) && (
                        <a
                          href={`https://wa.me/${p.parentWhatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                        >
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="btn btn-secondary px-2 py-1" aria-label="Bearbeiten">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="btn btn-danger px-2 py-1" aria-label="Löschen">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Formular: anlegen / bearbeiten */}
      {modal && (
        <div className="modal-overlay" onClick={() => !saving && setModal(null)}>
          <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">
                {modal.mode === 'edit' ? 'Spieler bearbeiten' : 'Spieler hinzufügen'}
              </h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-white" aria-label="Schließen">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Vorname *"><input value={form.firstName} onChange={set('firstName')} required /></Field>
                <Field label="Nachname *"><input value={form.lastName} onChange={set('lastName')} required /></Field>
                <Field label="Geburtsjahrgang">
                  <input type="number" min="2000" max="2030" placeholder="z.B. 2013" value={form.birthYear} onChange={set('birthYear')} />
                </Field>
                <Field label="Starker Fuß">
                  <select value={form.strongFoot} onChange={set('strongFoot')}>
                    <option value="">–</option>
                    <option value="R">R = Rechtsfuß</option>
                    <option value="L">L = Linksfuß</option>
                  </select>
                </Field>
                <Field label="Leistungsgruppe">
                  <select value={form.performanceGroup} onChange={set('performanceGroup')}>
                    <option value="">–</option>
                    <option value="A">Gruppe A</option>
                    <option value="B">Gruppe B</option>
                    <option value="C">Gruppe C</option>
                    <option value="D">Gruppe D</option>
                  </select>
                </Field>
                <Field label="Staatsangehörigkeit"><input value={form.nationality} onChange={set('nationality')} placeholder="z.B. deutsch" /></Field>
                <Field label="Elternteil / Erziehungsberechtigte"><input value={form.parentName} onChange={set('parentName')} /></Field>
                <Field label="Telefon"><input type="tel" value={form.parentPhone} onChange={set('parentPhone')} /></Field>
                <Field label="WhatsApp (Nummer)">
                  <input type="tel" placeholder="+49 170 1234567" value={form.parentWhatsapp} onChange={set('parentWhatsapp')} />
                </Field>
              </div>

              {formError && <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm">{formError}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 btn btn-secondary" disabled={saving}>Abbrechen</button>
                <button type="submit" className="flex-1 btn btn-primary" disabled={saving}>
                  {saving ? 'Speichert…' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Löschen bestätigen */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Spieler löschen?</h2>
            <p className="text-slate-300 mb-6">
              {deleteTarget.firstName} {deleteTarget.lastName} wird samt Anwesenheit und Nominierungen entfernt.
            </p>
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
