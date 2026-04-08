'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import GameBoard from '@/components/GameBoard';
import QuestionView from '@/components/QuestionView';
import PlayerCard from '@/components/PlayerCard';

export default function HostPage() {
  const { code } = useParams<{ code: string }>();
  const { gameState, emit } = useSocket();
  const router = useRouter();

  useEffect(() => {
    emit('host_connect', { code });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (!gameState) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#C8E6F5' }}>
        <p className="text-gray-500">Connecting…</p>
      </main>
    );
  }

  const { phase, activeQuestion, buzzedPlayerId, players } = gameState;
  const showQuestion = phase === 'question' || phase === 'buzzed';

  return (
    <main
      className="relative h-screen overflow-hidden flex flex-col items-center px-6 pt-6 pb-0 gap-4"
      style={{ background: '#C8E6F5' }}
    >
      {/* Top-right controls */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        {/* Game code badge */}
        <span className="text-sm font-bold tracking-widest text-white/70 mr-2">{code}</span>
        <button
          onClick={() => emit('host_reset_game', { code })}
          className="px-4 py-2 text-sm font-semibold transition-colors"
          style={{ color: '#74C0FC' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#4AABF5')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#74C0FC')}
        >
          Reset
        </button>
        <button
          onClick={() => router.push(`/edit/${code}`)}
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors"
          style={{ background: '#74C0FC' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#4AABF5')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#74C0FC')}
        >
          Edit game
        </button>
      </div>

      {/* Board / Question area */}
      <div className="relative w-full max-w-5xl flex-1 min-h-0 mt-10">
        {phase === 'board' && (
          <GameBoard
            gameState={gameState}
            onSelectQuestion={(catId, qId) =>
              emit('host_select_question', { code, categoryId: catId, questionId: qId })
            }
          />
        )}
        {showQuestion && activeQuestion && (
          <QuestionView
            gameState={gameState}
            onDismiss={() => emit('host_dismiss_question', { code })}
            onAnswerRevealed={() => emit('host_mark_answered', { code })}
          />
        )}
      </div>

      {/* Bottom bar — player cards */}
      <div className="flex-shrink-0 w-full max-w-5xl">
        {(() => {
          const CARD_W = 403;
          const CARD_GAP = 16;
          const AVAILABLE_W = 980;
          const BASE_SCALE = AVAILABLE_W / (4 * CARD_W + 3 * CARD_GAP);
          const fittingScale = AVAILABLE_W / (players.length * CARD_W + (players.length - 1) * CARD_GAP);
          const cardScale = Math.min(BASE_SCALE, fittingScale);
          return (
            <div className="flex items-end justify-center">
              <div className="flex items-end" style={{ gap: CARD_GAP, zoom: cardScale }}>
                {players.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    buzzed={player.id === buzzedPlayerId}
                    showJudge={showQuestion}
                    onCorrect={() => emit('host_judge', { code, correct: true, playerId: player.id })}
                    onWrong={() => emit('host_judge', { code, correct: false, playerId: player.id })}
                    onRename={(name) => emit('host_rename_team', { code, playerId: player.id, teamName: name })}
                  />
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </main>
  );
}
