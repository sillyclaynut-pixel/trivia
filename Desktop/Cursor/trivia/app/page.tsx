'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import GameBoard from '@/components/GameBoard';
import QuestionView from '@/components/QuestionView';
import PlayerCard from '@/components/PlayerCard';

export default function HostPage() {
  const { gameState, emit } = useSocket();
  const router = useRouter();

  useEffect(() => {
    emit('host_connect');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!gameState) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#C8E6F5' }}>
        <p className="text-gray-500">Connecting…</p>
      </main>
    );
  }

  const { phase, activeQuestion, buzzedPlayerId, players } = gameState;
  const showBoard = phase === 'board';
  const showQuestion = phase === 'question' || phase === 'buzzed';

  return (
    <main
      className="h-screen overflow-hidden flex flex-col items-center px-6 pt-6 pb-0 gap-4"
      style={{ background: '#C8E6F5' }}
    >
      {/* Header */}
      <div className="flex-shrink-0 bg-white rounded-2xl px-6 py-3 flex items-center gap-6 shadow-sm">
        <p className="font-bold text-gray-900 text-base">{gameState.title}</p>
        <button
          onClick={() => router.push('/edit')}
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors"
          style={{ background: '#74C0FC' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#4AABF5')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#74C0FC')}
        >
          Edit game
        </button>
      </div>

      {/* Board / Question area — fills all remaining space */}
      <div className="relative w-full max-w-5xl flex-1 min-h-0">
        {showBoard && (
          <GameBoard
            gameState={gameState}
            onSelectQuestion={(catId, qId) =>
              emit('host_select_question', { categoryId: catId, questionId: qId })
            }
          />
        )}

        {showQuestion && activeQuestion && (
          <QuestionView
            gameState={gameState}
            onDismiss={() => emit('host_dismiss_question')}
            onAnswerRevealed={() => emit('host_mark_answered')}
          />
        )}
      </div>

      {/* Bottom bar — player cards */}
      <div className="flex-shrink-0 w-full max-w-5xl">
        {(() => {
          const CARD_W = 403;
          const CARD_GAP = 16;
          const AVAILABLE_W = 980; // ~max-w-5xl minus reset btn
          const BASE_SCALE = AVAILABLE_W / (4 * CARD_W + 3 * CARD_GAP);
          const fittingScale = AVAILABLE_W / (players.length * CARD_W + (players.length - 1) * CARD_GAP);
          const cardScale = Math.min(BASE_SCALE, fittingScale);
          return (
            <div className="flex items-end justify-center gap-2">
              <div className="flex items-end" style={{ gap: CARD_GAP, zoom: cardScale }}>
                {players.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    buzzed={player.id === buzzedPlayerId}
                    showJudge={phase === 'buzzed' && player.id === buzzedPlayerId}
                    onCorrect={() => emit('host_judge', { correct: true })}
                    onWrong={() => emit('host_judge', { correct: false })}
                    onRename={(name) => emit('host_rename_team', { playerId: player.id, teamName: name })}
                  />
                ))}
              </div>
              <button
                onClick={() => emit('host_reset_game')}
                className="text-xs text-gray-400 hover:text-gray-600 underline ml-2 flex-shrink-0"
              >
                Reset
              </button>
            </div>
          );
        })()}
      </div>
    </main>
  );
}
