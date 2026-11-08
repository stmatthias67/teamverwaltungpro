// app/squad/page.js
/**
 * Squad/Kader Page
 * Spielerverwaltung mit Modal-Form für Hinzufügen
 *
 * Felder: firstName, lastName, parentName, parentPhone, parentWhatsapp
 * Status wird pro Event in Nomination gespeichert, nicht hier.
 */

'use client';

import { useEffect, useState } from 'react';
import { X, Plus, Search, Phone, MessageCircle, AlertCircle } from 'lucide-react';

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

  const closeModal = () => {
    setShowModal(false);
    setFormErrors({});
  };

  const inputClass = (name) => (formErrors[name] ? 'border-neg' : '');

  const FIELDS = [
    { name: 'firstName', label: 'Vorname', placeholder: 'z.B. Max', required: true },
    { name: 'lastName', label: 'Nachname', placeholder: 'z.B. Mustermann', required: true },
    { name: 'parentName', label: 'Name eines Elternteils', placeholder: 'z.B. Anna Mustermann', required: true },
    { name: 'parentPhone', label: 'Telefonnummer', placeholder: 'z.B. +49 123 456789', type: 'tel', required: true },
    {
      name: 'parentWhatsapp',
      label: 'WhatsApp-Nummer oder Benutzername',
      placeholder: 'z.B. +49 123 456789 oder anna.mustermann',
      required: true,
    },
  ];

  if (loading) {
    return <p className="text-muted py-12 text-center">Lädt …</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-[1.15] font-medium text-fg">Kader</h1>
          <p className="text-fg2 mt-1">{players.length} Spieler</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} strokeWidth={1.5} />
          Spieler hinzufügen
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-neg/40 text-neg">
          <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Nach Name oder Eltern suchen"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Players List */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-12 text-fg2">
          {players.length === 0 ? 'Noch keine Spieler hinzugefügt' : 'Keine Spieler gefunden'}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPlayers.map((player) => (
            <div key={player.id} className="card py-4 px-4 flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-raised flex items-center justify-center shrink-0">
                    <span className="text-[13px] font-medium text-fg2">
                      {player.firstName[0]}
                      {player.lastName[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-medium text-fg truncate">
                      {player.firstName} {player.lastName}
                    </h3>
                    <p className="text-[13px] text-muted truncate">Eltern: {player.parentName}</p>
                  </div>
                </div>

                {/* Contact Info */}
                {(player.parentPhone || player.parentWhatsapp) && (
                  <div className="mt-3 pl-12 space-y-1.5 text-[13px] text-fg2">
                    {player.parentPhone && (
                      <p className="flex items-center gap-2">
                        <Phone size={14} strokeWidth={1.5} className="shrink-0 text-muted" />
                        <a href={`tel:${player.parentPhone}`} className="hover:text-fg transition-colors duration-150 ease-ui">
                          {player.parentPhone}
                        </a>
                      </p>
                    )}
                    {player.parentWhatsapp && (
                      <p className="flex items-center gap-2">
                        <MessageCircle size={14} strokeWidth={1.5} className="shrink-0 text-muted" />
                        {player.parentWhatsapp.includes('@') ? (
                          <span>{player.parentWhatsapp}</span>
                        ) : (
                          <a
                            href={`https://wa.me/${player.parentWhatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-fg transition-colors duration-150 ease-ui"
                          >
                            {player.parentWhatsapp}
                          </a>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Delete Button */}
              <button
                onClick={() => setDeleteConfirm(player.id)}
                className="btn btn-secondary h-8 px-3 text-[13px] shrink-0"
              >
                Löschen
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal max-w-sm">
            <h2 className="text-xl font-medium text-fg mb-2">Spieler löschen?</h2>
            <p className="text-fg2 mb-6">
              Dieser Spieler wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn btn-secondary">
                Abbrechen
              </button>
              <button onClick={() => handleDeletePlayer(deleteConfirm)} className="flex-1 btn btn-danger">
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal max-w-lg">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-fg">Spieler hinzufügen</h2>
              <button onClick={closeModal} className="text-muted hover:text-fg transition-colors duration-150 ease-ui" aria-label="Schließen">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddPlayer} className="space-y-4">
              {FIELDS.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm text-fg2 mb-1.5">{field.label} *</label>
                  <input
                    type={field.type || 'text'}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleInputChange}
                    placeholder={field.placeholder}
                    className={inputClass(field.name)}
                  />
                  {formErrors[field.name] && <p className="text-neg text-sm mt-1">{formErrors[field.name]}</p>}
                </div>
              ))}

              {/* Submit Error */}
              {formErrors.submit && (
                <div className="p-3 rounded-lg border border-neg/40 text-neg text-sm">{formErrors.submit}</div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 btn btn-secondary">
                  Abbrechen
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
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
