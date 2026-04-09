'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGameTitle } from '../../game-title-context';
import GameBoard from '@/components/GameBoard';
import QuestionView from '@/components/QuestionView';
import PlayerCard from '@/components/PlayerCard';

function BoardAnimated({ children }: { children: React.ReactNode }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className="relative w-full max-w-5xl flex-1 min-h-0"
      style={{
        transform: entered ? 'scale(1)' : 'scale(0.94)',
        opacity: entered ? 1 : 0,
        transition: entered ? 'transform 0.6s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.35s ease' : 'none',
      }}
    >
      {children}
    </div>
  );
}

export default function HostPage() {
  const { code } = useParams<{ code: string }>();
  const { gameState, emit } = useSocket();
  const router = useRouter();
  const { setTitle } = useGameTitle();

  useEffect(() => {
    emit('host_connect', { code });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    if (gameState?.title) setTitle(gameState.title);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.title]);

  const phase = gameState?.phase;
  const activeQuestion = gameState?.activeQuestion;
  const buzzedPlayerId = gameState?.buzzedPlayerId;
  const players = gameState?.players ?? [];
  const showQuestion = phase === 'question' || phase === 'buzzed';

  return (
    <main className="relative h-screen overflow-hidden flex flex-col pb-0">
      <div className="absolute inset-0 -z-10" style={{ background: '#C8E6F5', animation: 'fadeIn 0.35s ease both' }} />

      {!gameState ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Connecting…</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="relative flex items-center px-8 flex-shrink-0" style={{ height: 96 }}>

            {/* Exit — far left */}
            <button
              onClick={() => router.push('/')}
              className="text-sm font-semibold rounded-xl px-3 py-2 transition-colors"
              style={{ color: '#7AB0D8', fontFamily: 'var(--font-inter), Inter, sans-serif' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#4E8AB8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#7AB0D8')}
            >
              <svg width="8" height="13" viewBox="0 0 8 13" fill="none" style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }}>
                <path d="M6.5 1.5L1.5 6.5L6.5 11.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Exit game
            </button>

            {/* Right — Reset (Edit game handled by layout's morphing button) */}
            <div className="ml-auto flex items-center self-stretch" style={{ paddingRight: 108 }}>
              <button
                onClick={() => emit('host_reset_game', { code })}
                className="text-sm font-semibold rounded-xl px-4 py-3 transition-colors"
                style={{ color: '#7AB0D8', fontFamily: 'var(--font-inter), Inter, sans-serif' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#4E8AB8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#7AB0D8')}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Content — board + player cards */}
          <div className="flex-1 flex flex-col items-center px-6 min-h-0 gap-4">
            <BoardAnimated>
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
            </BoardAnimated>

            {/* Player cards */}
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
          </div>
        </>
      )}
    </main>
  );
}
