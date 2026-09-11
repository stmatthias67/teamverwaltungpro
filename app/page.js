// app/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalPlayers: 0,
    upcomingEvent: null,
    laundriestPlayer: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load statistics from API on component mount
  useEffect(() => {
    loadStats();
  }, []);

  /**
   * Load dashboard statistics from API
   */
  async function loadStats() {
    try {
      setLoading(true);
      setError(null);

      // Fetch events
      const eventsRes = await fetch('/api/events?upcoming=true', {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!eventsRes.ok) {
        throw new Error(`Events API error: ${eventsRes.status}`);
      }

      const eventsData = await eventsRes.json();
      const upcomingEvent = eventsData.data?.[0] || null;

      // Fetch players
      const playersRes = await fetch('/api/players', {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!playersRes.ok) {
        throw new Error(`Players API error: ${playersRes.status}`);
      }

      const playersData = await playersRes.json();

      // Fetch laundry logs (for fairness bell)
      const laundryRes = await fetch('/api/laundry', {
        headers: { 'Content-Type': 'application/json' },
      });

      let laundriestPlayer = null;
      if (laundryRes.ok) {
        const laundryData = await laundryRes.json();
        laundriestPlayer = laundryData.data?.[0] || null;
      }

      setStats({
        totalEvents: eventsData.count || 0,
        totalPlayers: playersData.count || 0,
        upcomingEvent,
        laundriestPlayer,
      });
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-green-500 rounded-full animate-spin"></div>
          <p className="text-gray-400">Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Title */}
      <div>
        <h1 className="text-4xl font-bold mb-2">📊 Dashboard</h1>
        <p className="text-gray-400">Übersicht der Vereinsaktivitäten</p>
      </div>

      {/* Weather Banner */}
      <WeatherBanner />

      {/* Next Match Banner */}
      {stats.upcomingEvent && <NextMatchBanner event={stats.upcomingEvent} />}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon="📅"
          value={stats.totalEvents}
          label="Absolvierte Einheiten"
        />
        <StatCard
          icon="👥"
          value={stats.totalPlayers}
          label="Kadergröße (Spieler)"
        />
        <StatCard
          icon="📌"
          value="Mo. 17:30"
          label="Nächstes Training"
        />
      </div>

      {/* Laundry Reminder Card */}
      <LaundryReminderCard player={stats.laundriestPlayer} />

      {/* Error Message */}
      {error && (
        <div className="card bg-red-900 border-red-700">
          <p className="text-red-200">⚠️ Fehler: {error}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickActionCard
          title="🎯 Schnelle Aktionen"
          items={[
            { label: 'Spieler hinzufügen', href: '/squad' },
            { label: 'Event erstellen', href: '/events' },
            { label: 'Check-In', href: '/check-in' },
          ]}
        />

        <QuickActionCard
          title="📊 Reports"
          items={[
            { label: 'Anwesenheitsquote', href: '/check-in' },
            { label: 'Trikotwäsche', href: '/material' },
            { label: 'Taktik-Board', href: '/tactics' },
          ]}
        />
      </div>
    </div>
  );
}

/**
 * Weather Banner Component
 */
function WeatherBanner() {
  return (
    <div className="card bg-gradient-to-r from-blue-900 to-blue-800 border-blue-700">
      <div className="flex items-center gap-4">
        <div className="text-4xl">🌤️</div>
        <div>
          <p className="font-semibold text-white">Ort: Stephanskirchen</p>
          <p className="text-sm text-blue-200">
            18°C – Leicht bewölkt | Bester Rasenzustand
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Next Match Banner Component
 */
function NextMatchBanner({ event }) {
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const formattedTime = eventDate.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="card bg-gradient-to-r from-green-600 to-green-700 border-green-500 text-white">
      <h3 className="text-2xl font-bold mb-3">⚽ {event.title}</h3>
      <p className="text-sm mb-2">📅 {formattedDate}</p>
      {event.meetTime && (
        <p className="text-sm mb-2">
          🚪 Treffpunkt: {new Date(event.meetTime).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
          })} Uhr | ⏰ Anpfiff: {formattedTime} Uhr
        </p>
      )}
      <p className="text-sm mb-4">📍 {event.location}</p>
      {event.distanceInfo && (
        <p className="text-sm mb-4 font-semibold">🚗 {event.distanceInfo}</p>
      )}

      <div className="flex gap-3 flex-wrap">
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn bg-white text-green-600 hover:bg-gray-100 border-white"
        >
          📍 Route starten
        </a>
        <Link href="/check-in" className="btn bg-white text-green-600 hover:bg-gray-100 border-white">
          📊 Check-In
        </Link>
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({ icon, value, label }) {
  return (
    <div className="stat-card">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/**
 * Laundry Reminder Card
 */
function LaundryReminderCard({ player }) {
  return (
    <div className="card bg-gradient-to-r from-yellow-900 to-yellow-800 border-yellow-700">
      <h3 className="text-lg font-bold mb-3">🔔 Trikotwasch-Erinnerung</h3>
      {player ? (
        <>
          <p className="text-sm text-gray-200 mb-4">
            <strong>{player.player?.name || 'Unbekannt'}</strong> hat mit erst{' '}
            <strong>{player.count}</strong> Wäsche am längsten nicht mehr gewaschen!
          </p>
          <Link
            href="/material"
            className="btn bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            👕 Zum Wäsch-Plan
          </Link>
        </>
      ) : (
        <p className="text-sm text-gray-300">
          Laden Sie Spieler, um die Wäsche zu verwalten.
        </p>
      )}
    </div>
  );
}

/**
 * Quick Action Card Component
 */
function QuickActionCard({ title, items }) {
  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white hover:text-green-400 transition-colors text-sm font-medium"
          >
            {item.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}
