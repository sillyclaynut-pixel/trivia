'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const isEditing = pathname.startsWith('/edit/');
  const label = isEditing ? 'Finish editing' : 'Edit game';

  const btnRef = useRef<HTMLButtonElement>(null);
  const rulerRef = useRef<HTMLSpanElement>(null);
  const isFirst = useRef(true);

  useLayoutEffect(() => {
    if (!btnRef.current || !rulerRef.current) return;
    const w = rulerRef.current.getBoundingClientRect().width;
    if (isFirst.current) {
      isFirst.current = false;
      btnRef.current.style.transition = 'none';
    } else {
      btnRef.current.style.transition = 'width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
    btnRef.current.style.width = `${w}px`;
  }, [label]);

  // keep displayed text in sync (swap immediately — button clips overflow during grow)
  useEffect(() => {
    if (!btnRef.current) return;
    const span = btnRef.current.querySelector('span');
    if (span) span.textContent = label;
  }, [label]);

  return (
    <>
      {/* Hidden ruler — always has the current label at natural width */}
      <span
        ref={rulerRef}
        aria-hidden
        style={{
          position: 'fixed',
          top: -9999,
          left: -9999,
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          fontFamily: 'var(--font-inter), Inter, sans-serif',
          pointerEvents: 'none',
        }}
      >
        {label}
      </span>

      {/* Morphing button — persists across navigations */}
      <button
        ref={btnRef}
        onClick={() => router.push(isEditing ? `/host/${code}` : `/edit/${code}`)}
        className="fixed top-4 right-4 z-50 py-2 rounded-xl text-white text-sm font-semibold overflow-hidden"
        style={{ background: '#74C0FC', whiteSpace: 'nowrap' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#4AABF5')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#74C0FC')}
      >
        <span style={{ display: 'block', padding: '0 1rem' }}>{label}</span>
      </button>

      {children}
    </>
  );
}
