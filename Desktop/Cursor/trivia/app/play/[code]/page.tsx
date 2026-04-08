'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { Player } from '@/types/game';

export default function PlayPage() {
  const { code } = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const nameParam = searchParams.get('name') ?? '';

  const { gameState, emit, connected } = useSocket();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [buzzed, setBuzzed] = useState(false);

  // Join on connect
  useEffect(() => {
    if (!connected || !nameParam || joined) return;
    emit('join_game', { code, teamName: nameParam });
    setJoined(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, code, nameParam]);

  // Find this player's data
  const me: Player | undefined = gameState?.players.find(
    (p) => p.teamName.toLowerCase() === nameParam.toLowerCase()
  );

  const phase = gameState?.phase;
  const buzzedPlayerId = gameState?.buzzedPlayerId;
  const isBuzzed = buzzedPlayerId === me?.id;
  const someoneElseBuzzed = !!buzzedPlayerId && !isBuzzed;
  const canBuzz = phase === 'question' && !buzzedPlayerId;

  // Reset buzz animation when phase resets
  useEffect(() => {
    if (phase !== 'buzzed') setBuzzed(false);
  }, [phase]);

  function handleBuzz() {
    if (!canBuzz) return;
    emit('buzz');
    setBuzzed(true);
  }

  if (!nameParam) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: '#C8E6F5' }}>
        <p className="text-white font-semibold">No team name provided. Go back and join properly.</p>
      </main>
    );
  }

  if (!gameState) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#C8E6F5' }}>
        <p className="text-white/70">Connecting…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: '#C8E6F5' }}>
        <p className="text-red-200 font-semibold">{error}</p>
      </main>
    );
  }

  const buzzBg = isBuzzed ? '#4CD964' : someoneElseBuzzed ? '#ccc' : canBuzz ? '#35B7FB' : 'rgba(255,255,255,0.3)';
  const buzzLabel = isBuzzed ? '🎉 You buzzed!' : someoneElseBuzzed
    ? `${gameState.players.find(p => p.id === buzzedPlayerId)?.teamName ?? 'Someone'} buzzed`
    : canBuzz ? 'BUZZ' : phase === 'board' ? 'Waiting…' : 'BUZZ';

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-between px-6 py-10"
      style={{ background: '#C8E6F5' }}
    >
      {/* Top — team info */}
      <div className="flex flex-col items-center gap-2">
        {me && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={me.face} alt="" style={{ width: 80, height: 80, borderRadius: '50%' }} />
            <p className="font-bold text-lg text-white">{me.teamName}</p>
            <p className="text-4xl font-black text-white">{me.score} pts</p>
          </>
        )}
      </div>

      {/* Center — buzz button */}
      <button
        onClick={handleBuzz}
        disabled={!canBuzz}
        style={{
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: buzzBg,
          border: '6px solid white',
          color: 'white',
          fontSize: isBuzzed || someoneElseBuzzed ? 18 : 32,
          fontWeight: 900,
          fontFamily: 'var(--font-inter), Inter, sans-serif',
          boxShadow: canBuzz ? '0 8px 40px rgba(53,183,251,0.5)' : 'none',
          cursor: canBuzz ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          transform: isBuzzed ? 'scale(1.08)' : 'scale(1)',
          textAlign: 'center',
          padding: '0 24px',
          lineHeight: 1.2,
        }}
      >
        {buzzLabel}
      </button>

      {/* Bottom — scoreboard */}
      <div className="w-full max-w-sm flex flex-col gap-2">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-wider text-center mb-1">Scores</p>
        {[...gameState.players]
          .sort((a, b) => b.score - a.score)
          .map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-4 py-2 rounded-2xl"
              style={{ background: p.teamName === nameParam ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)' }}
            >
              <span className="font-semibold text-white text-sm">{p.teamName}</span>
              <span className="font-bold text-white">{p.score}</span>
            </div>
          ))}
      </div>
    </main>
  );
}
