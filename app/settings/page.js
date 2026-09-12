// app/settings/page.js
'use client';

import { useState, useEffect } from 'react';

const PRESETS = {
  green: { primary: '#2ea043', bg: '#0d1117', card: '#161b22', secondary: '#1f6feb' },
  blue: { primary: '#1f6feb', bg: '#0d1117', card: '#161b22', secondary: '#2ea043' },
  red: { primary: '#da3633', bg: '#0d1117', card: '#161b22', secondary: '#f85149' },
};

export default function SettingsPage() {
  const [colors, setColors] = useState({
    primary: '#2ea043',
    bg: '#0d1117',
    card: '#161b22',
    secondary: '#1f6feb',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setColors({
          primary: data.data?.themePrimary || colors.primary,
          bg: data.data?.themeBgMain || colors.bg,
          card: data.data?.themeBgCard || colors.card,
          secondary: data.data?.themeSecondary || colors.secondary,
        });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--accent-primary', theme.primary);
    root.style.setProperty('--bg-main', theme.bg);
    root.style.setProperty('--bg-card', theme.card);
    root.style.setProperty('--accent-secondary', theme.secondary);
  }

  function handleColorChange(key, value) {
    const updated = { ...colors, [key]: value };
    setColors(updated);
    applyTheme(updated);
  }

  async function handleSave() {
    try {
      setLoading(true);
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themePrimary: colors.primary,
          themeBgMain: colors.bg,
          themeBgCard: colors.card,
          themeSecondary: colors.secondary,
        }),
      });

      if (res.ok) {
        alert('✅ Einstellungen gespeichert!');
      }
    } catch (err) {
      alert('❌ Fehler: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(preset) {
    setColors(preset);
    applyTheme(preset);
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-4xl font-bold mb-2">⚙️ Einstellungen</h1>
        <p className="text-gray-400">Passen Sie das Aussehen und Verhalten an</p>
      </div>

      {/* Theme Presets */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">🎨 Farb-Themen</h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => applyPreset(PRESETS.green)}
            className="btn btn-primary"
            style={{ backgroundColor: PRESETS.green.primary }}
          >
            🟢 Grün
          </button>
          <button
            onClick={() => applyPreset(PRESETS.blue)}
            className="btn"
            style={{ backgroundColor: PRESETS.blue.primary }}
          >
            🔵 Blau
          </button>
          <button
            onClick={() => applyPreset(PRESETS.red)}
            className="btn"
            style={{ backgroundColor: PRESETS.red.primary }}
          >
            🔴 Rot
          </button>
        </div>
      </div>

      {/* Custom Colors */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">🎨 Erweiterte Farbanpassung</h2>
        <div className="space-y-6">
          <ColorPicker
            label="Haupt-Akzent"
            value={colors.primary}
            onChange={(v) => handleColorChange('primary', v)}
          />
          <ColorPicker
            label="Hintergrund (Haupt)"
            value={colors.bg}
            onChange={(v) => handleColorChange('bg', v)}
          />
          <ColorPicker
            label="Karten-Hintergrund"
            value={colors.card}
            onChange={(v) => handleColorChange('card', v)}
          />
          <ColorPicker
            label="Sekundär-Farbe"
            value={colors.secondary}
            onChange={(v) => handleColorChange('secondary', v)}
          />
        </div>

        <button onClick={handleSave} disabled={loading} className="btn btn-primary w-full mt-6">
          {loading ? '⏳ Speichern...' : '💾 Einstellungen speichern'}
        </button>
      </div>

      {/* About */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">ℹ️ Über TeamManager</h2>
        <p className="text-gray-300 mb-4">
          <strong>Version:</strong> 1.0.0<br />
          <strong>Projekt:</strong> TeamManager für SV Schloßberg<br />
          <strong>Tech Stack:</strong> Next.js 14, Prisma, PostgreSQL, TailwindCSS
        </p>
        <p className="text-sm text-gray-400">
          © 2026 SV Schloßberg. Entwickelt mit ⚽ Love.
        </p>
      </div>
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-400 mb-2">{label}</label>
      <div className="flex gap-4 items-center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 h-16 rounded cursor-pointer"
        />
        <div className="flex-1">
          <input
            type="text"
            value={value}
            readOnly
            className="input-field w-full text-center font-mono"
          />
        </div>
      </div>
    </div>
  );
}
