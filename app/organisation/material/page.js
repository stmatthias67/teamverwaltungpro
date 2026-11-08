// app/organisation/material/page.js - Untertab "Material"
// Teil 1: Bestandstabelle (Soll / Ist / Zustand / Lagerort / letzte Prüfung / Bemerkung)
// Teil 2: Übergabe an Spieler (Übergeben -> Beenden mit Notizen und Status)
'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Pencil, Trash2, Minus, Plus, AlertTriangle, Check } from 'lucide-react';

const CONDITION = {
  GOOD: { label: 'Gut', cls: 'text-pos' },
  USED: { label: 'Gebraucht', cls: 'text-fg2' },
  DAMAGED: { label: 'Beschädigt', cls: 'text-neg' },
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
  { value: 'RETURNED', label: 'Vollständig zurück' },
  { value: 'DAMAGED', label: 'Beschädigt zurück' },
  { value: 'LOST', label: 'Verloren' },
];

const BORROW_STATUS = {
  RETURNED: { label: 'Zurück', cls: 'text-pos' },
  DAMAGED: { label: 'Beschädigt', cls: 'text-fg2' },
  LOST: { label: 'Verloren', cls: 'text-neg' },
};

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
          <button type="button" onClick={() => setError(null)} className="text-muted hover:text-fg transition-colors duration-150 ease-ui" aria-label="Meldung schließen">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      )}
      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-line bg-raised p-3 text-sm text-pos">
          <span className="flex items-center gap-2">
            <Check size={16} strokeWidth={1.5} className="shrink-0" />
            {notice}
          </span>
          <button type="button" onClick={() => setNotice(null)} className="text-muted hover:text-fg transition-colors duration-150 ease-ui" aria-label="Meldung schließen">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Kennzahlen */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Soll gesamt" value={summary.soll} />
        <Stat label="Ist gesamt" value={summary.ist} />
        <Stat label="Fehlt" value={summary.missing} />
        <Stat label="Beschädigt" value={summary.damaged} tone={summary.damaged ? 'bad' : null} />
      </div>

      {/* Bestand */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-fg">Bestand</h2>
          <button type="button" onClick={openCreateItem} className="btn btn-primary">
            <Plus size={16} strokeWidth={1.5} />
            Artikel hinzufügen
          </button>
        </div>

        {items.length === 0 ? (
          <div className="card py-8 text-center text-muted">Noch kein Material erfasst</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="text-left text-[13px] text-muted">
                <tr>
                  <th className="px-3 py-3 font-normal">Artikel</th>
                  <th className="px-3 py-3 font-normal">Kategorie</th>
                  <th className="px-3 py-3 text-right font-normal">Soll</th>
                  <th className="px-3 py-3 text-center font-normal">Ist</th>
                  <th className="px-3 py-3 font-normal">Zustand</th>
                  <th className="px-3 py-3 font-normal">Lagerort</th>
                  <th className="px-3 py-3 font-normal">Letzte Prüfung</th>
                  <th className="px-3 py-3 font-normal">Bemerkung</th>
                  <th className="px-3 py-3 text-right font-normal">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => {
                  const short = (i.quantity || 0) < (i.shouldQuantity || 0);
                  const cond = CONDITION[i.condition] || CONDITION.GOOD;
                  return (
                    <tr key={i.id} className="border-t border-line transition-colors duration-150 ease-ui hover:bg-raised">
                      <td className="px-3 py-3 font-medium text-fg">{i.name}</td>
                      <td className="px-3 py-3 text-fg2">{i.category}</td>
                      <td className="num px-3 py-3 text-right text-fg2">{i.shouldQuantity ?? 0}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => bumpQuantity(i, -1)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-raised text-fg2 transition-colors duration-150 ease-ui hover:text-fg"
                            aria-label="Eins abziehen"
                          >
                            <Minus size={14} strokeWidth={1.5} />
                          </button>
                          <span className={`num w-8 text-center font-medium ${short ? 'text-fg' : 'text-fg2'}`}>{i.quantity ?? 0}</span>
                          <button
                            type="button"
                            onClick={() => bumpQuantity(i, 1)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-raised text-fg2 transition-colors duration-150 ease-ui hover:text-fg"
                            aria-label="Eins hinzufügen"
                          >
                            <Plus size={14} strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[13px] ${cond.cls}`}>{cond.label}</span>
                      </td>
                      <td className="px-3 py-3 text-fg2">{i.location || '–'}</td>
                      <td className="num px-3 py-3 text-fg2">{fmt(i.lastInspection)}</td>
                      <td className="max-w-[220px] truncate px-3 py-3 text-muted" title={i.notes || ''}>{i.notes || '–'}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditItem(i)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-raised text-fg2 transition-colors duration-150 ease-ui hover:text-fg"
                            aria-label="Bearbeiten"
                          >
                            <Pencil size={14} strokeWidth={1.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteItem(i)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted transition-colors duration-150 ease-ui hover:text-neg"
                            aria-label="Löschen"
                          >
                            <Trash2 size={14} strokeWidth={1.5} />
                          </button>
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
        <h2 className="text-lg font-medium text-fg">Übergabe an Spieler</h2>

        <div className="card space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-fg2">Spieler</span>
              <select value={handoverPlayer} onChange={(e) => setHandoverPlayer(e.target.value)}>
                <option value="">Spieler wählen</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-fg2">Notiz (optional)</span>
              <input value={handoverNote} onChange={(e) => setHandoverNote(e.target.value)} placeholder="z.B. Trikotsatz Heim, Gr. 128" />
            </label>
          </div>

          <div>
            <span className="mb-2 block text-sm text-fg2">Artikel</span>
            {items.length === 0 ? (
              <p className="text-sm text-muted">Zuerst Artikel im Bestand anlegen</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((i) => {
                  const selected = handoverItems.includes(i.id);
                  return (
                    <label
                      key={i.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors duration-150 ease-ui ${
                        selected ? 'border-fg/30 bg-raised' : 'border-line hover:bg-raised'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleHandoverItem(i.id)}
                        className="h-4 w-4"
                      />
                      <span className="text-fg">{i.name}</span>
                      <span className="num ml-auto text-[13px] text-muted">{i.quantity ?? 0} am Lager</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handOver}
            disabled={!handoverPlayer || handoverItems.length === 0}
            className="btn btn-primary"
          >
            Übergeben ({handoverItems.length})
          </button>
        </div>

        {/* Aktive Übergaben */}
        <div className="space-y-2">
          <h3 className="font-medium text-fg">Aktuell beim Spieler ({activeBorrows.length})</h3>
          {activeBorrows.length === 0 ? (
            <div className="card py-6 text-center text-muted">Keine offenen Übergaben</div>
          ) : (
            activeBorrows.map((b) => (
              <div key={b.id} className="card flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="font-medium text-fg">{b.player?.firstName} {b.player?.lastName}</div>
                  <div className="text-sm text-fg2">{b.item?.name}</div>
                  <div className="text-[13px] text-muted">seit {fmt(b.borrowedAt)}{b.notes ? ` · ${b.notes}` : ''}</div>
                </div>
                <button
                  type="button"
                  onClick={() => { setEndForm({ status: 'RETURNED', notes: '' }); setEndBorrow(b); }}
                  className="btn btn-secondary"
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
            <h3 className="font-medium text-muted">Verlauf (letzte 30)</h3>
            <div className="text-sm">
              {history.map((b) => {
                const st = BORROW_STATUS[b.status] || BORROW_STATUS.LOST;
                return (
                  <div key={b.id} className="flex flex-wrap items-center gap-2 border-b border-line py-3">
                    <span className="text-fg">{b.player?.firstName} {b.player?.lastName}</span>
                    <span className="text-muted">·</span>
                    <span className="text-fg2">{b.item?.name}</span>
                    <span className="num text-[13px] text-muted">{fmt(b.borrowedAt)} → {fmt(b.returnedAt)}</span>
                    <span className={`ml-auto text-[13px] ${st.cls}`}>{st.label}</span>
                    {b.notes && <span className="w-full text-[13px] text-fg2">{b.notes}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Modal: Artikel anlegen / bearbeiten */}
      {itemModal && (
        <div className="modal-overlay" onClick={() => !saving && setItemModal(null)}>
          <div className="modal max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-medium text-fg">{itemModal.mode === 'edit' ? 'Artikel bearbeiten' : 'Artikel hinzufügen'}</h2>
              <button type="button" onClick={() => setItemModal(null)} className="text-muted transition-colors duration-150 ease-ui hover:text-fg" aria-label="Schließen"><X size={20} strokeWidth={1.5} /></button>
            </div>

            <form onSubmit={saveItem} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Artikel *"><input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="z.B. Trikotsatz Heim Rot" /></Field>
                <Field label="Kategorie *"><input value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} placeholder="Trikot, Hose, Socken" /></Field>
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

              {itemError && <div className="rounded-lg border border-line bg-raised p-3 text-sm text-neg">{itemError}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setItemModal(null)} className="btn btn-secondary flex-1" disabled={saving}>Abbrechen</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>{saving ? 'Speichert …' : 'Speichern'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Übergabe beenden */}
      {endBorrow && (
        <div className="modal-overlay" onClick={() => setEndBorrow(null)}>
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-1 text-xl font-medium text-fg">Übergabe beenden</h2>
            <p className="mb-4 text-sm text-fg2">
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
                <button type="button" onClick={() => setEndBorrow(null)} className="btn btn-secondary flex-1">Abbrechen</button>
                <button type="submit" className="btn btn-primary flex-1">Bestätigen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Artikel löschen */}
      {deleteItem && (
        <div className="modal-overlay" onClick={() => setDeleteItem(null)}>
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-xl font-medium text-fg">Artikel löschen?</h2>
            <p className="mb-6 text-fg2">„{deleteItem.name}“ wird aus dem Bestand entfernt.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteItem(null)} className="btn btn-secondary flex-1">Abbrechen</button>
              <button type="button" onClick={confirmDeleteItem} className="btn btn-danger flex-1">Löschen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }) {
  const color = tone === 'bad' ? 'text-neg' : 'text-fg';
  return (
    <div className="card">
      <div className="text-[13px] text-muted">{label}</div>
      <div className={`num mt-2 text-[28px] font-medium leading-none ${color}`}>{value}</div>
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
