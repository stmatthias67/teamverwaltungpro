// app/material/page.js
'use client';

import { useEffect, useState } from 'react';

export default function MaterialPage() {
  const [laundryLogs, setLaundryLogs] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [materialItems, setMaterialItems] = useState([
    { id: 1, name: 'Trikotsatz Heim (Rot)', category: 'Jersey', quantity: 16, complete: true },
    { id: 2, name: 'Trikotsatz Auswärts (Blau)', category: 'Jersey', quantity: 15, complete: false, missing: 'Hose Gr. M' },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [laundryRes, playersRes] = await Promise.all([
        fetch('/api/laundry'),
        fetch('/api/players'),
      ]);

      if (!laundryRes.ok || !playersRes.ok) throw new Error('Failed to load data');

      const laundryData = await laundryRes.json();
      const playersData = await playersRes.json();

      setLaundryLogs(laundryData.data || []);
      setPlayers(playersData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddLaundry(playerId) {
    try {
      const res = await fetch('/api/laundry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });

      if (!res.ok) throw new Error('Failed to update laundry');
      loadData();
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
  }

  const getPlayerName = (playerId) => {
    return players.find((p) => p.id === playerId)?.name || 'Unbekannt';
  };

  const laundriestPlayer = laundryLogs[0];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-4xl font-bold mb-2">🧥 Material & Trikotwäsche</h1>
        <p className="text-gray-400">Verwalten Sie Inventar und Waschvorgänge</p>
      </div>

      {/* Fairness Bell */}
      {laundriestPlayer && (
        <div className="card bg-gradient-to-r from-yellow-900 to-yellow-800 border-yellow-700">
          <h3 className="text-lg font-bold mb-2">🔔 Wasch-Fairness-Glocke</h3>
          <p className="text-sm text-gray-200">
            <strong>{getPlayerName(laundriestPlayer.playerId)}</strong> hat mit erst{' '}
            <strong>{laundriestPlayer.count}</strong> Wäsche am längsten nicht gewaschen!
          </p>
        </div>
      )}

      {/* Laundry Log */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">📊 Wäsch-Protokoll</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-slate-700 border-t-green-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">#</th>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Wäschen</th>
                  <th className="text-left px-4 py-3 font-semibold">Zuletzt</th>
                  <th className="text-left px-4 py-3 font-semibold">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {laundryLogs.map((log, idx) => (
                  <tr key={log.id} className="border-b border-slate-700 hover:bg-slate-700 hover:bg-opacity-50">
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3">{getPlayerName(log.playerId)}</td>
                    <td className="px-4 py-3 font-bold">{log.count}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {log.lastWashedAt
                        ? new Date(log.lastWashedAt).toLocaleDateString('de-DE')
                        : 'Nie'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleAddLaundry(log.playerId)}
                        className="btn btn-small bg-green-600 hover:bg-green-700 text-white"
                      >
                        +1 Wäsche
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Material Inventory */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">📦 Materialbestand</h3>
        <div className="space-y-3">
          {materialItems.map((item) => (
            <div key={item.id} className="p-4 border border-slate-700 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.category}</p>
                </div>
                <span
                  className={`badge ${
                    item.complete ? 'badge-success' : 'badge-warning'
                  }`}
                >
                  {item.complete ? '✓ Vollständig' : '⚠️ Unvollständig'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{item.quantity} Sets vorhanden</span>
                {item.missing && <span className="text-xs text-orange-400">({item.missing} seit ...)</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="card bg-red-900 border-red-700 text-red-200">⚠️ {error}</div>}
    </div>
  );
}
