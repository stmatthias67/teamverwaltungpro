// app/page.js
/**
 * Dashboard Page - Haupt-Übersicht
 * 'use client' für Client-Side Rendering und API-Fetches
 * Zeigt: Wetter, Nächstes Spiel, Statistiken, Schnellaktionen
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalPlayers: 0,
    upcomingEvent: null,
    laundriestPlayer: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch upcoming events
      const eventsRes = await fetch('/api/events?upcoming=true');
      if (!eventsRes.ok) throw new Error('Failed to fetch events');
      const eventsData = await eventsRes.json();

      // Fetch all players
      const playersRes = await fetch('/api/players');
      if (!playersRes.ok) throw new Error('Failed to fetch players');
      const playersData = await playersRes.json();

      // Fetch laundry logs
      const laundryRes = await fetch('/api/laundry');
      let laundriestPlayer = null;
      if (laundryRes.ok) {
        const laundryData = await laundryRes.json();
        laundriestPlayer = laundryData.data?.[0];
      }

      setStats({
        totalEvents: eventsData.count || 0,
        totalPlayers: playersData.count || 0,
        upcomingEvent: eventsData.data?.[0] || null,
        laundriestPlayer,
      });
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.message);
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
        <p className="text-gray-400">Übersicht der aktuellen Vereinsaktivitäten</p>
      </div>

      {/* Weather Banner */}
      <div className="card bg-gradient-to-r from-blue-900 to-blue-800 border-blue-700">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🌤️</div>
          <div>
            <p className="font-semibold text-white">Stephanskirchen</p>
            <p className="text-sm text-blue-200">18°C – Leicht bewölkt | Ideale Bedingungen</p>
          </div>
        </div>
      </div>

      {/* Next Match Banner */}
      {stats.upcomingEvent && (
        <div className="card bg-gradient-to-r from-green-600 to-green-700 border-green-500 text-white">
          <h3 className="text-2xl font-bold mb-3">⚽ {stats.upcomingEvent.title}</h3>
          <p className="text-sm mb-2">
            📅 {new Date(stats.upcomingEvent.date).toLocaleDateString('de-DE', {
              weekday: 'long',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })}
          </p>
          {stats.upcomingEvent.meetTime && (
            <p className="text-sm mb-2">
              🚪 Treffpunkt: {new Date(stats.upcomingEvent.meetTime).toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
              })} Uhr
            </p>
          )}
          <p className="text-sm mb-4">📍 {stats.upcomingEvent.location}</p>
          {stats.upcomingEvent.distanceInfo && (
            <p className="text-sm mb-4 font-semibold">🚗 {stats.upcomingEvent.distanceInfo}</p>
          )}

          <div className="flex gap-3 flex-wrap">
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(stats.upcomingEvent.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-white text-green-600 hover:bg-gray-100 border-white"
            >
              📍 Route
            </a>
            <Link href="/check-in" className="btn bg-white text-green-600 hover:bg-gray-100 border-white">
              📊 Check-In
            </Link>
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon="⚽" value={stats.totalEvents} label="Einheiten" />
        <StatCard icon="👥" value={stats.totalPlayers} label="Spieler" />
        <StatCard icon="📌" value="Mo. 17:30" label="Nächstes Training" />
      </div>

      {/* Laundry Reminder */}
      <div className="card bg-gradient-to-r from-yellow-900 to-yellow-800 border-yellow-700">
        <h3 className="text-lg font-bold mb-3">🔔 Trikotwasch-Erinnerung</h3>
        {stats.laundriestPlayer ? (
          <>
            <p className="text-sm text-gray-200 mb-4">
              <strong>{stats.laundriestPlayer.player?.name}</strong> hat mit erst{' '}
              <strong>{stats.laundriestPlayer.count}</strong> Wäsche am längsten nicht gewaschen!
            </p>
            <Link href="/material" className="btn bg-yellow-600 hover:bg-yellow-700 text-white">
              👕 Zum Wäsch-Plan
            </Link>
          </>
        ) : (
          <p className="text-sm text-gray-300">Laden Sie Spieler, um Wäsche zu verwalten.</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickActionCard
          title="🎯 Schnelle Aktionen"
          items={[
            { label: 'Spieler hinzufügen', href: '/squad' },
            { label: 'Event erstellen', href: '/events' },
            { label: 'Check-In starten', href: '/check-in' },
          ]}
        />
        <QuickActionCard
          title="📊 Verwaltung"
          items={[
            { label: 'Taktik-Board', href: '/tactics' },
            { label: 'Material-Tracking', href: '/material' },
            { label: 'Einstellungen', href: '/settings' },
          ]}
        />
      </div>

      {error && (
        <div className="card bg-red-900 border-red-700">
          <p className="text-red-200">⚠️ Fehler: {error}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div className="card text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-4xl font-bold text-green-500 mb-1">{value}</div>
      <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

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
