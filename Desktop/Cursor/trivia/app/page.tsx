'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

export default function LandingPage() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const socket = io({ path: '/socket.io' });
    socketRef.current = socket;

    socket.on('game_created', ({ code }: { code: string }) => {
      router.push(`/host/${code}`);
    });

    socket.on('game_error', (msg: string) => {
      setError(msg);
      setCreating(false);
    });

    return () => { socket.disconnect(); };
  }, [router]);

  function handleCreate() {
    setCreating(true);
    setError('');
    socketRef.current?.emit('create_game');
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    const name = joinName.trim();
    if (!code || !name) return;
    router.push(`/play/${code}?name=${encodeURIComponent(name)}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: '#C8E6F5' }}>
      <div className="w-full max-w-md flex flex-col gap-6">

        {/* Logo / title */}
        <div className="text-center mb-2">
          <h1 className="text-4xl font-black text-white drop-shadow" style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
            Trivia
          </h1>
        </div>

        {/* Create game */}
        <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col gap-4">
          <h2 className="font-bold text-lg text-gray-800">Host a game</h2>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-3 rounded-2xl text-white font-semibold text-base transition-colors disabled:opacity-60"
            style={{ background: '#35B7FB' }}
            onMouseEnter={(e) => { if (!creating) e.currentTarget.style.background = '#1aa3e8'; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#35B7FB')}
          >
            {creating ? 'Creating…' : 'Create new game'}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/40" />
          <span className="text-white/70 text-sm font-medium">or</span>
          <div className="flex-1 h-px bg-white/40" />
        </div>

        {/* Join game */}
        <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col gap-4">
          <h2 className="font-bold text-lg text-gray-800">Join a game</h2>
          <form onSubmit={handleJoin} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Game code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-blue-300 outline-none font-bold text-lg tracking-widest text-center transition-colors"
              style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}
            />
            <input
              type="text"
              placeholder="Team name"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              className="px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-blue-300 outline-none font-semibold transition-colors"
            />
            <button
              type="submit"
              disabled={!joinCode.trim() || !joinName.trim()}
              className="w-full py-3 rounded-2xl text-white font-semibold text-base transition-colors disabled:opacity-40"
              style={{ background: '#35B7FB' }}
              onMouseEnter={(e) => { if (joinCode && joinName) e.currentTarget.style.background = '#1aa3e8'; }}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#35B7FB')}
            >
              Join
            </button>
          </form>
        </div>

        {error && <p className="text-center text-red-500 text-sm">{error}</p>}
      </div>
    </main>
  );
}
