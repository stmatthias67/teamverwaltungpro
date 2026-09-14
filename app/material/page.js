// app/material/page.js
'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

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

  const categoryEmojis = {
    Jersey: '👕',
    Shorts: '👖',
    Socks: '🧦',
    Shoes: '👟',
    Other: '📦',
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white">🧥 Material</h1>
          <p className="text-slate-400 mt-1">Trikotverwaltung und Übergabeprotokoll</p>
        </div>
        <button
          onClick={() => setShowInventoryModal(true)}
          className="btn btn-primary"
        >
          + Material hinzufügen
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* Aktive Übergaben */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Aktive Übergaben</h2>
        {activeBorrows.length === 0 ? (
          <div className="card text-center text-slate-400 py-8">
            Keine aktiven Übergaben
          </div>
        ) : (
          <div className="grid gap-4">
            {activeBorrows.map((borrow) => (
              <div key={borrow.id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">
                      {borrow.player.firstName} {borrow.player.lastName}
                    </h3>
                    <p className="text-sm text-slate-300 mt-1">
                      {borrow.item.name} ({borrow.item.category})
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      📅 Übergeben am {new Date(borrow.borrowedAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBorrow(borrow);
                      setShowReturnModal(true);
                    }}
                    className="btn btn-primary text-sm"
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
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Rückgabehistorie</h2>
        {returnedBorrows.length === 0 ? (
          <div className="card text-center text-slate-400 py-8">
            Keine Rückgaben vorhanden
          </div>
        ) : (
          <div className="grid gap-4">
            {returnedBorrows.map((borrow) => {
              const statusColors = {
                RETURNED: 'bg-green-900/30 text-green-200',
                DAMAGED: 'bg-yellow-900/30 text-yellow-200',
                LOST: 'bg-red-900/30 text-red-200',
              };
              
              return (
                <div key={borrow.id} className={`card ${statusColors[borrow.status]}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">
                        {borrow.player.firstName} {borrow.player.lastName}
                      </h3>
                      <p className="text-sm mt-1">
                        {borrow.item.name} ({borrow.item.category})
                      </p>
                      <p className="text-xs mt-2 opacity-75">
                        📅 {new Date(borrow.borrowedAt).toLocaleDateString('de-DE')} → {new Date(borrow.returnedAt).toLocaleDateString('de-DE')}
                      </p>
                      {borrow.notes && <p className="text-xs mt-2 italic">📝 {borrow.notes}</p>}
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 rounded text-xs font-medium">
                        {borrow.status === 'RETURNED' ? '✅ Zurück' : borrow.status === 'DAMAGED' ? '⚠️ Beschädigt' : '❌ Verloren'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inventar */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Inventar</h2>
        {materials.length === 0 ? (
          <div className="card text-center text-slate-400 py-8">
            Kein Material im Inventar
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((material) => (
              <div key={material.id} className="card">
                <div className="text-3xl mb-2">{categoryEmojis[material.category] || '📦'}</div>
                <h3 className="font-bold text-white">{material.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{material.category}</p>
                <p className="text-lg text-primary font-bold mt-2">x{material.quantity}</p>
                {!material.complete && (
                  <p className="text-xs text-yellow-400 mt-2">⚠️ {material.missingItems}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Borrow Material Modal */}
      {showBorrowModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Material übergeben</h2>
              <button
                onClick={() => setShowBorrowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleBorrowMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Spieler</label>
                <select
                  value={selectedPlayer?.id || ''}
                  onChange={(e) => {
                    const player = players.find(p => p.id === e.target.value);
                    setSelectedPlayer({ ...player, selectedMaterials: [] });
                  }}
                  className="w-full"
                >
                  <option value="">-- Spieler wählen --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlayer && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Material</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {materials.map((m) => (
                      <label key={m.id} className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer">
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
                          className="w-4 h-4"
                        />
                        <span className="text-white">{m.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBorrowModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={!selectedPlayer || (selectedPlayer.selectedMaterials || []).length === 0}
                  className="flex-1 btn btn-primary disabled:opacity-50"
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Material zurückgeben</h2>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleReturnMaterial} className="space-y-4">
              <div className="p-3 bg-slate-700 rounded">
                <p className="text-white font-bold">{selectedBorrow.player.firstName} {selectedBorrow.player.lastName}</p>
                <p className="text-slate-300 text-sm">{selectedBorrow.item.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Status</label>
                <select
                  value={returnData.status}
                  onChange={(e) => setReturnData({ ...returnData, status: e.target.value })}
                  className="w-full"
                >
                  <option value="OK">✅ Alles vollständig</option>
                  <option value="DAMAGED">⚠️ Beschädigt</option>
                  <option value="LOST">❌ Verloren</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Notizen</label>
                <textarea
                  value={returnData.notes}
                  onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                  placeholder="z.B. Trikot zerrissen, Socken fehlen..."
                  rows="4"
                  className="w-full"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                >
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Material hinzufügen</h2>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Name</label>
                <input
                  type="text"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                  placeholder="z.B. Trikotsatz Heim"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Kategorie</label>
                <select
                  value={newMaterial.category}
                  onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                >
                  <option value="Jersey">👕 Trikot</option>
                  <option value="Shorts">👖 Hose</option>
                  <option value="Socks">🧦 Socken</option>
                  <option value="Shoes">👟 Schuhe</option>
                  <option value="Other">📦 Sonstiges</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInventoryModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                >
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
