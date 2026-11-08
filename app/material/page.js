// app/material/page.js
'use client';

import { useEffect, useState } from 'react';
import { X, Shirt, Footprints, Package, CalendarDays, StickyNote, AlertTriangle, Plus } from 'lucide-react';

const CATEGORY_ICON = {
  Jersey: Shirt,
  Shorts: Shirt,
  Socks: Footprints,
  Shoes: Footprints,
  Other: Package,
};

const RETURN_STATUS = {
  RETURNED: { label: 'Zurück', cls: 'text-pos' },
  DAMAGED: { label: 'Beschädigt', cls: 'text-fg2' },
  LOST: { label: 'Verloren', cls: 'text-neg' },
};

export default function MaterialPage() {
  const [players, setPlayers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [returnData, setReturnData] = useState({
    notes: '',
    damagedItems: [],
    status: 'OK', // OK, DAMAGED, LOST
  });

  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: 'Jersey',
  });

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);

      const [playersRes, materialsRes, borrowsRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/material-inventory'),
        fetch('/api/material-borrow'),
      ]);

      const playersData = await playersRes.json();
      const materialsData = await materialsRes.json();
      const borrowsData = await borrowsRes.json();

      setPlayers(playersData.data || []);
      setMaterials(materialsData.data || []);
      setBorrows(borrowsData.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleBorrowMaterial(e) {
    e.preventDefault();
    if (!selectedPlayer) return;

    try {
      // Übergebe Material an Spieler
      for (const materialId of selectedPlayer.selectedMaterials || []) {
        const res = await fetch('/api/material-borrow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: selectedPlayer.id,
            itemId: materialId,
            notes: `Übergeben am ${new Date().toLocaleDateString('de-DE')}`,
          }),
        });

        if (!res.ok) throw new Error('Material konnte nicht übergeben werden');
      }

      setShowBorrowModal(false);
      setSelectedPlayer(null);
      await loadAllData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReturnMaterial(e) {
    e.preventDefault();
    if (!selectedBorrow) return;

    try {
      const res = await fetch('/api/material-borrow', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrowId: selectedBorrow.id,
          status: returnData.status,
          notes: returnData.notes,
          returnedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error('Material konnte nicht zurückgegeben werden');

      setShowReturnModal(false);
      setSelectedBorrow(null);
      setReturnData({ notes: '', damagedItems: [], status: 'OK' });
      await loadAllData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddMaterial(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/material-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMaterial),
      });

      if (!res.ok) throw new Error('Material konnte nicht hinzugefügt werden');

      setNewMaterial({ name: '', category: 'Jersey' });
      setShowInventoryModal(false);
      await loadAllData();
    } catch (err) {
      setError(err.message);
    }
  }

  const activeBorrows = borrows.filter(b => b.status === 'BORROWED');
  const returnedBorrows = borrows.filter(b => b.status !== 'BORROWED');

  if (loading) {
    return <p className="py-12 text-center text-muted">Lädt …</p>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-fg md:text-4xl">Material</h1>
          <p className="mt-1 text-fg2">Trikotverwaltung und Übergabeprotokoll</p>
        </div>
        <button type="button" onClick={() => setShowInventoryModal(true)} className="btn btn-primary">
          <Plus size={16} strokeWidth={1.5} />
          Material hinzufügen
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-line bg-raised p-4 text-sm text-neg">
          <AlertTriangle size={16} strokeWidth={1.5} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Aktive Übergaben */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium text-fg">Aktive Übergaben</h2>
        {activeBorrows.length === 0 ? (
          <div className="card py-8 text-center text-muted">Keine aktiven Übergaben</div>
        ) : (
          <div className="grid gap-3">
            {activeBorrows.map((borrow) => (
              <div key={borrow.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium text-fg">
                      {borrow.player.firstName} {borrow.player.lastName}
                    </h3>
                    <p className="text-sm text-fg2">
                      {borrow.item.name} ({borrow.item.category})
                    </p>
                    <p className="flex items-center gap-1.5 pt-1 text-[13px] text-muted">
                      <CalendarDays size={14} strokeWidth={1.5} />
                      Übergeben am <span className="num">{new Date(borrow.borrowedAt).toLocaleDateString('de-DE')}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBorrow(borrow);
                      setShowReturnModal(true);
                    }}
                    className="btn btn-secondary"
                  >
                    Beenden
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rückgabehistorie */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium text-fg">Rückgabehistorie</h2>
        {returnedBorrows.length === 0 ? (
          <div className="card py-8 text-center text-muted">Keine Rückgaben vorhanden</div>
        ) : (
          <div className="grid gap-3">
            {returnedBorrows.map((borrow) => {
              const st = RETURN_STATUS[borrow.status] || RETURN_STATUS.LOST;
              return (
                <div key={borrow.id} className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-medium text-fg">
                        {borrow.player.firstName} {borrow.player.lastName}
                      </h3>
                      <p className="text-sm text-fg2">
                        {borrow.item.name} ({borrow.item.category})
                      </p>
                      <p className="num flex items-center gap-1.5 pt-1 text-[13px] text-muted">
                        <CalendarDays size={14} strokeWidth={1.5} />
                        {new Date(borrow.borrowedAt).toLocaleDateString('de-DE')} → {new Date(borrow.returnedAt).toLocaleDateString('de-DE')}
                      </p>
                      {borrow.notes && (
                        <p className="flex items-start gap-1.5 pt-1 text-[13px] text-fg2">
                          <StickyNote size={14} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                          {borrow.notes}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 text-[13px] font-medium ${st.cls}`}>{st.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inventar */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium text-fg">Inventar</h2>
        {materials.length === 0 ? (
          <div className="card py-8 text-center text-muted">Kein Material im Inventar</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((material) => {
              const Icon = CATEGORY_ICON[material.category] || Package;
              return (
                <div key={material.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <Icon size={18} strokeWidth={1.5} className="text-muted" />
                    <span className="num text-[13px] text-muted">{material.quantity} Stück</span>
                  </div>
                  <h3 className="mt-4 font-medium text-fg">{material.name}</h3>
                  <p className="mt-1 text-sm text-fg2">{material.category}</p>
                  {!material.complete && (
                    <p className="mt-3 flex items-start gap-1.5 text-[13px] text-neg">
                      <AlertTriangle size={14} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                      {material.missingItems}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Borrow Material Modal */}
      {showBorrowModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-medium text-fg">Material übergeben</h2>
              <button type="button" onClick={() => setShowBorrowModal(false)} className="text-muted transition-colors duration-150 ease-ui hover:text-fg" aria-label="Schließen">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleBorrowMaterial} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-fg2">Spieler</label>
                <select
                  value={selectedPlayer?.id || ''}
                  onChange={(e) => {
                    const player = players.find(p => p.id === e.target.value);
                    setSelectedPlayer({ ...player, selectedMaterials: [] });
                  }}
                  className="w-full"
                >
                  <option value="">Spieler wählen</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlayer && (
                <div>
                  <label className="mb-2 block text-sm text-fg2">Material</label>
                  <div className="max-h-64 space-y-1 overflow-y-auto">
                    {materials.map((m) => (
                      <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors duration-150 ease-ui hover:bg-raised">
                        <input
                          type="checkbox"
                          checked={(selectedPlayer.selectedMaterials || []).includes(m.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPlayer({
                                ...selectedPlayer,
                                selectedMaterials: [...(selectedPlayer.selectedMaterials || []), m.id],
                              });
                            } else {
                              setSelectedPlayer({
                                ...selectedPlayer,
                                selectedMaterials: (selectedPlayer.selectedMaterials || []).filter(id => id !== m.id),
                              });
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-fg">{m.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowBorrowModal(false)} className="btn btn-secondary flex-1">
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={!selectedPlayer || (selectedPlayer.selectedMaterials || []).length === 0}
                  className="btn btn-primary flex-1"
                >
                  Übergeben
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Material Modal */}
      {showReturnModal && selectedBorrow && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-medium text-fg">Material zurückgeben</h2>
              <button type="button" onClick={() => setShowReturnModal(false)} className="text-muted transition-colors duration-150 ease-ui hover:text-fg" aria-label="Schließen">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleReturnMaterial} className="space-y-4">
              <div className="rounded-lg bg-raised p-3">
                <p className="font-medium text-fg">{selectedBorrow.player.firstName} {selectedBorrow.player.lastName}</p>
                <p className="text-sm text-fg2">{selectedBorrow.item.name}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-fg2">Status</label>
                <select
                  value={returnData.status}
                  onChange={(e) => setReturnData({ ...returnData, status: e.target.value })}
                  className="w-full"
                >
                  <option value="OK">Alles vollständig</option>
                  <option value="DAMAGED">Beschädigt</option>
                  <option value="LOST">Verloren</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-fg2">Notizen</label>
                <textarea
                  value={returnData.notes}
                  onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                  placeholder="z.B. Trikot zerrissen, Socken fehlen"
                  rows="4"
                  className="w-full"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowReturnModal(false)} className="btn btn-secondary flex-1">
                  Abbrechen
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Bestätigen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Material Modal */}
      {showInventoryModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-medium text-fg">Material hinzufügen</h2>
              <button type="button" onClick={() => setShowInventoryModal(false)} className="text-muted transition-colors duration-150 ease-ui hover:text-fg" aria-label="Schließen">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-fg2">Name</label>
                <input
                  type="text"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                  placeholder="z.B. Trikotsatz Heim"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-fg2">Kategorie</label>
                <select
                  value={newMaterial.category}
                  onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                >
                  <option value="Jersey">Trikot</option>
                  <option value="Shorts">Hose</option>
                  <option value="Socks">Socken</option>
                  <option value="Shoes">Schuhe</option>
                  <option value="Other">Sonstiges</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowInventoryModal(false)} className="btn btn-secondary flex-1">
                  Abbrechen
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Hinzufügen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
