'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { Category } from '@/types/game';

export default function EditPage() {
  const { gameState, emit } = useSocket();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingTile, setEditingTile] = useState<{ catIdx: number; qIdx: number } | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    emit('host_connect');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (gameState && categories.length === 0) {
      setTitle(gameState.title);
      setCategories(JSON.parse(JSON.stringify(gameState.categories)));
    }
  }, [gameState, categories.length]);

  const updateCategoryName = (catIdx: number, name: string) => {
    setCategories((prev) => prev.map((c, i) => (i === catIdx ? { ...c, name } : c)));
  };

  const updateQuestion = (
    catIdx: number,
    qIdx: number,
    field: 'text' | 'answer' | 'image',
    value: string
  ) => {
    setCategories((prev) =>
      prev.map((c, ci) =>
        ci !== catIdx
          ? c
          : { ...c, questions: c.questions.map((q, qi) => (qi !== qIdx ? q : { ...q, [field]: value })) }
      )
    );
  };

  const handleFinishEditing = () => {
    emit('host_save_game', { title, categories });
    router.push('/');
  };

  if (!gameState || categories.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAF9' }}>
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  const editingQuestion =
    editingTile ? categories[editingTile.catIdx]?.questions[editingTile.qIdx] : null;

  return (
    <main
      className="relative h-screen overflow-hidden flex flex-col items-center px-6 pt-6 pb-6 gap-4"
      style={{
        backgroundColor: '#F8FAF9',
        backgroundImage: 'repeating-linear-gradient(60deg, transparent 0px, transparent 12px, rgba(0,0,0,0.015) 12px, rgba(0,0,0,0.015) 30px)',
      }}
    >
      {/* Top-right controls */}
      <button
        onClick={handleFinishEditing}
        disabled={imageLoading}
        className="absolute top-4 right-4 z-10 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: '#111111' }}
        onMouseEnter={(e) => { if (!imageLoading) e.currentTarget.style.background = '#333333'; }}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#111111')}
      >
        {imageLoading ? 'Uploading…' : 'Finish editing'}
      </button>


      {/* Board / Edit question — fills all remaining space */}
      <div className="relative w-full max-w-5xl flex-1 min-h-0">
        {/* Game board (shown when no tile is selected) */}
        {!editingTile && (
          <div
            className="rounded-3xl p-4 w-full h-full flex flex-col gap-3"
            style={{
              background: '#FBFBFB',
              border: '6px solid #FFFFFF',
              boxShadow: '0px 4px 16px rgba(34, 34, 34, 0.06)',
            }}
          >
            {/* Category headers — editable */}
            <div className="grid grid-cols-5 gap-3 flex-shrink-0">
              {categories.map((cat, catIdx) => (
                <input
                  key={cat.id}
                  type="text"
                  value={cat.name}
                  onChange={(e) => updateCategoryName(catIdx, e.target.value)}
                  className="text-center font-semibold px-2 py-1 rounded-lg bg-transparent outline-none hover:bg-[#EEF6FB] focus:bg-[#EEF6FB] transition-colors truncate"
                  style={{
                    color: '#7AB0D8',
                    fontFamily: 'var(--font-inter), Inter, sans-serif',
                    fontSize: 20,
                  }}
                  placeholder={`Category ${catIdx + 1}`}
                />
              ))}
            </div>

            {/* Question grid */}
            {[0, 1, 2, 3, 4].map((rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-5 gap-3 flex-1 min-h-0">
                {categories.map((cat, colIdx) => {
                  const question = cat.questions[rowIdx];
                  const isReady = !!(question.answer && (question.text || question.image));
                  return (
                    <button
                      key={`${cat.id}-${question.id}`}
                      onClick={() => setEditingTile({ catIdx: colIdx, qIdx: rowIdx })}
                      className="relative rounded-[24px] flex items-center justify-center w-full h-full transition-all duration-150"
                      style={{
                        background: isReady ? '#EBF7FF' : '#F3F4F4',
                        border: isReady ? '2px solid #B8E7FF' : '2px solid #FFFFFF',
                        boxShadow: '0px 4px 16px rgba(34, 34, 34, 0.06)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isReady ? '#D6F0FF' : '#E8E9E9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = isReady ? '#EBF7FF' : '#F3F4F4')}
                    >
                      <span
                        className="relative z-10 font-bold text-2xl"
                        style={{
                          fontFamily: 'var(--font-inter), Inter, sans-serif',
                          fontWeight: 700,
                          color: isReady ? '#35B7FB' : 'rgba(192,192,192,0.6)',
                          textShadow: '0px 4px 16px rgba(34, 34, 34, 0.06)',
                        }}
                      >
                        {question.points}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Full-screen edit view (replaces board when a tile is selected) */}
        {editingTile && editingQuestion && (
          <div
            className="w-full h-full rounded-[32px] flex flex-col relative overflow-hidden"
            style={{ background: '#FBFBFB', border: '6px solid #FFFFFF', boxShadow: '0px 4px 16px rgba(34, 34, 34, 0.06)' }}
          >
            {/* Close */}
            <button
              onClick={() => setEditingTile(null)}
              className="absolute top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full opacity-30 hover:opacity-70 transition-opacity text-sm"
              style={{ color: '#4E8AB8', background: '#EEF6FB' }}
            >
              ✕
            </button>

            {/* Upper: header + question + image */}
            <div className="flex-1 flex flex-col items-center px-16 pt-10 pb-8 min-h-0 overflow-hidden">
              {/* Category · dot · points */}
              <div className="flex items-center gap-2 flex-shrink-0 mb-8">
                <span style={{ color: '#7AB0D8', fontFamily: 'var(--font-inter), Inter, sans-serif', fontWeight: 600, fontSize: '1.5rem', letterSpacing: '-0.01em' }}>
                  {categories[editingTile.catIdx].name}
                </span>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#9EC8E8', flexShrink: 0 }} />
                <span style={{ color: '#7AB0D8', fontFamily: 'var(--font-inter), Inter, sans-serif', fontWeight: 600, fontSize: '1.5rem', letterSpacing: '-0.01em' }}>
                  {editingQuestion.points}
                </span>
              </div>

              {/* Question textarea + image — centered together */}
              <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 gap-6">
                <textarea
                  value={editingQuestion.text}
                  onChange={(e) => updateQuestion(editingTile.catIdx, editingTile.qIdx, 'text', e.target.value)}
                  placeholder="Enter question..."
                  className="w-full text-center font-bold bg-transparent outline-none resize-none placeholder:text-[#C8DFF0]"
                  style={{
                    fontSize: 'clamp(2rem, 5vw, 6rem)',
                    color: '#2D6A9A',
                    fontFamily: 'var(--font-inter), Inter, sans-serif',
                    lineHeight: 1.21,
                  }}
                />
                <div className="flex-shrink-0">
                {editingQuestion.image ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editingQuestion.image} alt="Question" className="max-h-32 rounded-2xl object-contain" />
                    <button
                      onClick={() => updateQuestion(editingTile.catIdx, editingTile.qIdx, 'image', '')}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center hover:bg-black/70 transition-colors"
                    >✕</button>
                  </div>
                ) : (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && editingTile) {
                          setImageLoading(true);
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            updateQuestion(editingTile.catIdx, editingTile.qIdx, 'image', ev.target?.result as string);
                            setImageLoading(false);
                          };
                          reader.onerror = () => setImageLoading(false);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="insert-image-btn"
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#7AB0D8'; e.currentTarget.style.background = '#EEF6FB'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#9EC8E8'; e.currentTarget.style.background = 'transparent'; }}
                      style={{
                        position: 'relative',
                        borderRadius: 12,
                        padding: '16px 24px',
                        color: '#9EC8E8',
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
            </div>

            {/* Answer: shaded bottom panel */}
            <div
              className="flex-shrink-0 flex items-center justify-center px-16"
              style={{ background: '#EEF6FB', height: '33%' }}
            >
              <input
                type="text"
                value={editingQuestion.answer}
                onChange={(e) => updateQuestion(editingTile.catIdx, editingTile.qIdx, 'answer', e.target.value)}
                placeholder="Add answer"
                className="w-full text-center font-bold bg-transparent outline-none placeholder:text-[#C8DFF0]"
                style={{
                  fontSize: 'clamp(2rem, 5vw, 6rem)',
                  color: '#2D6A9A',
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
