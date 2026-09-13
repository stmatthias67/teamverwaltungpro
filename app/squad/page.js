// app/squad/page.js
/**
 * Squad/Kader Page - ÜBERARBEITETE VERSION
 * Spielerverwaltung mit Modal-Form für Hinzufügen
 * 
 * Neue Felder:
 * - firstName (Vorname)
 * - lastName (Nachname)
 * - parentName (Name des Elternteils)
 * - parentPhone (Telefon)
 * - parentWhatsapp (WhatsApp oder Username)
 * 
 * KEINE jerseyNumber mehr
 * KEIN status mehr (wird pro-Event in Nomination gespeichert)
 */

'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function SquadPage() {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    parentName: '',
    parentPhone: '',
    parentWhatsapp: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Load players on mount
  useEffect(() => {
    loadPlayers();
  }, []);

  // Filter players when search term changes
  useEffect(() => {
    const filtered = players.filter(
      (p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.parentName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPlayers(filtered);
  }, [searchTerm, players]);

  async function loadPlayers() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/players');
      if (!res.ok) throw new Error('Spieler konnten nicht geladen werden');
      const data = await res.json();
      setPlayers(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading players:', err);
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'Vorname ist erforderlich';
    if (!formData.lastName.trim()) errors.lastName = 'Nachname ist erforderlich';
    if (!formData.parentName?.trim()) errors.parentName = 'Elternname ist erforderlich';
    if (!formData.parentPhone?.trim()) errors.parentPhone = 'Telefon ist erforderlich';
    if (!formData.parentWhatsapp?.trim()) {
      errors.parentWhatsapp = 'WhatsApp-Nummer oder Username erforderlich';
    }
    return errors;
  }

  async function handleAddPlayer(e) {
    e.preventDefault();
    
    // Validate
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Spieler konnte nicht erstellt werden');
      }

      // Clear form and reload
      setFormData({
        firstName: '',
        lastName: '',
        parentName: '',
        parentPhone: '',
        parentWhatsapp: '',
      });
      setFormErrors({});
      setShowModal(false);
      await loadPlayers();
    } catch (err) {
      setFormErrors({ submit: err.message });
      console.error('Error adding player:', err);
    }
  }

  async function handleDeletePlayer(playerId) {
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Spieler konnte nicht gelöscht werden');
      }

      await loadPlayers();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message);
      console.error('Error deleting player:', err);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-white">Kader</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition"
        >
          + Spieler hinzufügen
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Nach Name oder Eltern suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-card border border-slate-700 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Players List */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          {players.length === 0 ? 'Noch keine Spieler hinzugefügt' : 'Keine Spieler gefunden'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="p-4 bg-card border border-slate-700 rounded-lg hover:border-primary/50 transition flex justify-between items-start"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {player.firstName[0]}{player.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">
                      {player.firstName} {player.lastName}
                    </h3>
                    <p className="text-sm text-slate-400">
                      Eltern: {player.parentName}
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mt-2 text-sm text-slate-300 space-y-1">
                  {player.parentPhone && (
                    <p>
                      📞{' '}
                      <a
                        href={`tel:${player.parentPhone}`}
                        className="hover:text-primary text-blue-400"
                      >
                        {player.parentPhone}
                      </a>
                    </p>
                  )}
                  {player.parentWhatsapp && (
                    <p>
                      💬{' '}
                      {player.parentWhatsapp.includes('@') ? (
                        <span>{player.parentWhatsapp}</span>
                      ) : (
                        <a
                          href={`https://wa.me/${player.parentWhatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary text-green-400"
                        >
                          {player.parentWhatsapp}
                        </a>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => setDeleteConfirm(player.id)}
                className="ml-4 px-3 py-1 text-red-400 hover:bg-red-500/20 rounded text-sm transition"
              >
                Löschen
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-slate-700 rounded-lg p-6 max-w-sm">
            <h2 className="text-xl font-bold text-white mb-4">Spieler löschen?</h2>
            <p className="text-slate-300 mb-6">
              Dieser Spieler wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleDeletePlayer(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-slate-700 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Spieler hinzufügen</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormErrors({});
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddPlayer} className="space-y-4">
              {/* Vorname */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Vorname *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="z.B. Max"
                  className={`w-full px-3 py-2 bg-main border rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                    formErrors.firstName ? 'border-red-500' : 'border-slate-700'
                  }`}
                />
                {formErrors.firstName && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.firstName}</p>
                )}
              </div>

              {/* Nachname */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Nachname *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="z.B. Mustermann"
                  className={`w-full px-3 py-2 bg-main border rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                    formErrors.lastName ? 'border-red-500' : 'border-slate-700'
                  }`}
                />
                {formErrors.lastName && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.lastName}</p>
                )}
              </div>

              {/* Elternname */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Name eines Elternteils *
                </label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleInputChange}
                  placeholder="z.B. Anna Mustermann"
                  className={`w-full px-3 py-2 bg-main border rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                    formErrors.parentName ? 'border-red-500' : 'border-slate-700'
                  }`}
                />
                {formErrors.parentName && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.parentName}</p>
                )}
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Telefonnummer *
                </label>
                <input
                  type="tel"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleInputChange}
                  placeholder="z.B. +49 123 456789"
                  className={`w-full px-3 py-2 bg-main border rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                    formErrors.parentPhone ? 'border-red-500' : 'border-slate-700'
                  }`}
                />
                {formErrors.parentPhone && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.parentPhone}</p>
                )}
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  WhatsApp-Nummer oder Benutzername *
                </label>
                <input
                  type="text"
                  name="parentWhatsapp"
                  value={formData.parentWhatsapp}
                  onChange={handleInputChange}
                  placeholder="z.B. +49 123 456789 oder anna.mustermann"
                  className={`w-full px-3 py-2 bg-main border rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                    formErrors.parentWhatsapp ? 'border-red-500' : 'border-slate-700'
                  }`}
                />
                {formErrors.parentWhatsapp && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.parentWhatsapp}</p>
                )}
              </div>

              {/* Submit Error */}
              {formErrors.submit && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                  {formErrors.submit}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormErrors({});
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
                >
                  Spieler hinzufügen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
