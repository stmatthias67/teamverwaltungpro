// app/teammanagement/page.js - Untertab "Spielberechtigungsliste"
'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Pencil, Trash2, Phone, MessageCircle, Plus, AlertTriangle } from 'lucide-react';

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

// Gruppe A hebt sich über die Akzentfarbe ab, die übrigen bleiben ruhig
const GROUP_STYLE = {
  A: 'bg-accent/15 text-accent',
  B: 'bg-raised text-fg2',
  C: 'bg-raised text-fg2',
  D: 'bg-raised text-muted',
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
        <div className="text-fg2 num">{players.length} Spieler im Kader</div>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus size={16} strokeWidth={1.5} />
          Spieler hinzufügen
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Nach Name oder Elternteil suchen"
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

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-neg/10 px-3 py-2.5 text-[13px] text-neg">
          <AlertTriangle size={16} strokeWidth={1.5} className="shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-muted">Lädt …</p>
      ) : visible.length === 0 ? (
        <div className="card text-center text-fg2 py-10">
          {players.length === 0 ? 'Noch keine Spieler angelegt' : 'Keine Treffer'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-card text-left">
              <tr>
                <th className="p-3 font-medium text-[12px] text-muted">Name</th>
                <th className="p-3 font-medium text-[12px] text-muted">Jahrgang</th>
                <th className="p-3 font-medium text-[12px] text-muted">Fuß</th>
                <th className="p-3 font-medium text-[12px] text-muted">Gruppe</th>
                <th className="p-3 font-medium text-[12px] text-muted">Nationalität</th>
                <th className="p-3 font-medium text-[12px] text-muted">Eltern</th>
                <th className="p-3 font-medium text-[12px] text-muted text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className="border-t border-line hover:bg-raised/40 transition-colors duration-150 ease-ui">
                  <td className="p-3 text-fg">{p.firstName} {p.lastName}</td>
                  <td className="p-3 num text-fg2">{p.birthYear ?? '–'}</td>
                  <td className="p-3 text-fg2">{p.strongFoot ?? '–'}</td>
                  <td className="p-3">
                    {p.performanceGroup ? (
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[12px] font-medium ${GROUP_STYLE[p.performanceGroup]}`}>
                        {p.performanceGroup}
                      </span>
                    ) : (
                      <span className="text-muted">–</span>
                    )}
                  </td>
                  <td className="p-3 text-fg2">{p.nationality || '–'}</td>
                  <td className="p-3 text-fg2">
                    <div>{p.parentName || '–'}</div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {p.parentPhone && (
                        <a href={`tel:${p.parentPhone}`} className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-fg transition-colors duration-150 ease-ui">
                          <Phone size={14} strokeWidth={1.5} /> {p.parentPhone}
                        </a>
                      )}
                      {p.parentWhatsapp && /^\+?[0-9\s]+$/.test(p.parentWhatsapp) && (
                        <a
                          href={`https://wa.me/${p.parentWhatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-fg transition-colors duration-150 ease-ui"
                        >
                          <MessageCircle size={14} strokeWidth={1.5} /> WhatsApp
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="btn btn-secondary h-8 w-8 px-0" aria-label="Bearbeiten">
                        <Pencil size={16} strokeWidth={1.5} />
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="btn btn-danger h-8 w-8 px-0" aria-label="Löschen">
                        <Trash2 size={16} strokeWidth={1.5} />
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[22px] font-medium text-fg">
                {modal.mode === 'edit' ? 'Spieler bearbeiten' : 'Spieler hinzufügen'}
              </h2>
              <button onClick={() => setModal(null)} className="text-muted hover:text-fg transition-colors duration-150 ease-ui" aria-label="Schließen">
                <X size={18} strokeWidth={1.5} />
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

              {formError && (
                <div className="flex items-center gap-2 rounded-lg bg-neg/10 px-3 py-2.5 text-[13px] text-neg">
                  <AlertTriangle size={16} strokeWidth={1.5} className="shrink-0" />
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 btn btn-secondary" disabled={saving}>Abbrechen</button>
                <button type="submit" className="flex-1 btn btn-primary" disabled={saving}>
                  {saving ? 'Speichert …' : 'Speichern'}
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
            <h2 className="text-[20px] font-medium text-fg mb-2">Spieler löschen?</h2>
            <p className="text-fg2 mb-6">
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
      <span className="block text-[13px] text-fg2 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
