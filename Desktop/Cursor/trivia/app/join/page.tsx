'use client';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '@/types/game';

type JoinPhase = 'form' | 'waiting' | 'buzzer' | 'buzzed_me' | 'buzzed_other';

export default function JoinPage() {
  const [joinPhase, setJoinPhase] = useState<JoinPhase>('form');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io({ path: '/socket.io' });
    socketRef.current = socket;

    socket.on('connect', () => setMyId(socket.id ?? null));

    socket.on('game_state', (state: GameState) => {
      setGameState(state);

      // Determine buzzer phase based on game state
      if (state.phase === 'waiting') {
        setJoinPhase((prev) => (prev === 'form' ? 'form' : 'waiting'));
      } else if (state.phase === 'board') {
        setJoinPhase('buzzer');
      } else if (state.phase === 'question') {
        setJoinPhase('buzzer');
      } else if (state.phase === 'buzzed') {
        if (state.buzzedPlayerId === socket.id) {
          setJoinPhase('buzzed_me');
        } else {
          setJoinPhase('buzzed_other');
        }
      }
    });

    socket.on('error', ({ message }: { message: string }) => {
      setError(message);
    });

    return () => { socket.disconnect(); };
  }, []);

  const handleJoin = () => {
    if (!teamName.trim()) {
      setError('Please enter your team name.');
      return;
    }
    setError('');
    socketRef.current?.emit('join_game', { teamName: teamName.trim() });
    setJoinPhase('waiting');
  };

  const handleBuzz = () => {
    socketRef.current?.emit('buzz');
  };

  const myPlayer = gameState?.players.find((p) => p.id === myId);
  const buzzedPlayer = gameState?.players.find((p) => p.id === gameState.buzzedPlayerId);

  // ── Join form ────────────────────────────────────────────────
  if (joinPhase === 'form') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-5" style={{ background: '#C8E6F5' }}>
        <div className="bg-white rounded-3xl px-8 py-8 w-full max-w-sm flex flex-col gap-4 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 text-center">Join game</h1>

          <input
            type="text"
            placeholder="Team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
            className="w-full px-4 py-3 rounded-xl bg-gray-100 text-gray-900 placeholder-gray-400 text-base font-medium outline-none focus:ring-2 focus:ring-blue-300"
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            onClick={handleJoin}
            className="w-full py-3 rounded-2xl text-white font-bold text-base transition-colors"
            style={{ background: '#74C0FC' }}
          >
            Join
          </button>
        </div>
      </main>
    );
  }

  // ── Waiting for host to start ───────────────────────────────
  if (joinPhase === 'waiting') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-4" style={{ background: '#C8E6F5' }}>
        <div className="bg-white rounded-3xl px-8 py-8 w-full max-w-sm flex flex-col items-center gap-4 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {myPlayer && <img src={myPlayer.face} alt="" style={{ display: 'block', width: 64, height: 64, borderRadius: '50%' }} />}
          <p className="text-gray-700 font-semibold text-lg">{teamName}</p>
          <p className="text-gray-400 text-sm">Waiting for the host to start…</p>
        </div>
      </main>
    );
  }

  // ── Buzzer ──────────────────────────────────────────────────
  const canBuzz = joinPhase === 'buzzer' && gameState?.phase === 'question';

  return (
    <main className="min-h-screen flex flex-col items-center justify-between px-6 py-10" style={{ background: '#C8E6F5' }}>
      {/* Top: player info */}
      <div className="flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {myPlayer && <img src={myPlayer.face} alt="" style={{ display: 'block', width: 56, height: 56, borderRadius: '50%' }} />}
        <p className="text-gray-700 font-bold text-lg">{teamName}</p>
        <p className="text-2xl font-black text-gray-900">{myPlayer?.score ?? 0} pts</p>
      </div>

      {/* Center: buzzer */}
      <div className="flex flex-col items-center gap-6">
        {joinPhase === 'buzzed_me' && (
          <p className="text-gray-700 font-semibold text-base animate-pulse">You buzzed in!</p>
        )}
        {joinPhase === 'buzzed_other' && buzzedPlayer && (
          <p className="text-gray-500 text-sm text-center">
            {buzzedPlayer.teamName} buzzed first!
          </p>
        )}

        <button
          onClick={handleBuzz}
          disabled={!canBuzz}
          className="rounded-full flex items-center justify-center font-black text-white text-3xl transition-all duration-150 active:scale-95"
          style={{
            width: 200,
            height: 200,
            background: canBuzz
              ? '#74C0FC'
              : joinPhase === 'buzzed_me'
              ? '#6BCB77'
              : '#d0d0d0',
            boxShadow: canBuzz ? '0 8px 32px rgba(116,192,252,0.5)' : 'none',
            cursor: canBuzz ? 'pointer' : 'default',
          }}
        >
          {joinPhase === 'buzzed_me' ? '✓' : joinPhase === 'buzzed_other' ? '✕' : 'BUZZ'}
        </button>

        {!canBuzz && joinPhase === 'buzzer' && gameState?.phase === 'board' && (
          <p className="text-gray-400 text-sm">Waiting for a question…</p>
        )}
      </div>

      {/* Bottom: scoreboard */}
      <div className="w-full max-w-sm">
        {gameState && gameState.players.length > 1 && (
          <div className="bg-white rounded-2xl px-4 py-3 flex flex-col gap-2">
            {[...gameState.players]
              .sort((a, b) => b.score - a.score)
              .map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.face} alt="" style={{ display: 'block', width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
                    <span className={`text-sm font-medium ${p.id === myId ? 'text-gray-900' : 'text-gray-500'}`}>
                      {p.teamName}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-700">{p.score} pts</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </main>
  );
}
