// app/tactics/page.js
'use client';

import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function TacticsPage() {
  const [formation, setFormation] = useState('4-3-3');
  const [fieldType, setFieldType] = useState('PITCH_11V11');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  async function loadPlayers() {
    try {
      const res = await fetch('/api/players');
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.data?.slice(0, 11) || []);
      }
    } catch (err) {
      console.error('Error loading players:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formations = ['4-3-3', '4-4-2', '3-5-2', '3-3-2', '2-3-1', '1-2-1 Raute', '2-2'];
  const fieldTypes = [
    { value: 'PITCH_11V11', label: 'Rasen 11v11' },
    { value: 'PITCH_9V9', label: 'Rasen 9v9' },
    { value: 'PITCH_7V7', label: 'Rasen 7v7' },
    { value: 'INDOOR_5V5', label: 'Halle 5v5' },
    { value: 'INDOOR_4V4', label: 'Halle 4v4' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-[28px] md:text-[32px] leading-[1.15] font-medium text-fg mb-1">Taktik & Aufstellung</h1>
        <p className="text-fg2">Visualisierung und Planung von Aufstellungen</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-[13px] text-fg2 mb-1.5">Spielfeld</span>
          <select value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
            {fieldTypes.map((ft) => (
              <option key={ft.value} value={ft.value}>
                {ft.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-[13px] text-fg2 mb-1.5">Formation</span>
          <select value={formation} onChange={(e) => setFormation(e.target.value)}>
            {formations.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Field Visualization */}
      <div className="card p-4 md:p-6">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-[#24422f] flex items-center justify-center">
          {/* Field Lines */}
          <div className="absolute inset-4 border border-white/70 rounded-sm" />
          <div className="absolute left-4 right-4 top-1/2 h-px bg-white/70" />
          <div className="absolute left-1/2 top-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70" />

          {/* Players */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-3 gap-8">
              {players.slice(0, 11).map((player) => (
                <div key={player.id} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-fg text-bg flex items-center justify-center num text-[13px] font-medium">
                    {player.jerseyNumber}
                  </div>
                  <div className="text-white/90 text-[12px] text-center">{player.name.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Formation Text */}
          <div className="absolute top-3 right-3 rounded-md bg-deep/80 px-2.5 py-1 text-[13px] num text-fg">
            {formation}
          </div>
        </div>
      </div>

      {/* Match Timer */}
      <div className="card">
        <h3 className="text-[15px] font-medium text-fg2 mb-4">Match-Timer</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-[32px] leading-none num font-medium text-fg">{formatTime(timerSeconds)}</div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={isTimerRunning ? 'btn btn-secondary' : 'btn btn-primary'}
            >
              {isTimerRunning ? <Pause size={16} strokeWidth={1.5} /> : <Play size={16} strokeWidth={1.5} />}
              {isTimerRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => {
                setTimerSeconds(0);
                setIsTimerRunning(false);
              }}
              className="btn btn-secondary"
            >
              <RotateCcw size={16} strokeWidth={1.5} />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Substitutions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-[15px] font-medium text-fg2 mb-4">Auf dem Platz</h3>
          <div className="space-y-1.5">
            {loading ? (
              <p className="text-muted">Lädt …</p>
            ) : (
              players.slice(0, 11).map((p) => (
                <div key={p.id} className="flex items-center gap-3 h-9 px-3 rounded-lg bg-raised">
                  <span className="num text-muted w-8">#{p.jerseyNumber}</span>
                  <span className="text-fg">{p.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="card">
          <h3 className="text-[15px] font-medium text-fg2 mb-4">Ersatzbank</h3>
          <div className="space-y-1.5">
            {loading ? (
              <p className="text-muted">Lädt …</p>
            ) : (
              players.slice(11).map((p) => (
                <div key={p.id} className="flex items-center gap-3 h-9 px-3 rounded-lg bg-raised">
                  <span className="num text-muted w-8">#{p.jerseyNumber}</span>
                  <span className="text-fg">{p.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
