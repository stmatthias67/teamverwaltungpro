// app/tactics/page.js
'use client';

import { useEffect, useState } from 'react';

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
        <h1 className="text-4xl font-bold mb-2">👕 Taktik & Aufstellung</h1>
        <p className="text-gray-400">Visualisierung und Planung von Aufstellungen</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Spielfeld:</label>
          <select value={fieldType} onChange={(e) => setFieldType(e.target.value)} className="input-field">
            {fieldTypes.map((ft) => (
              <option key={ft.value} value={ft.value}>
                {ft.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Formation:</label>
          <select value={formation} onChange={(e) => setFormation(e.target.value)} className="input-field">
            {formations.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Field Visualization */}
      <div className="card bg-green-900 border-green-700 p-8">
        <div className="aspect-video bg-gradient-to-b from-green-700 to-green-800 rounded-lg border-4 border-white flex items-center justify-center relative overflow-hidden">
          {/* Field Lines */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full flex flex-col items-center justify-center">
              {/* Center Line */}
              <div className="absolute w-full h-0.5 bg-white"></div>
              {/* Center Circle */}
              <div className="absolute w-24 h-24 border-2 border-white rounded-full"></div>
            </div>
          </div>

          {/* Players */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-3 gap-8">
              {players.slice(0, 11).map((player) => (
                <div key={player.id} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-yellow-300">
                    {player.jerseyNumber}
                  </div>
                  <div className="text-white text-xs font-semibold text-center">{player.name.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Formation Text */}
          <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-2 rounded text-sm font-bold text-green-900">
            {formation}
          </div>
        </div>
      </div>

      {/* Match Timer */}
      <div className="card bg-blue-900 border-blue-700">
        <h3 className="text-lg font-bold mb-4">⏱️ Match-Timer</h3>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-mono font-bold text-blue-400">{formatTime(timerSeconds)}</div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`btn ${isTimerRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
            >
              {isTimerRunning ? '⏸ Pause' : '▶ Start'}
            </button>
            <button
              onClick={() => {
                setTimerSeconds(0);
                setIsTimerRunning(false);
              }}
              className="btn bg-slate-700 hover:bg-slate-600 text-white"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </div>

      {/* Substitutions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Auf dem Platz</h3>
          <div className="space-y-2">
            {loading ? (
              <p className="text-gray-400">Lädt...</p>
            ) : (
              players.slice(0, 11).map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-2 bg-slate-700 rounded">
                  <span className="font-bold w-8">#{p.jerseyNumber}</span>
                  <span>{p.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Ersatzbank</h3>
          <div className="space-y-2">
            {loading ? (
              <p className="text-gray-400">Lädt...</p>
            ) : (
              players.slice(11).map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-2 bg-slate-700 rounded">
                  <span className="font-bold w-8">#{p.jerseyNumber}</span>
                  <span>{p.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
