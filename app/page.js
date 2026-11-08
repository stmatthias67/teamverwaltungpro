// app/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, MapPin, Car, ChevronRight, Users, CalendarCheck, Shirt, Settings } from 'lucide-react';

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

      const upcomingEvents = sortedEvents.filter((e) => new Date(e.date) > new Date());
      const trainingCount = events.filter((e) => e.type === 'TRAINING').length;
      const matchCount = events.filter((e) => e.type === 'MATCH').length;

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

  const TYPE_LABEL = { TRAINING: 'Training', MATCH: 'Spiel', TOURNAMENT: 'Turnier' };

  const STATS = [
    { label: 'Spieler', value: stats.totalPlayers },
    { label: 'Kommende Events', value: stats.upcomingEvents },
    { label: 'Trainings', value: stats.trainingCount },
    { label: 'Spiele', value: stats.matchCount },
  ];

  const ACTIONS = [
    { href: '/squad', label: 'Kader', hint: 'Spieler hinzufügen und bearbeiten', Icon: Users },
    { href: '/events', label: 'Events', hint: 'Training, Spiele, Turniere', Icon: CalendarDays },
    { href: '/check-in', label: 'Check-in', hint: 'Anwesenheit erfassen', Icon: CalendarCheck },
    { href: '/organisation/material', label: 'Material', hint: 'Trikots und Ausrüstung', Icon: Shirt },
    { href: '/settings', label: 'Einstellungen', hint: 'Design und Darstellung', Icon: Settings },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[28px] leading-[1.15] font-medium text-fg">Übersicht</h1>
        <p className="text-fg2 mt-1">SV Schloßberg</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map((item) => (
          <div key={item.label} className="card py-4">
            <p className="text-sm text-fg2">{item.label}</p>
            <p className="num text-[28px] leading-none font-medium text-fg mt-3">{loading ? '–' : item.value}</p>
          </div>
        ))}
      </div>

      {/* Next Event */}
      {nextEvent && (
        <section className="card">
          <p className="text-sm text-fg2">Nächstes Event</p>
          <h2 className="text-[20px] leading-[1.3] font-medium text-fg mt-1">{nextEvent.title}</h2>
          <div className="mt-4 space-y-2 text-[14px] text-fg2">
            <p className="flex items-center gap-2.5">
              <CalendarDays size={16} strokeWidth={1.5} className="shrink-0 text-muted" />
              <span className="num">{formatDate(nextEvent.date)}</span>
            </p>
            <p className="flex items-center gap-2.5">
              <Clock size={16} strokeWidth={1.5} className="shrink-0 text-muted" />
              <span className="num">{formatTime(nextEvent.date)} Uhr</span>
            </p>
            <p className="flex items-center gap-2.5">
              <MapPin size={16} strokeWidth={1.5} className="shrink-0 text-muted" />
              {nextEvent.location}
            </p>
            {nextEvent.distanceInfo && (
              <p className="flex items-center gap-2.5">
                <Car size={16} strokeWidth={1.5} className="shrink-0 text-muted" />
                {nextEvent.distanceInfo}
              </p>
            )}
          </div>
          <div className="mt-6 flex items-center justify-between gap-4">
            <span className="badge">{TYPE_LABEL[nextEvent.type]}</span>
            <Link href={`/events/${nextEvent.id}`} className="btn btn-primary">
              Details anzeigen
            </Link>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section>
        <h2 className="text-[15px] font-medium text-fg mb-3">Schnellzugriff</h2>
        <div className="card p-1 divide-y divide-line">
          {ACTIONS.map(({ href, label, hint, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-3 rounded-lg first:rounded-t-[11px] last:rounded-b-[11px] transition-colors duration-150 ease-ui hover:bg-raised"
            >
              <Icon size={16} strokeWidth={1.5} className="shrink-0 text-muted" />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] text-fg">{label}</p>
                <p className="text-[13px] text-muted">{hint}</p>
              </div>
              <ChevronRight size={16} strokeWidth={1.5} className="shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <p className="text-center text-muted text-[13px] pt-6 border-t border-line">TeamManager Pro 3.0</p>
    </div>
  );
}
