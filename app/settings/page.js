// app/settings/page.js
/**
 * Settings Page - ÜBERARBEITETE VERSION
 * Theme-System:
 * - Color Mode: Light, Dark, System
 * - Layout Style: Standard, Modern
 * - Custom Club Colors (Primary, Secondary, Accent)
 * - Speicherung in Datenbank
 */

'use client';

import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

const PRESETS = {
  green: {
    name: '🟢 Grün (SV Schloßberg)',
    primaryColor: '#2ea043',
    secondaryColor: '#1f6feb',
    accentColor: '#58a6ff',
  },
  blue: {
    name: '🔵 Blau',
    primaryColor: '#1f6feb',
    secondaryColor: '#2ea043',
    accentColor: '#58a6ff',
  },
  red: {
    name: '🔴 Rot',
    primaryColor: '#da3633',
    secondaryColor: '#1f6feb',
    accentColor: '#58a6ff',
  },
  purple: {
    name: '🟣 Lila',
    primaryColor: '#a371f7',
    secondaryColor: '#1f6feb',
    accentColor: '#79c0ff',
  },
};

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

  // Apply CSS variables when settings change
  useEffect(() => {
    if (settings) {
      applyTheme(settings);
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

  function applyTheme(theme) {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // Setze CSS-Variablen
    root.style.setProperty('--color-primary', theme.primaryColor);
    root.style.setProperty('--color-secondary', theme.secondaryColor);
    root.style.setProperty('--color-accent', theme.accentColor);
    root.style.setProperty('--color-bg-main', theme.bgMain);
    root.style.setProperty('--color-bg-card', theme.bgCard);

    // Setze Dark/Light Mode
    if (theme.colorMode === 'DARK' || (theme.colorMode === 'SYSTEM' && prefersColorSchemeDark())) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (theme.colorMode === 'LIGHT') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else if (theme.colorMode === 'SYSTEM') {
      if (prefersColorSchemeDark()) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }

    // Speichere in localStorage für Persistierung
    localStorage.setItem('themeSettings', JSON.stringify(theme));
  }

  function prefersColorSchemeDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12 text-red-400">
        Einstellungen konnten nicht geladen werden
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-white">Einstellungen</h1>
        {unsavedChanges && (
          <span className="text-sm text-yellow-400">⚠️ Ungespeicherte Änderungen</span>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-200">
          ✅ Einstellungen gespeichert
        </div>
      )}

      {/* COLOR MODE */}
      <div className="bg-card border border-slate-700 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">🌙 Farbmodus</h2>
        <div className="space-y-2">
          {['LIGHT', 'DARK', 'SYSTEM'].map((mode) => (
            <label key={mode} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="colorMode"
                value={mode}
                checked={settings.colorMode === mode}
                onChange={(e) => handleModeChange('colorMode', e.target.value)}
                className="w-4 h-4"
              />
              <span className="ml-3 text-white">
                {mode === 'LIGHT' && '☀️ Hell'}
                {mode === 'DARK' && '🌙 Dunkel'}
                {mode === 'SYSTEM' && '🔄 System'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* LAYOUT STYLE */}
      <div className="bg-card border border-slate-700 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">📐 Layout-Stil</h2>
        <div className="space-y-2">
          {['STANDARD', 'MODERN'].map((style) => (
            <label key={style} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="layoutStyle"
                value={style}
                checked={settings.layoutStyle === style}
                onChange={(e) => handleModeChange('layoutStyle', e.target.value)}
                className="w-4 h-4"
              />
              <span className="ml-3 text-white">
                {style === 'STANDARD' && 'Standard (Hamburger-Menü)'}
                {style === 'MODERN' && 'Modern (Sidebar + gerundet)'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* COLOR PRESETS */}
      <div className="bg-card border border-slate-700 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">🎨 Farb-Vorlagen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="p-3 border-2 rounded-lg text-white hover:border-primary transition"
              style={{
                borderColor: settings.primaryColor === preset.primaryColor ? 'var(--color-primary)' : '#475569',
                backgroundColor: preset.primaryColor + '20',
              }}
            >
              <div className="text-sm font-medium">{preset.name}</div>
              <div className="flex gap-2 mt-2">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: preset.primaryColor }}
                  title="Primary"
                />
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: preset.secondaryColor }}
                  title="Secondary"
                />
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: preset.accentColor }}
                  title="Accent"
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CUSTOM COLORS */}
      <div className="bg-card border border-slate-700 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">🎯 Benutzerdefinierte Farben</h2>

        {/* Primary Color */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Primärfarbe (Hauptfarbe)
          </label>
          <div className="flex gap-3">
            <input
              type="color"
              value={settings.primaryColor}
              onChange={(e) => handleColorChange('primaryColor', e.target.value)}
              className="w-12 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={settings.primaryColor}
              onChange={(e) => {
                if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(e.target.value)) {
                  handleColorChange('primaryColor', e.target.value);
                }
              }}
              placeholder="#2ea043"
              className="flex-1 px-3 py-2 bg-main border border-slate-700 rounded text-white text-sm font-mono"
            />
          </div>
        </div>

        {/* Secondary Color */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Sekundärfarbe
          </label>
          <div className="flex gap-3">
            <input
              type="color"
              value={settings.secondaryColor}
              onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
              className="w-12 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={settings.secondaryColor}
              onChange={(e) => {
                if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(e.target.value)) {
                  handleColorChange('secondaryColor', e.target.value);
                }
              }}
              placeholder="#1f6feb"
              className="flex-1 px-3 py-2 bg-main border border-slate-700 rounded text-white text-sm font-mono"
            />
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Akzentfarbe
          </label>
          <div className="flex gap-3">
            <input
              type="color"
              value={settings.accentColor}
              onChange={(e) => handleColorChange('accentColor', e.target.value)}
              className="w-12 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={settings.accentColor}
              onChange={(e) => {
                if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(e.target.value)) {
                  handleColorChange('accentColor', e.target.value);
                }
              }}
              placeholder="#58a6ff"
              className="flex-1 px-3 py-2 bg-main border border-slate-700 rounded text-white text-sm font-mono"
            />
          </div>
        </div>
      </div>

      {/* Color Preview */}
      <div className="bg-card border border-slate-700 rounded-lg p-6">
        <h3 className="text-sm font-medium text-white mb-3">Vorschau</h3>
        <div className="flex gap-3">
          <div className="flex-1 p-4 rounded text-white text-center font-bold"
            style={{ backgroundColor: settings.primaryColor }}>
            Primary
          </div>
          <div className="flex-1 p-4 rounded text-white text-center font-bold"
            style={{ backgroundColor: settings.secondaryColor }}>
            Secondary
          </div>
          <div className="flex-1 p-4 rounded text-white text-center font-bold"
            style={{ backgroundColor: settings.accentColor }}>
            Accent
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleResetSettings}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition flex items-center gap-2"
        >
          <RotateCcw size={18} />
          Zurücksetzen
        </button>
        <button
          onClick={handleSaveSettings}
          disabled={!unsavedChanges}
          className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-slate-700 text-white rounded-lg transition font-medium"
        >
          {unsavedChanges ? '💾 Einstellungen speichern' : '✅ Gespeichert'}
        </button>
      </div>
    </div>
  );
}
