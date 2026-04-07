'use client';
import { useState } from 'react';
import { Player } from '@/types/game';

interface Props {
  player: Player;
  buzzed?: boolean;
  showJudge?: boolean;
  onCorrect?: () => void;
  onWrong?: () => void;
  onRename?: (newName: string) => void;
}

// Figma specs:
// Card: 403×121px, border-radius 32 32 0 0, padding 29px 64px
// Avatar group: absolute at (18.03, -15.19), circle 125.38px
const CARD_WIDTH = 403;
const CARD_HEIGHT = 121;
const AVATAR_SIZE = 125;
const AVATAR_OFFSET_X = 18;
const AVATAR_OVERFLOW_TOP = 16; // ~15.19px above card top

export default function PlayerCard({ player, buzzed, showJudge, onCorrect, onWrong, onRename }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(player.teamName);

  function commit() {
    const name = draft.trim();
    if (name && name !== player.teamName) onRename?.(name);
    else setDraft(player.teamName);
    setEditing(false);
  }

  return (
    // Wrapper adds top padding so the avatar overflow doesn't clip
    <div className="relative" style={{ paddingTop: AVATAR_OVERFLOW_TOP }}>

      {/* Avatar — overlaps above the card's top-left area */}
      <div style={{ position: 'absolute', zIndex: 10, left: AVATAR_OFFSET_X, top: 0 }}>
        <div style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={player.face}
            alt=""
            style={{
              display: 'block',
              width: '118%',
              height: '118%',
              marginLeft: '-9%',
              marginTop: '-9%',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Judge buttons — shown when player buzzed and awaiting judgment */}
        {showJudge && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1">
            <button
              onClick={onCorrect}
              className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold shadow-md hover:bg-green-600 transition-colors"
            >
              ✓
            </button>
            <button
              onClick={onWrong}
              className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-bold shadow-md hover:bg-red-600 transition-colors"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Card body */}
      <div
        className="transition-all duration-200"
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          background: buzzed ? player.color + '33' : '#FBFBFB',
          borderRadius: '32px 32px 0px 0px',
          borderWidth: '4px 4px 0px 4px',
          borderStyle: 'solid',
          borderColor: buzzed ? player.color : '#FFFFFF',
          boxShadow: '0px 4px 16px rgba(34, 34, 34, 0.06)',
          padding: '29px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(player.teamName); setEditing(false); } }}
              style={{
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontWeight: 700,
                fontSize: 18,
                lineHeight: '1.21em',
                color: 'rgba(0, 0, 0, 0.7)',
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid rgba(0,0,0,0.2)',
                outline: 'none',
                width: 180,
                padding: 0,
              }}
            />
          ) : (
            <p
              onClick={() => { setDraft(player.teamName); setEditing(true); }}
              style={{
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontWeight: 700,
                fontSize: 18,
                lineHeight: '1.21em',
                color: 'rgba(0, 0, 0, 0.5)',
                margin: 0,
                whiteSpace: 'nowrap',
                cursor: onRename ? 'text' : 'default',
              }}
            >
              {player.teamName}
            </p>
          )}
          <p
            style={{
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              fontWeight: 700,
              fontSize: 36,
              lineHeight: '1.21em',
              color: '#000000',
              margin: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {player.score} pts
          </p>
        </div>
      </div>
    </div>
  );
}
