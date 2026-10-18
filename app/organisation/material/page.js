// app/organisation/material/page.js - Untertab "Material"
// Teil 1: Bestandstabelle (Soll / Ist / Zustand / Lagerort / letzte Prüfung / Bemerkung)
// Teil 2: Übergabe an Spieler (Übergeben -> Beenden mit Notizen und Status)
'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Pencil, Trash2 } from 'lucide-react';

const CONDITION = {
  GOOD: { label: 'Gut', cls: 'bg-green-900/50 text-green-300 border-green-700' },
  USED: { label: 'Gebraucht', cls: 'bg-yellow-900/50 text-yellow-300 border-yellow-700' },
  DAMAGED: { label: 'Beschädigt', cls: 'bg-red-900/50 text-red-300 border-red-700' },
};

const EMPTY_ITEM = {
  name: '',
  category: 'Trikot',
  shouldQuantity: 0,
  quantity: 0,
  condition: 'GOOD',
  location: '',
  lastInspection: '',
  notes: '',
};

const BORROW_END = [
  { value: 'RETURNED', label: '✅ Vollständig zurück' },
  { value: 'DAMAGED', label: '⚠️ Beschädigt zurück' },
  { value: 'LOST', label: '❌ Verloren' },
];

export default function MaterialPage() {
  const [items, setItems] = useState([]);
  const [players, setPlayers] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Bestand
  const [itemModal, setItemModal] = useState(null); // null | { mode, id? }
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [itemError, setItemError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  // Übergabe
  const [handoverPlayer, setHandoverPlayer] = useState('');
  const [handoverItems, setHandoverItems] = useState([]);
  const [handoverNote, setHandoverNote] = useState('');
  const [endBorrow, setEndBorrow] = useState(null); // Borrow-Datensatz
  const [endForm, setEndForm] = useState({ status: 'RETURNED', notes: '' });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [iRes, pRes, bRes] = await Promise.all([
        fetch('/api/material-inventory'),
        fetch('/api/players'),
        fetch('/api/material-borrow'),
      ]);
      const [iJson, pJson, bJson] = await Promise.all([iRes.json(), pRes.json(), bRes.json()]);
      if (!iRes.ok || !pRes.ok || !bRes.ok) throw new Error('Daten konnten nicht geladen werden');
      setItems(iJson.data || []);
      setPlayers(pJson.data || []);
      setBorrows(bJson.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const activeBorrows = useMemo(() => borrows.filter((b) => b.status === 'BORROWED'), [borrows]);
  const history = useMemo(() => borrows.filter((b) => b.status !== 'BORROWED').slice(0, 30), [borrows]);

  // Kennzahlen für die Kopfzeile
  const summary = useMemo(() => {
    const soll = items.reduce((s, i) => s + (i.shouldQuantity || 0), 0);
    const ist = items.reduce((s, i) => s + (i.quantity || 0), 0);
    const damaged = items.filter((i) => i.condition === 'DAMAGED').length;
    const missing = items.filter((i) => (i.quantity || 0) < (i.shouldQuantity || 0)).length;
    return { soll, ist, damaged, missing };
  }, [items]);

  // ---------- Bestand ----------
  function openCreateItem() {
    setItemForm(EMPTY_ITEM);
    setItemError(null);
    setItemModal({ mode: 'create' });
  }

  function openEditItem(i) {
    setItemForm({
      name: i.name || '',
      category: i.category || '',
      shouldQuantity: i.shouldQuantity ?? 0,
      quantity: i.quantity ?? 0,
      condition: i.condition || 'GOOD',
      location: i.location || '',
      lastInspection: i.lastInspection ? i.lastInspection.slice(0, 10) : '',
      notes: i.notes || '',
    });
    setItemError(null);
    setItemModal({ mode: 'edit', id: i.id });
  }

  async function saveItem(e) {
    e.preventDefault();
    if (!itemForm.name.trim() || !itemForm.category.trim()) {
      setItemError('Artikel und Kategorie sind Pflicht');
      return;
    }
    setSaving(true);
    setItemError(null);
    try {
      const isEdit = itemModal.mode === 'edit';
      const body = {
        ...itemForm,
        shouldQuantity: Number(itemForm.shouldQuantity) || 0,
        quantity: Number(itemForm.quantity) || 0,
        lastInspection: itemForm.lastInspection || null,
      };
      if (isEdit) body.id = itemModal.id;
      const res = await fetch('/api/material-inventory', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Speichern fehlgeschlagen');
      setItemModal(null);
      await load();
    } catch (err) {
      setItemError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Ist-Menge direkt in der Tabelle ändern (+/-)
  async function bumpQuantity(item, delta) {
    const next = Math.max(0, (item.quantity || 0) + delta);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, quantity: next } : i)));
    try {
      const res = await fetch('/api/material-inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, quantity: next }),
      });
      if (!res.ok) throw new Error('Menge konnte nicht gespeichert werden');
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  async function confirmDeleteItem() {
    try {
      const res = await fetch(`/api/material-inventory?id=${deleteItem.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Löschen fehlgeschlagen');
      setDeleteItem(null);
      await load();
    } catch (err) {
      setError(err.message);
      setDeleteItem(null);
    }
  }

  // ---------- Übergabe ----------
  function toggleHandoverItem(id) {
    setHandoverItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handOver() {
    if (!handoverPlayer || handoverItems.length === 0) return;
    setError(null);
    try {
      for (const itemId of handoverItems) {
        const res = await fetch('/api/material-borrow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: handoverPlayer, itemId, notes: handoverNote.trim() || null }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Übergabe fehlgeschlagen');
      }
      setNotice(`${handoverItems.length} Artikel übergeben`);
      setHandoverPlayer('');
      setHandoverItems([]);
      setHandoverNote('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function finishBorrow(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/material-borrow', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrowId: endBorrow.id,
          status: endForm.status,
          notes: endForm.notes.trim() || null,
          returnedAt: new Date().toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Beenden fehlgeschlagen');
      setEndBorrow(null);
      await load();
    } catch (err) {
      setError(err.message);
      setEndBorrow(null);
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
      {notice && (
        <div className="p-3 bg-green-900/30 border border-green-700 rounded text-green-200 text-sm flex justify-between">
          <span>✅ {notice}</span>
          <button onClick={() => setNotice(null)} className="hover:text-white">×</button>
        </div>
      )}

      {/* Kennzahlen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Soll gesamt" value={summary.soll} />
        <Stat label="Ist gesamt" value={summary.ist} />
        <Stat label="Fehlt" value={summary.missing} tone={summary.missing ? 'warn' : null} />
        <Stat label="Beschädigt" value={summary.damaged} tone={summary.damaged ? 'bad' : null} />
      </div>

      {/* Bestand */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Bestand</h2>
          <button onClick={openCreateItem} className="btn btn-primary">+ Artikel hinzufügen</button>
        </div>

        {items.length === 0 ? (
          <div className="card text-center text-slate-400 py-8">Noch kein Material erfasst</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-card text-slate-400 text-left">
                <tr>
                  <th className="p-3 font-medium">Artikel</th>
                  <th className="p-3 font-medium">Kategorie</th>
                  <th className="p-3 font-medium text-center">Soll</th>
                  <th className="p-3 font-medium text-center">Ist</th>
                  <th className="p-3 font-medium">Zustand</th>
                  <th className="p-3 font-medium">Lagerort</th>
                  <th className="p-3 font-medium">Letzte Prüfung</th>
                  <th className="p-3 font-medium">Bemerkung</th>
                  <th className="p-3 font-medium text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => {
                  const short = (i.quantity || 0) < (i.shouldQuantity || 0);
                  const cond = CONDITION[i.condition] || CONDITION.GOOD;
                  return (
                    <tr key={i.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                      <td className="p-3 font-medium text-white">{i.name}</td>
                      <td className="p-3 text-slate-300">{i.category}</td>
                      <td className="p-3 text-center text-slate-300">{i.shouldQuantity ?? 0}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => bumpQuantity(i, -1)} className="btn btn-secondary px-2 py-0.5">−</button>
                          <span className={`font-bold w-8 text-center ${short ? 'text-yellow-400' : 'text-white'}`}>{i.quantity ?? 0}</span>
                          <button onClick={() => bumpQuantity(i, 1)} className="btn btn-secondary px-2 py-0.5">+</button>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded border text-xs ${cond.cls}`}>{cond.label}</span>
                      </td>
                      <td className="p-3 text-slate-300">{i.location || '–'}</td>
                      <td className="p-3 text-slate-300">{fmt(i.lastInspection)}</td>
                      <td className="p-3 text-slate-400 max-w-[220px] truncate" title={i.notes || ''}>{i.notes || '–'}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditItem(i)} className="btn btn-secondary px-2 py-1" aria-label="Bearbeiten"><Pencil size={14} /></button>
                          <button onClick={() => setDeleteItem(i)} className="btn btn-danger px-2 py-1" aria-label="Löschen"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Übergabe */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Übergabe an Spieler</h2>

        <div className="card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label>
              <span className="block text-sm text-slate-400 mb-1">Spieler</span>
              <select value={handoverPlayer} onChange={(e) => setHandoverPlayer(e.target.value)}>
                <option value="">– Spieler wählen –</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="block text-sm text-slate-400 mb-1">Notiz (optional)</span>
              <input value={handoverNote} onChange={(e) => setHandoverNote(e.target.value)} placeholder="z.B. Trikotsatz Heim, Gr. 128" />
            </label>
          </div>

          <div>
            <span className="block text-sm text-slate-400 mb-2">Artikel</span>
            {items.length === 0 ? (
              <p className="text-sm text-slate-500">Zuerst Artikel im Bestand anlegen.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.map((i) => (
                  <label
                    key={i.id}
                    className={`flex items-center gap-3 p-2 rounded-md border cursor-pointer transition ${
                      handoverItems.includes(i.id) ? 'border-primary bg-primary/10' : 'border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={handoverItems.includes(i.id)}
                      onChange={() => toggleHandoverItem(i.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-white">{i.name}</span>
                    <span className="ml-auto text-xs text-slate-500">{i.quantity ?? 0} am Lager</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handOver}
            disabled={!handoverPlayer || handoverItems.length === 0}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Übergeben ({handoverItems.length})
          </button>
        </div>

        {/* Aktive Übergaben */}
        <div className="space-y-2">
          <h3 className="font-semibold text-white">Aktuell beim Spieler ({activeBorrows.length})</h3>
          {activeBorrows.length === 0 ? (
            <div className="card text-center text-slate-400 py-6">Keine offenen Übergaben</div>
          ) : (
            activeBorrows.map((b) => (
              <div key={b.id} className="card flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div>
                  <div className="font-semibold text-white">{b.player?.firstName} {b.player?.lastName}</div>
                  <div className="text-sm text-slate-300">{b.item?.name}</div>
                  <div className="text-xs text-slate-500">seit {fmt(b.borrowedAt)}{b.notes ? ` · ${b.notes}` : ''}</div>
                </div>
                <button
                  onClick={() => { setEndForm({ status: 'RETURNED', notes: '' }); setEndBorrow(b); }}
                  className="btn btn-primary"
                >
                  Beenden
                </button>
              </div>
            ))
          )}
        </div>

        {/* Historie */}
        {history.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-400">Verlauf (letzte 30)</h3>
            <div className="space-y-1 text-sm">
              {history.map((b) => (
                <div key={b.id} className="flex flex-wrap gap-2 items-center py-2 border-b border-slate-800">
                  <span className="text-slate-300">{b.player?.firstName} {b.player?.lastName}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-300">{b.item?.name}</span>
                  <span className="text-slate-500 text-xs">{fmt(b.borrowedAt)} → {fmt(b.returnedAt)}</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                    b.status === 'RETURNED' ? 'bg-green-900/50 text-green-300'
                      : b.status === 'DAMAGED' ? 'bg-yellow-900/50 text-yellow-300'
                        : 'bg-red-900/50 text-red-300'
                  }`}>
                    {b.status === 'RETURNED' ? 'Zurück' : b.status === 'DAMAGED' ? 'Beschädigt' : 'Verloren'}
                  </span>
                  {b.notes && <span className="w-full text-xs text-slate-400 italic">📝 {b.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Modal: Artikel anlegen / bearbeiten */}
      {itemModal && (
        <div className="modal-overlay" onClick={() => !saving && setItemModal(null)}>
          <div className="modal max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">{itemModal.mode === 'edit' ? 'Artikel bearbeiten' : 'Artikel hinzufügen'}</h2>
              <button onClick={() => setItemModal(null)} className="text-slate-400 hover:text-white" aria-label="Schließen"><X size={22} /></button>
            </div>

            <form onSubmit={saveItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Artikel *"><input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="z.B. Trikotsatz Heim Rot" /></Field>
                <Field label="Kategorie *"><input value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} placeholder="Trikot, Hose, Socken …" /></Field>
                <Field label="Anzahl Soll"><input type="number" min="0" value={itemForm.shouldQuantity} onChange={(e) => setItemForm({ ...itemForm, shouldQuantity: e.target.value })} /></Field>
                <Field label="Anzahl Ist"><input type="number" min="0" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} /></Field>
                <Field label="Zustand">
                  <select value={itemForm.condition} onChange={(e) => setItemForm({ ...itemForm, condition: e.target.value })}>
                    <option value="GOOD">Gut</option>
                    <option value="USED">Gebraucht</option>
                    <option value="DAMAGED">Beschädigt</option>
                  </select>
                </Field>
                <Field label="Lagerort"><input value={itemForm.location} onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })} placeholder="z.B. Schrank Keller" /></Field>
                <Field label="Letzte Prüfung"><input type="date" value={itemForm.lastInspection} onChange={(e) => setItemForm({ ...itemForm, lastInspection: e.target.value })} /></Field>
              </div>
              <Field label="Bemerkung">
                <textarea rows="3" value={itemForm.notes} onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })} />
              </Field>

              {itemError && <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm">{itemError}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setItemModal(null)} className="flex-1 btn btn-secondary" disabled={saving}>Abbrechen</button>
                <button type="submit" className="flex-1 btn btn-primary" disabled={saving}>{saving ? 'Speichert…' : 'Speichern'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Übergabe beenden */}
      {endBorrow && (
        <div className="modal-overlay" onClick={() => setEndBorrow(null)}>
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-1">Übergabe beenden</h2>
            <p className="text-sm text-slate-300 mb-4">
              {endBorrow.player?.firstName} {endBorrow.player?.lastName} · {endBorrow.item?.name}
            </p>
            <form onSubmit={finishBorrow} className="space-y-4">
              <Field label="Zustand bei Rückgabe">
                <select value={endForm.status} onChange={(e) => setEndForm({ ...endForm, status: e.target.value })}>
                  {BORROW_END.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Notizen">
                <textarea rows="3" value={endForm.notes} onChange={(e) => setEndForm({ ...endForm, notes: e.target.value })} placeholder="z.B. Naht am Ärmel offen" />
              </Field>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEndBorrow(null)} className="flex-1 btn btn-secondary">Abbrechen</button>
                <button type="submit" className="flex-1 btn btn-primary">Bestätigen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Artikel löschen */}
      {deleteItem && (
        <div className="modal-overlay" onClick={() => setDeleteItem(null)}>
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Artikel löschen?</h2>
            <p className="text-slate-300 mb-6">„{deleteItem.name}“ wird aus dem Bestand entfernt.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteItem(null)} className="flex-1 btn btn-secondary">Abbrechen</button>
              <button onClick={confirmDeleteItem} className="flex-1 btn btn-danger">Löschen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }) {
  const color = tone === 'bad' ? 'text-red-400' : tone === 'warn' ? 'text-yellow-400' : 'text-white';
  return (
    <div className="card">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
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
