'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { GameTitleProvider, useGameTitle } from './game-title-context';

function GameLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { title, setTitle } = useGameTitle();

  const isEditing = pathname.startsWith('/edit/');
  const label = isEditing ? 'Finish Editing' : 'Edit game';

  // — Morphing edit button —
  const btnRef = useRef<HTMLButtonElement>(null);
  const btnRulerRef = useRef<HTMLSpanElement>(null);
  const isFirstBtn = useRef(true);

  useLayoutEffect(() => {
    if (!btnRef.current || !btnRulerRef.current) return;
    const w = btnRulerRef.current.getBoundingClientRect().width;
    if (isFirstBtn.current) {
      isFirstBtn.current = false;
      btnRef.current.style.transition = 'none';
    } else {
      btnRef.current.style.transition = 'width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
    btnRef.current.style.width = `${w}px`;
  }, [label]);

  useEffect(() => {
    if (!btnRef.current) return;
    const span = btnRef.current.querySelector('span');
    if (span) span.textContent = label;
  }, [label]);

  // — Morphing center card —
  const cardRef = useRef<HTMLDivElement>(null);
  const cardRulerRef = useRef<HTMLDivElement>(null);
  const isFirstCard = useRef(true);
  const prevIsEditing = useRef(isEditing);

  useLayoutEffect(() => {
    if (!cardRef.current || !cardRulerRef.current) return;
    const w = cardRulerRef.current.getBoundingClientRect().width;
    const modeChanged = prevIsEditing.current !== isEditing;
    prevIsEditing.current = isEditing;
    if (isFirstCard.current || !modeChanged) {
      isFirstCard.current = false;
      cardRef.current.style.transition = 'none';
    } else {
      cardRef.current.style.transition = 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
    cardRef.current.style.width = `${w}px`;
  }, [isEditing, title]);

  // — Hover bounce state for code tiles —
  const [codeHovered, setCodeHovered] = useState(false);

  const codeChars = (code as string).toUpperCase().split('');
  const tileStyle = (i: number) => ({
    width: 32, height: 36,
    background: isEditing ? '#F0F0F0' : '#EEF6FB',
    borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: isEditing ? '#AAAAAA' : '#9EC8E8',
    fontFamily: 'var(--font-inter), Inter, sans-serif',
    fontWeight: 700, fontSize: 16,
    animation: codeHovered ? 'tile-bounce 0.5s ease both' : undefined,
    animationDelay: codeHovered ? `${i * 60}ms` : undefined,
    transition: 'background 0.3s ease, color 0.3s ease',
  });

  return (
    <>
      {/* Hidden ruler — btn */}
      <span
        ref={btnRulerRef}
        aria-hidden
        style={{
          position: 'fixed', top: -9999, left: -9999,
          visibility: 'hidden', whiteSpace: 'nowrap',
          padding: '10px 1rem', fontSize: '0.875rem', fontWeight: 600,
          fontFamily: 'var(--font-inter), Inter, sans-serif', pointerEvents: 'none',
        }}
      >
        {label}
      </span>

      {/* Hidden ruler — card */}
      <div
        ref={cardRulerRef}
        aria-hidden
        style={{
          position: 'fixed', top: -9999, left: -9999,
          visibility: 'hidden', pointerEvents: 'none',
          display: 'flex', alignItems: 'center', gap: 28,
          padding: '16px 24px',
          fontFamily: 'var(--font-inter), Inter, sans-serif',
        }}
      >
        {isEditing ? (
          <span style={{ fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap',
            width: `${Math.max((title || 'Game title').length, 6)}ch`, display: 'inline-block' }}>
            {title || 'Game title'}
          </span>
        ) : (
          <span style={{ fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {title || 'Trivia'}
          </span>
        )}
        {isEditing ? (
          <span style={{ fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap' }}>Editing</span>
        ) : (
          <div style={{ display: 'flex', gap: 4 }}>
            {codeChars.map((_, i) => <div key={i} style={{ width: 32, height: 36 }} />)}
          </div>
        )}
      </div>

      {/* Morphing Edit / Finish Editing button */}
      <button
        ref={btnRef}
        onClick={() => router.push(isEditing ? `/host/${code}` : `/edit/${code}`)}
        className="fixed z-50 rounded-xl text-white text-sm font-semibold overflow-hidden"
        style={{
          top: 28, right: 32,
          background: isEditing ? '#111111' : '#57C2FF',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-inter), Inter, sans-serif',
          paddingTop: 10, paddingBottom: 10,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = isEditing ? '#333333' : '#2EAAEE')}
        onMouseLeave={(e) => (e.currentTarget.style.background = isEditing ? '#111111' : '#57C2FF')}
      >
        <span style={{ display: 'block', padding: '0 1rem' }}>{label}</span>
      </button>

      {/* Center header card */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-40">
        <div
          ref={cardRef}
          className="flex items-center gap-7 bg-white overflow-hidden"
          style={{
            borderRadius: '0 0 24px 24px',
            padding: '16px 24px',
            boxShadow: '0px 4px 16px rgba(34,34,34,0.06)',
          }}
        >
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Game title"
              className="bg-transparent outline-none text-left hover:bg-[#F0F0F0] focus:bg-[#F0F0F0] rounded-lg px-2 py-2 transition-colors placeholder:text-[#D5D5D5]"
              style={{
                color: '#979797',
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontWeight: 600, fontSize: 16, letterSpacing: '-0.01em',
                whiteSpace: 'nowrap', minWidth: 0,
                width: `${Math.max((title || 'Game title').length, 6)}ch`,
              }}
            />
          ) : (
            <span style={{
              color: '#7AB0D8',
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              fontWeight: 600, fontSize: 16, letterSpacing: '-0.01em', whiteSpace: 'nowrap',
            }}>
              {title || 'Trivia'}
            </span>
          )}
          {isEditing ? (
            <span style={{
              color: '#AAAAAA',
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              fontWeight: 600, fontSize: 16, whiteSpace: 'nowrap',
              marginLeft: 'auto',
            }}>
              Editing
            </span>
          ) : (
            <div
              className="flex items-center gap-1"
              style={{ marginLeft: 'auto' }}
              onMouseEnter={() => setCodeHovered(true)}
              onMouseLeave={() => setCodeHovered(false)}
            >
              {codeChars.map((char, i) => (
                <div key={i} style={tileStyle(i)}>{char}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {children}
    </>
  );
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <GameTitleProvider>
      <GameLayoutInner>{children}</GameLayoutInner>
    </GameTitleProvider>
  );
}
