'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGameTitle } from '../../game-title-context';
import { Category } from '@/types/game';

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

export default function EditPage() {
  const { code } = useParams<{ code: string }>();
  const { gameState, emit } = useSocket();
  const { title, setTitle } = useGameTitle();

  const [categories, setCategories] = useState<Category[]>([]);
  const [editingTile, setEditingTile] = useState<{ catIdx: number; qIdx: number } | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    emit('host_connect', { code });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    if (gameState && categories.length === 0) {
      if (!title) setTitle(gameState.title);
      setCategories(JSON.parse(JSON.stringify(gameState.categories)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, categories.length]);

  // Save latest state on unmount (triggered when layout button navigates away)
  const latestRef = useRef({ code, title, categories, emit });
  useEffect(() => { latestRef.current = { code, title, categories, emit }; });
  useEffect(() => {
    return () => {
      const { code, title, categories, emit } = latestRef.current;
      if (categories.length > 0) emit('host_save_game', { code, title, categories });
    };
  }, []);

  const updateCategoryName = (catIdx: number, name: string) => {
    setCategories((prev) => prev.map((c, i) => (i === catIdx ? { ...c, name } : c)));
  };

  const updateQuestion = (catIdx: number, qIdx: number, field: 'text' | 'answer' | 'image', value: string) => {
    setCategories((prev) =>
      prev.map((c, ci) =>
        ci !== catIdx ? c : { ...c, questions: c.questions.map((q, qi) => (qi !== qIdx ? q : { ...q, [field]: value })) }
      )
    );
  };

  const editingQuestion = editingTile ? categories[editingTile.catIdx]?.questions[editingTile.qIdx] : null;
  const ready = !!(gameState && categories.length > 0);

  return (
    <main className="relative h-screen overflow-hidden flex flex-col pb-0">
      <div className="absolute inset-0 -z-10" style={{ backgroundColor: '#F8FAF9', backgroundImage: 'repeating-linear-gradient(60deg, transparent 0px, transparent 12px, rgba(0,0,0,0.015) 12px, rgba(0,0,0,0.015) 30px)', animation: 'fadeIn 0.35s ease both' }} />
      {!ready ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Loading…</p>
        </div>
      ) : (<>

      {/* Header spacer — card is rendered by layout */}
      <div className="flex-shrink-0" style={{ height: 96 }} />

      <div className="flex-1 flex flex-col items-center px-6 min-h-0 gap-4">
      <BoardAnimated>
        {!editingTile && (
          <div
            className="bg-white rounded-3xl p-4 w-full h-full flex flex-col gap-3"
            style={{ boxShadow: '0px 4px 16px rgba(34, 34, 34, 0.06)' }}
          >
            <div className="grid grid-cols-5 gap-3 flex-shrink-0">
              {categories.map((cat, catIdx) => (
                <input
                  key={cat.id}
                  type="text"
                  value={cat.name}
                  onChange={(e) => updateCategoryName(catIdx, e.target.value)}
                  className="text-center font-semibold px-2 py-1 rounded-lg bg-transparent outline-none hover:bg-[#F0F0F0] focus:bg-[#F0F0F0] transition-colors truncate placeholder:text-[#D5D5D5]"
                  style={{ color: /^Category \d+$/.test(cat.name) || !cat.name ? '#D5D5D5' : '#979797', fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 20 }}
                  placeholder={`Category ${catIdx + 1}`}
                />
              ))}
            </div>
            {[0, 1, 2, 3, 4].map((rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-5 gap-3 flex-1 min-h-0">
                {categories.map((cat, colIdx) => {
                  const question = cat.questions[rowIdx];
                  const isReady = !!(question.answer && (question.text || question.image));
                  return (
                    <button
                      key={`${cat.id}-${question.id}`}
                      onClick={() => setEditingTile({ catIdx: colIdx, qIdx: rowIdx })}
                      className="relative rounded-[24px] flex items-center justify-center w-full h-full transition-all duration-150 hover:scale-[1.03]"
                      style={{
                        background: isReady ? '#EBF7FF' : '#F3F4F4',
                        border: '2px solid #FFFFFF',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isReady ? '#D6F0FF' : '#E8E9E9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = isReady ? '#EBF7FF' : '#F3F4F4')}
                    >
                      <span className="font-bold" style={{ fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 32, color: isReady ? '#35B7FB' : 'rgba(192,192,192,0.6)' }}>
                        {question.points}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {editingTile && editingQuestion && (
          <div
            className="w-full h-full rounded-[32px] flex flex-col relative overflow-hidden"
            style={{ background: '#FBFBFB', border: '6px solid #FFFFFF', boxShadow: '0px 4px 16px rgba(34, 34, 34, 0.06)' }}
          >
            <button
              onClick={() => setEditingTile(null)}
              className="absolute top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full opacity-30 hover:opacity-70 transition-opacity text-sm"
              style={{ color: '#888888', background: '#EEEEEE' }}
            >✕</button>

            {/* Upper: header + question + image */}
            <div className="flex-1 flex flex-col items-center px-16 pt-8 pb-6 min-h-0 overflow-hidden">
              {/* Header: category · points */}
              <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                <span style={{ color: '#979797', fontFamily: 'var(--font-inter), Inter, sans-serif', fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.01em' }}>
                  {categories[editingTile.catIdx].name}
                </span>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#CCCCCC', flexShrink: 0 }} />
                <span style={{ color: '#979797', fontFamily: 'var(--font-inter), Inter, sans-serif', fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.01em' }}>
                  {editingQuestion.points}
                </span>
              </div>

              {/* Textarea — centered in remaining space */}
              <div className="flex-1 flex items-center justify-center w-full min-h-0">
                <textarea
                  value={editingQuestion.text}
                  onChange={(e) => updateQuestion(editingTile.catIdx, editingTile.qIdx, 'text', e.target.value)}
                  placeholder="Enter question..."
                  className="w-full text-center font-bold bg-transparent outline-none resize-none placeholder:text-[#D5D5D5]"
                  style={{ fontSize: 'clamp(2rem, 5vw, 6rem)', color: '#444444', fontFamily: 'var(--font-inter), Inter, sans-serif', lineHeight: 1.21 }}
                />
              </div>

              {/* Image — pinned to bottom of upper section */}
              <div className="flex-shrink-0 pt-4">
                {editingQuestion.image ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editingQuestion.image} alt="Question" className="max-h-32 rounded-2xl object-contain" />
                    <button onClick={() => updateQuestion(editingTile.catIdx, editingTile.qIdx, 'image', '')} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center hover:bg-black/70 transition-colors">✕</button>
                  </div>
                ) : (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && editingTile) {
                          setImageLoading(true);
                          const reader = new FileReader();
                          reader.onload = (ev) => { updateQuestion(editingTile.catIdx, editingTile.qIdx, 'image', ev.target?.result as string); setImageLoading(false); };
                          reader.onerror = () => setImageLoading(false);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="insert-image-btn"
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#888888'; e.currentTarget.style.background = '#F0F0F0'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#CCCCCC'; e.currentTarget.style.background = 'transparent'; }}
                      style={{
                        position: 'relative',
                        borderRadius: 12,
                        padding: '10px 24px',
                        color: '#CCCCCC',
                        fontFamily: 'var(--font-inter), Inter, sans-serif',
                        fontWeight: 600,
                        fontSize: '1rem',
                        letterSpacing: '-0.01em',
                        background: 'transparent',
                        border: 'none',
                        transition: 'color 0.15s, background 0.15s',
                      }}
                    >
                      <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
                        <rect x="0.5" y="0.5" width="99%" height="99%" rx="11.5" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                      </svg>
                      Insert image
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Answer: shaded bottom panel */}
            <div
              className="flex-shrink-0 flex items-center justify-center px-16"
              style={{ background: '#F0F0F0', height: '33%' }}
            >
              <input
                type="text"
                value={editingQuestion.answer}
                onChange={(e) => updateQuestion(editingTile.catIdx, editingTile.qIdx, 'answer', e.target.value)}
                placeholder="Add answer"
                className="w-full text-center font-bold bg-transparent outline-none placeholder:text-[#D5D5D5]"
                style={{ fontSize: 'clamp(2rem, 5vw, 6rem)', color: '#444444', fontFamily: 'var(--font-inter), Inter, sans-serif' }}
              />
            </div>
          </div>
        )}
      </BoardAnimated>

      {/* Spacer matching the host page's player card bar height */}
      <div className="flex-shrink-0" style={{ height: 81 }} />
      </div>
      </>)}
    </main>
  );
}
