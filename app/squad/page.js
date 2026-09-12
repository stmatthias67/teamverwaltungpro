// app/squad/page.js
/**
 * Squad/Kader Page
 * Spielerverwaltung mit CRUD-Operationen
 * API: GET/POST /api/players, DELETE /api/players/[id]
 */

'use client';

import { useEffect, useState } from 'react';

export default function SquadPage() {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    jerseyNumber: '',
    name: '',
    status: 'ACTIVE',
    parentPhone: '',
    parentWhatsapp: '',
  });

  // Load players on mount
  useEffect(() => {
    loadPlayers();
  }, []);

  // Filter players when search term changes
  useEffect(() => {
    const filtered = players.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.jerseyNumber.toString().includes(searchTerm)
    );
    setFilteredPlayers(filtered);
  }, [searchTerm, players]);

  async function loadPlayers() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/players');
      if (!res.ok) throw new Error('Failed to fetch players');
      const data = await res.json();
      setPlayers(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading players:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPlayer(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jerseyNumber: parseInt(formData.jerseyNumber),
          name: formData.name,
          status: formData.status,
          parentPhone: formData.parentPhone || null,
          parentWhatsapp: formData.parentWhatsapp || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create player');
      }

      setFormData({ jerseyNumber: '', name: '', status: 'ACTIVE', parentPhone: '', parentWhatsapp: '' });
      setShowForm(false);
      loadPlayers();
    } catch (err) {
      alert('Fehler beim Hinzufügen: ' + err.message);
    }
  }

  async function handleDeletePlayer(playerId) {
    if (!window.confirm('Spieler wirklich löschen?')) return;

    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete player');

      loadPlayers();
    } catch (err) {
      alert('Fehler beim Löschen: ' + err.message);
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      ACTIVE: 'badge-success',
      SICK: 'badge-warning',
      INJURED: 'badge-danger',
    };
    const labels = {
      ACTIVE: 'Aktiv',
      SICK: 'Krank',
      INJURED: 'Verletzt',
    };
    return <span className={`badge ${colors[status] || 'badge'}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-4xl font-bold mb-2">👥 Kader & Spielerverwaltung</h1>
        <p className="text-gray-400">Verwalten Sie Ihre Spieler und Kontaktdaten</p>
      </div>

      {/* Search & Add Button */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <input
          type="text"
          placeholder="Nach Name oder Nummer suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field flex-1"
        />
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary whitespace-nowrap">
          + Spieler hinzufügen
        </button>
      </div>

      {/* Add Player Form */}
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Neuen Spieler hinzufügen</h3>
          <form onSubmit={handleAddPlayer} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Rückennummer"
                required
                value={formData.jerseyNumber}
                onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
              />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                <option value="ACTIVE">Aktiv</option>
                <option value="SICK">Krank</option>
                <option value="INJURED">Verletzt</option>
              </select>
              <input
                type="tel"
                placeholder="Telefon"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                className="input-field"
              />
              <input
                type="tel"
                placeholder="WhatsApp"
                value={formData.parentWhatsapp}
                onChange={(e) => setFormData({ ...formData, parentWhatsapp: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">
                Speichern
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Players Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-green-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700 border-b border-slate-600">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold">#</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Name</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Kontakt</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    Keine Spieler gefunden
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => (
                  <tr key={player.id} className="border-b border-slate-700 hover:bg-slate-700 hover:bg-opacity-50">
                    <td className="px-4 py-3 font-semibold">{player.jerseyNumber}</td>
                    <td className="px-4 py-3">{player.name}</td>
                    <td className="px-4 py-3">{getStatusBadge(player.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {player.parentPhone && (
                          <a href={`tel:${player.parentPhone}`} title="Telefon">
                            📞
                          </a>
                        )}
                        {player.parentWhatsapp && (
                          <a
                            href={`https://wa.me/${player.parentWhatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="WhatsApp"
                          >
                            💬
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeletePlayer(player.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <div className="card bg-red-900 border-red-700">
          <p className="text-red-200">⚠️ Fehler: {error}</p>
        </div>
      )}
    </div>
  );
}
