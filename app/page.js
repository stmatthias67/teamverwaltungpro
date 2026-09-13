// app/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    upcomingEvents: 0,
    trainingCount: 0,
    matchCount: 0,
  });
  const [nextEvent, setNextEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      // Spieler laden
      const playersRes = await fetch('/api/players');
      const playersData = await playersRes.json();
      
      // Events laden
      const eventsRes = await fetch('/api/events');
      const eventsData = await eventsRes.json();
      
      const events = eventsData.data || [];
      const sortedEvents = events.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const upcomingEvents = sortedEvents.filter(e => new Date(e.date) > new Date());
      const trainingCount = events.filter(e => e.type === 'TRAINING').length;
      const matchCount = events.filter(e => e.type === 'MATCH').length;
      
      setStats({
        totalPlayers: playersData.data?.length || 0,
        upcomingEvents: upcomingEvents.length,
        trainingCount,
        matchCount,
      });
      
      if (upcomingEvents.length > 0) {
        setNextEvent(upcomingEvents[0]);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Willkommen bei TeamManager Pro</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-3xl mb-2">👥</div>
          <p className="text-slate-400 text-sm">Spieler</p>
          <p className="text-2xl font-bold text-primary">{stats.totalPlayers}</p>
        </div>
        
        <div className="card">
          <div className="text-3xl mb-2">📅</div>
          <p className="text-slate-400 text-sm">Kommende Events</p>
          <p className="text-2xl font-bold text-primary">{stats.upcomingEvents}</p>
        </div>
        
        <div className="card">
          <div className="text-3xl mb-2">🏃</div>
          <p className="text-slate-400 text-sm">Trainings</p>
          <p className="text-2xl font-bold text-primary">{stats.trainingCount}</p>
        </div>
        
        <div className="card">
          <div className="text-3xl mb-2">⚽</div>
          <p className="text-slate-400 text-sm">Spiele</p>
          <p className="text-2xl font-bold text-primary">{stats.matchCount}</p>
        </div>
      </div>

      {/* Next Event */}
      {nextEvent && (
        <div className="card border-l-4 border-l-primary">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">Nächstes Event</h2>
              <h3 className="text-lg text-primary font-semibold">{nextEvent.title}</h3>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <p>📅 {formatDate(nextEvent.date)}</p>
                <p>🕐 {formatTime(nextEvent.date)}</p>
                <p>📍 {nextEvent.location}</p>
                {nextEvent.distanceInfo && <p>🚗 {nextEvent.distanceInfo}</p>}
              </div>
              <Link
                href={`/events/${nextEvent.id}`}
                className="inline-block mt-4 px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-white text-sm font-medium transition"
              >
                Details anschauen
              </Link>
            </div>
            <div className="text-5xl">{nextEvent.type === 'TRAINING' ? '🏃' : nextEvent.type === 'MATCH' ? '⚽' : '🏆'}</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Schnellaktionen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/squad" className="card hover:border-primary transition group">
            <div className="text-3xl mb-2 group-hover:scale-110 transition">👥</div>
            <h3 className="font-semibold text-white">Kader verwalten</h3>
            <p className="text-sm text-slate-400 mt-1">Spieler hinzufügen/löschen</p>
          </Link>
          
          <Link href="/events" className="card hover:border-primary transition group">
            <div className="text-3xl mb-2 group-hover:scale-110 transition">⚽</div>
            <h3 className="font-semibold text-white">Events verwalten</h3>
            <p className="text-sm text-slate-400 mt-1">Training, Spiele, Turniere</p>
          </Link>
          
          <Link href="/material" className="card hover:border-primary transition group">
            <div className="text-3xl mb-2 group-hover:scale-110 transition">🧥</div>
            <h3 className="font-semibold text-white">Material verwalten</h3>
            <p className="text-sm text-slate-400 mt-1">Trikots und Ausrüstung</p>
          </Link>
          
          <Link href="/settings" className="card hover:border-primary transition group">
            <div className="text-3xl mb-2 group-hover:scale-110 transition">⚙️</div>
            <h3 className="font-semibold text-white">Einstellungen</h3>
            <p className="text-sm text-slate-400 mt-1">Design und Farben</p>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-slate-500 text-sm pt-6 border-t border-slate-700">
        <p>TeamManager Pro v2.0 - SV Schloßberg</p>
      </div>
    </div>
  );
}
