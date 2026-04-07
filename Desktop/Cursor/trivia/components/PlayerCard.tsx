'use client';
import { useEffect, useRef, useState } from 'react';
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

const JUDGE_BTN_SIZE = 56;
const JUDGE_BTN_GAP = 8;

export default function PlayerCard({ player, buzzed, showJudge, onCorrect, onWrong, onRename }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(player.teamName);
  const [flashRed, setFlashRed] = useState(false);
  const prevScore = useRef(player.score);

  useEffect(() => {
    if (player.score < prevScore.current) {
      setFlashRed(true);
      const t = setTimeout(() => setFlashRed(false), 600);
      prevScore.current = player.score;
      return () => clearTimeout(t);
    }
    prevScore.current = player.score;
  }, [player.score]);

  function commit() {
    const name = draft.trim();
    if (name && name !== player.teamName) onRename?.(name);
    else setDraft(player.teamName);
    setEditing(false);
  }

  // Right-align the button pair with a small margin from the card's right edge
  const btnGroupWidth = JUDGE_BTN_SIZE * 2 + JUDGE_BTN_GAP;
  const btnGroupLeft = CARD_WIDTH - btnGroupWidth - 20;
  // Bleed ~half button height above the card top
  const btnGroupTop = AVATAR_OVERFLOW_TOP - JUDGE_BTN_SIZE / 2;

  return (
    // Wrapper adds top padding so the avatar overflow doesn't clip
    <div className="relative" style={{ paddingTop: AVATAR_OVERFLOW_TOP }}>

      {/* Avatar — overlaps above the card's top-left area */}
      <div style={{ position: 'absolute', zIndex: 10, left: AVATAR_OFFSET_X, top: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={player.face}
          alt=""
          style={{
            display: 'block',
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: '50%',
            overflow: 'hidden',
          }}
        />
      </div>

      {/* Judge buttons — bleed over the card top edge */}
      {showJudge && (
        <div style={{
          position: 'absolute',
          top: btnGroupTop,
          left: btnGroupLeft,
          display: 'flex',
          flexDirection: 'row',
          gap: JUDGE_BTN_GAP,
          zIndex: 20,
        }}>
          <button
            onClick={onCorrect}
            className="transition-transform duration-150 hover:scale-110 hover:rotate-3"
            style={{
              width: JUDGE_BTN_SIZE,
              height: JUDGE_BTN_SIZE,
              background: '#4CD964',
              borderRadius: 16,
              border: '4px solid white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 26,
              fontWeight: 'bold',
              boxShadow: 'none',
            }}
          >
            ✓
          </button>
          <button
            onClick={onWrong}
            className="transition-transform duration-150 hover:scale-110 hover:-rotate-3"
            style={{
              width: JUDGE_BTN_SIZE,
              height: JUDGE_BTN_SIZE,
              background: '#FF3B30',
              borderRadius: 16,
              border: '4px solid white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 26,
              fontWeight: 'bold',
              boxShadow: 'none',
            }}
          >
            ✕
          </button>
        </div>
      )}

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
          justifyContent: 'center',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'flex-start' }}>
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
                fontSize: 22,
                lineHeight: '1.21em',
                color: 'rgba(0, 0, 0, 0.7)',
                background: 'rgba(0,0,0,0.05)',
                border: '2px solid transparent',
                borderRadius: 8,
                outline: 'none',
                width: 180,
                padding: '4px 10px',
                boxSizing: 'border-box',
                textAlign: 'left',
              }}
            />
          ) : (
            <p
              onClick={() => { setDraft(player.teamName); setEditing(true); }}
              className={onRename ? 'transition-colors hover:bg-black/5' : ''}
              style={{
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontWeight: 700,
                fontSize: 22,
                lineHeight: '1.21em',
                color: 'rgba(0, 0, 0, 0.5)',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: onRename ? 'text' : 'default',
                border: '2px solid transparent',
                borderRadius: 8,
                padding: '4px 10px',
                width: 180,
                boxSizing: 'border-box',
                textAlign: 'left',
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
              color: flashRed ? '#FF3B30' : '#000000',
              margin: 0,
              whiteSpace: 'nowrap',
              paddingLeft: 12,
              transition: 'color 0.3s ease',
            }}
          >
            {player.score} pts
          </p>
        </div>
      </div>
    </div>
  );
}
