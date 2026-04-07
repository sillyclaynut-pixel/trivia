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
      className="h-screen overflow-hidden flex flex-col items-center px-6 pt-6 pb-6 gap-4"
      style={{ background: '#F8FAF9' }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 rounded-2xl px-6 py-3 flex items-center gap-4 w-full max-w-5xl"
        style={{ background: '#35B7FB', boxShadow: '0px 4px 16px rgba(34, 34, 34, 0.08)' }}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="font-bold text-base flex-1 bg-transparent outline-none placeholder-white/60"
          style={{ color: '#F8FAF9', fontFamily: 'var(--font-inter), Inter, sans-serif' }}
          placeholder="Game title"
        />
        <button
          onClick={handleFinishEditing}
          disabled={imageLoading}
          className="px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#F8FAF9', color: '#35B7FB' }}
          onMouseEnter={(e) => { if (!imageLoading) e.currentTarget.style.background = '#eef1ef'; }}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#F8FAF9')}
        >
          {imageLoading ? 'Uploading…' : 'Finish editing'}
        </button>
      </div>

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
                  className="text-center font-semibold text-sm px-2 py-1 rounded-lg bg-transparent outline-none focus:bg-black/5 transition-colors truncate"
                  style={{
                    color: 'rgba(0,0,0,0.5)',
                    fontFamily: 'var(--font-inter), Inter, sans-serif',
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
            className="w-full h-full rounded-3xl flex flex-col p-10 relative"
            style={{ background: '#FBFBFB', border: '6px solid #FFFFFF', boxShadow: '0px 4px 16px rgba(34, 34, 34, 0.06)' }}
          >
            {/* Close */}
            <button
              onClick={() => setEditingTile(null)}
              className="absolute top-4 right-4 opacity-40 hover:opacity-80 text-sm font-medium transition-opacity"
              style={{ color: '#222' }}
            >
              ✕ Close
            </button>

            {/* Category · Points */}
            <p className="text-sm mb-8 opacity-60" style={{ color: '#222' }}>
              {categories[editingTile.catIdx].name} · {editingQuestion.points}
            </p>

            {/* Image */}
            <div className="flex justify-center mb-6">
              {editingQuestion.image ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editingQuestion.image}
                    alt="Question"
                    className="max-h-48 rounded-2xl object-contain shadow-lg"
                  />
                  <button
                    onClick={() => updateQuestion(editingTile.catIdx, editingTile.qIdx, 'image', '')}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    ✕
                  </button>
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
                    className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 border-2 border-dashed border-gray-200 hover:border-blue-300 hover:text-blue-400 transition-colors"
                  >
                    + Add image
                  </button>
                </>
              )}
            </div>

            {/* Question textarea — large, centered */}
            <textarea
              value={editingQuestion.text}
              onChange={(e) => updateQuestion(editingTile.catIdx, editingTile.qIdx, 'text', e.target.value)}
              placeholder="Write the question here…"
              className="w-full flex-1 text-center font-black bg-transparent outline-none resize-none placeholder-gray-300 leading-tight"
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 3.5rem)',
                color: '#222',
                fontFamily: 'var(--font-inter), Inter, sans-serif',
              }}
            />

            {/* Answer */}
            <div className="mt-6 flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-40" style={{ color: '#222' }}>
                Answer
              </label>
              <input
                type="text"
                value={editingQuestion.answer}
                onChange={(e) => updateQuestion(editingTile.catIdx, editingTile.qIdx, 'answer', e.target.value)}
                placeholder="Answer…"
                className="w-full text-base bg-black/5 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                style={{ color: '#222' }}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
