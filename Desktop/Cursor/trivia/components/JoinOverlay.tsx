'use client';
import { GameState } from '@/types/game';

interface Props {
  gameState: GameState;
  onStart: () => void;
}

export default function JoinOverlay({ gameState, onStart }: Props) {
  const code = gameState.code;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div className="bg-white rounded-3xl px-8 py-6 shadow-lg flex flex-col items-center gap-4 w-80">
        <p className="text-gray-700 text-sm font-medium self-start">Join with game code</p>

        {/* Code tiles */}
        <div className="flex gap-2">
          {code.split('').map((char, i) => (
            <div
              key={i}
              className="w-10 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl font-black text-gray-900"
            >
              {char}
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          className="w-full py-3 rounded-2xl text-white font-semibold text-sm transition-colors"
          style={{ background: '#74C0FC' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#4AABF5')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#74C0FC')}
        >
          Everyone&apos;s in!
        </button>
      </div>
    </div>
  );
}
