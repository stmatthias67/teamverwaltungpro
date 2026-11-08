// app/settings/page.js
/**
 * Einstellungen
 * - Farbmodus: Hell, Dunkel, System (wirkt sofort und wird gespeichert)
 * - Layout-Stil
 * - Farbauswahl: Die Primärfarbe wird als Akzent in der Oberfläche verwendet.
 *   Flächen bleiben neutral.
 */

'use client';

import { useEffect, useState } from 'react';
import { RotateCcw, Save, Check, AlertTriangle } from 'lucide-react';
import { applyTheme, saveTheme } from '@/lib/theme';

const PRESETS = {
  green: {
    name: 'Grün (SV Schloßberg)',
    primaryColor: '#2ea043',
    secondaryColor: '#1f6feb',
    accentColor: '#58a6ff',
  },
  blue: {
    name: 'Blau',
    primaryColor: '#1f6feb',
    secondaryColor: '#2ea043',
    accentColor: '#58a6ff',
  },
  red: {
    name: 'Rot',
    primaryColor: '#da3633',
    secondaryColor: '#1f6feb',
    accentColor: '#58a6ff',
  },
  purple: {
    name: 'Lila',
    primaryColor: '#a371f7',
    secondaryColor: '#1f6feb',
    accentColor: '#79c0ff',
  },
};

const MODE_LABEL = { LIGHT: 'Hell', DARK: 'Dunkel', SYSTEM: 'System' };
const LAYOUT_LABEL = { STANDARD: 'Standard', MODERN: 'Modern' };

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Apply theme when settings change
  useEffect(() => {
    if (settings) {
      applyThemeSettings(settings);
    }
  }, [settings]);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Einstellungen konnten nicht geladen werden');
      const data = await res.json();
      setSettings(data.data);
      setUnsavedChanges(false);
    } catch (err) {
      setError(err.message);
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }

  function applyThemeSettings(theme) {
    applyTheme(theme);
    saveTheme(theme);
  }

  async function handleSaveSettings() {
    try {
      setError(null);
      setSuccess(false);
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Einstellungen konnten nicht gespeichert werden');
      }

      const data = await res.json();
      setSettings(data.data);
      setUnsavedChanges(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error saving settings:', err);
    }
  }

  async function handleResetSettings() {
    if (!confirm('Alle Einstellungen auf Standard zurücksetzen?')) return;

    try {
      setError(null);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      });

      if (!res.ok) throw new Error('Einstellungen konnten nicht zurückgesetzt werden');

      const data = await res.json();
      setSettings(data.data);
      setUnsavedChanges(false);
    } catch (err) {
      setError(err.message);
      console.error('Error resetting settings:', err);
    }
  }

  function handleColorChange(field, value) {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    setUnsavedChanges(true);
  }

  function handleModeChange(field, value) {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    setUnsavedChanges(true);
  }

  function applyPreset(presetKey) {
    const preset = PRESETS[presetKey];
    setSettings((prev) => ({
      ...prev,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
    }));
    setUnsavedChanges(true);
  }

  if (loading) {
    return <p className="text-muted py-12 text-center">Lädt …</p>;
  }

  if (!settings) {
    return <div className="text-center py-12 text-neg">Einstellungen konnten nicht geladen werden</div>;
  }

  const sectionClass = 'card space-y-4';
  const sectionTitle = 'text-[15px] font-medium text-fg';
  const optionClass = 'flex items-center gap-3 cursor-pointer text-[14px] text-fg';

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[28px] leading-[1.15] font-medium text-fg">Einstellungen</h1>
        {unsavedChanges && (
          <span className="flex items-center gap-1.5 text-[13px] text-fg2">
            <AlertTriangle size={14} strokeWidth={1.5} className="text-muted" />
            Ungespeicherte Änderungen
          </span>
        )}
      </div>

      {/* Messages */}
      {error && <div className="p-4 rounded-lg border border-neg/40 text-neg">{error}</div>}

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-pos/40 text-pos">
          <Check size={16} strokeWidth={1.5} />
          Einstellungen gespeichert
        </div>
      )}

      {/* COLOR MODE */}
      <section className={sectionClass}>
        <h2 className={sectionTitle}>Farbmodus</h2>
        <div className="space-y-3">
          {['LIGHT', 'DARK', 'SYSTEM'].map((mode) => (
            <label key={mode} className={optionClass}>
              <input
                type="radio"
                name="colorMode"
                value={mode}
                checked={settings.colorMode === mode}
                onChange={(e) => handleModeChange('colorMode', e.target.value)}
                className="w-4 h-4"
              />
              {MODE_LABEL[mode]}
            </label>
          ))}
        </div>
      </section>

      {/* LAYOUT STYLE */}
      <section className={sectionClass}>
        <h2 className={sectionTitle}>Layout-Stil</h2>
        <div className="space-y-3">
          {['STANDARD', 'MODERN'].map((style) => (
            <label key={style} className={optionClass}>
              <input
                type="radio"
                name="layoutStyle"
                value={style}
                checked={settings.layoutStyle === style}
                onChange={(e) => handleModeChange('layoutStyle', e.target.value)}
                className="w-4 h-4"
              />
              {style === 'STANDARD' ? 'Standard (Hamburger-Menü)' : 'Modern (Sidebar, gerundet)'}
            </label>
          ))}
        </div>
      </section>

      {/* COLOR PRESETS (vorerst nicht angewendet, siehe Hinweis oben) */}
      <section className={sectionClass}>
        <div>
          <h2 className={sectionTitle}>Farbvorlagen</h2>
          <p className="text-[13px] text-muted mt-1">Wird in einer späteren Version auf die Oberfläche angewendet.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(PRESETS).map(([key, preset]) => {
            const selected = settings.primaryColor === preset.primaryColor;
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`flex items-center justify-between gap-3 h-11 px-3 rounded-lg border text-[14px] text-fg transition-colors duration-150 ease-ui hover:bg-raised ${
                  selected ? 'border-fg/40' : 'border-line'
                }`}
              >
                <span>{preset.name}</span>
                <span className="flex gap-1.5">
                  {[preset.primaryColor, preset.secondaryColor, preset.accentColor].map((c) => (
                    <span key={c} className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* CUSTOM COLORS */}
      <section className={sectionClass}>
        <h2 className={sectionTitle}>Eigene Farben</h2>
        {[
          { field: 'primaryColor', label: 'Primärfarbe', placeholder: '#2ea043' },
          { field: 'secondaryColor', label: 'Sekundärfarbe', placeholder: '#1f6feb' },
          { field: 'accentColor', label: 'Akzentfarbe', placeholder: '#58a6ff' },
        ].map(({ field, label, placeholder }) => (
          <div key={field}>
            <label className="block text-sm text-fg2 mb-1.5">{label}</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={settings[field]}
                onChange={(e) => handleColorChange(field, e.target.value)}
                className="w-10 h-9 p-0.5 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={settings[field]}
                onChange={(e) => {
                  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(e.target.value)) {
                    handleColorChange(field, e.target.value);
                  }
                }}
                placeholder={placeholder}
                className="flex-1 font-mono"
              />
            </div>
          </div>
        ))}
      </section>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button onClick={handleResetSettings} className="btn btn-secondary">
          <RotateCcw size={16} strokeWidth={1.5} />
          Zurücksetzen
        </button>
        <button onClick={handleSaveSettings} disabled={!unsavedChanges} className="flex-1 btn btn-primary">
          <Save size={16} strokeWidth={1.5} />
          {unsavedChanges ? 'Einstellungen speichern' : 'Gespeichert'}
        </button>
      </div>
    </div>
  );
}
