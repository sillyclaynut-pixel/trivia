'use client';
import { useState } from 'react';
import { GameState } from '@/types/game';

interface Props {
  gameState: GameState;
  onSelectQuestion: (categoryId: string, questionId: string) => void;
}


// Figma box-shadow shared across states
const BASE_SHADOW = '0px 4px 16px rgba(34, 34, 34, 0.06), inset 0px 4px 4px rgba(255, 255, 255, 0.25)';

export default function GameBoard({ gameState, onSelectQuestion }: Props) {
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-3xl p-4 w-full h-full flex flex-col gap-3">
      {/* Category headers */}
      <div className="grid grid-cols-5 gap-3 flex-shrink-0">
        {gameState.categories.map((cat) => (
          <div key={cat.id} className="text-center font-medium px-2 py-1 truncate" style={{ color: '#7AB0D8', fontSize: 20 }}>
            {cat.name}
          </div>
        ))}
      </div>

      {/* Question grid: 5 rows × 5 cols */}
      {[0, 1, 2, 3, 4].map((rowIdx) => (
        <div key={rowIdx} className="grid grid-cols-5 gap-3 flex-1 min-h-0">
          {gameState.categories.map((cat, colIdx) => {
            const question = cat.questions[rowIdx];
            const tileKey = `${cat.id}-${question.id}`;
            const isAnswered = question.answered;
            const isHovered = hoveredTile === tileKey && !isAnswered;

            // Keep existing varied tilt per position
            const tiltAngles = [-2, 1.5, -1, 2.5, -1.5];
            const tilt = tiltAngles[(colIdx + rowIdx) % tiltAngles.length];

            return (
              <button
                key={tileKey}
                disabled={isAnswered}
                onClick={() => !isAnswered && onSelectQuestion(cat.id, question.id)}
                onMouseEnter={() => setHoveredTile(tileKey)}
                onMouseLeave={() => setHoveredTile(null)}
                className="relative rounded-[24px] flex items-center justify-center overflow-hidden w-full h-full transition-all duration-150"
                style={{
                  background: isAnswered
                    ? '#F3F4F4'
                    : isHovered
                    ? 'linear-gradient(180deg, #5EC4FF 0%, #328BF1 100%)'
                    : 'linear-gradient(180deg, #9DDBFF 0%, #67C6FD 100%)',
                  border: '2px solid #FFFFFF',
                  boxShadow: isHovered
                    ? `${BASE_SHADOW}, 0 12px 28px rgba(50, 139, 241, 0.45)`
                    : BASE_SHADOW,
                  cursor: isAnswered ? 'default' : 'pointer',
                  transform: isHovered
                    ? `translateY(-6px) rotate(${tilt}deg) scale(1.04)`
                    : 'translateY(0) rotate(0deg) scale(1)',
                }}
              >
                {/* Stripe overlay — default and hover only */}
                {!isAnswered && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: 'url(/images/card-stripes.png)',
                      backgroundSize: '165% 145%',
                      backgroundPosition: isHovered ? undefined : 'center',
                      opacity: 0.24,
                      animation: isHovered ? 'stripe-drift 3s linear infinite' : undefined,
                    }}
                  />
                )}

                {/* Point value */}
                {isAnswered ? (
                  <span
                    className="relative z-10 font-bold"
                    style={{
                      fontFamily: 'var(--font-inter), Inter, sans-serif',
                      fontWeight: 700,
                      fontSize: 32,
                      background: 'linear-gradient(0deg, #C7C7C7 0%, #C6C2C2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {question.points}
                  </span>
                ) : (
                  <span
                    className="relative z-10 font-bold"
                    style={{
                      fontFamily: 'var(--font-inter), Inter, sans-serif',
                      fontWeight: 700,
                      fontSize: 32,
                      color: '#FFFFFF',
                      textShadow: '0px 4px 16px rgba(34, 34, 34, 0.06)',
                    }}
                  >
                    {question.points}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
