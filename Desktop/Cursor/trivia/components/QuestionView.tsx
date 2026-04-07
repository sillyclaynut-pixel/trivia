'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GameState } from '@/types/game';

interface Props {
  gameState: GameState;
  onDismiss: () => void;
  onAnswerRevealed?: () => void;
}

// Bottom answer panel height as a fraction of the card — matches Figma (~252/773)
const ANSWER_PANEL_H = '32%';
const FONT_MAX = 56; // px
const FONT_MIN = 14; // px
const REVEAL_TRANSITION_MS = 400;

function fitFontSize(el: HTMLParagraphElement, container: HTMLDivElement, max = FONT_MAX) {
  let size = max;
  el.style.fontSize = `${size}px`;
  while (el.scrollHeight > container.clientHeight && size > FONT_MIN) {
    size -= 1;
    el.style.fontSize = `${size}px`;
  }
  return size;
}

export default function QuestionView({ gameState, onDismiss, onAnswerRevealed }: Props) {
  const { categories, activeQuestion } = gameState;

  const activeText = (() => {
    if (!activeQuestion) return '';
    const cat = categories.find((c) => c.id === activeQuestion.categoryId);
    return cat?.questions.find((q) => q.id === activeQuestion.questionId)?.text ?? '';
  })();
  const fontMax = activeText.length > 200 ? 36 : activeText.length > 100 ? 48 : FONT_MAX;

  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [fontSize, setFontSize] = useState(fontMax);
  const textRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fit on question load
  useLayoutEffect(() => {
    const el = textRef.current;
    const container = containerRef.current;
    if (!el || !container) return;
    setFontSize(fitFontSize(el, container, fontMax));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuestion?.questionId]);

  // Re-fit after the padding-bottom reveal animation completes
  useEffect(() => {
    if (!answerRevealed) return;
    const timer = setTimeout(() => {
      const el = textRef.current;
      const container = containerRef.current;
      if (!el || !container) return;
      setFontSize(fitFontSize(el, container, fontMax));
    }, REVEAL_TRANSITION_MS + 10);
    return () => clearTimeout(timer);
  }, [answerRevealed]);

  if (!activeQuestion) return null;

  const category = categories.find((c) => c.id === activeQuestion.categoryId);
  const question = category?.questions.find((q) => q.id === activeQuestion.questionId);
  if (!category || !question) return null;

  const handleReveal = () => {
    setAnswerRevealed(true);
    onAnswerRevealed?.();
  };

  const imageOnly = !!question.image && !question.text;

  // Bottom panel shared across both layouts
  const answerPanel = answerRevealed ? (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-center justify-center"
      style={{
        height: ANSWER_PANEL_H,
        background: 'rgba(255, 255, 255, 0.24)',
        borderRadius: '0 0 24px 24px',
        animation: 'fadeIn 0.3s ease forwards',
      }}
    >
      <p
        className="text-white font-bold text-center px-8 leading-tight"
        style={{
          fontSize: 'clamp(1.5rem, 3.5vw, 3rem)',
          textShadow: '0px 4px 16px rgba(34, 34, 34, 0.06)',
        }}
      >
        {question.answer}
      </p>
    </div>
  ) : (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-6">
      <button
        onClick={handleReveal}
        className="text-white font-semibold transition-opacity"
        style={{ fontSize: 'clamp(0.85rem, 1.2vw, 1rem)', opacity: 0.7 }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
      >
        Reveal answer
      </button>
    </div>
  );

  // Image-only: image fills the card, panels float above it
  const header = (
    <div className="relative flex items-center justify-center pt-6 pb-2 px-14 flex-shrink-0">
      <p className="text-white font-semibold text-base tracking-wide opacity-90 whitespace-nowrap">
        {category.name} · {question.points}
      </p>
      <button
        onClick={onDismiss}
        className="absolute right-5 text-white opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
      >
        ✕
      </button>
    </div>
  );

  if (imageOnly) {
    return (
      <div className="w-full h-full rounded-3xl relative overflow-hidden" style={{ border: '6px solid white', animation: 'questionScaleIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={question.image!} alt="Question" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0">{header}</div>
        {answerPanel}
      </div>
    );
  }

  return (
    <div
      className="w-full h-full rounded-3xl relative overflow-hidden flex flex-col"
      style={{ background: '#35B7FB', border: '6px solid white', animation: 'questionScaleIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
    >
      {header}

      {/* Question content — centred, animates up on reveal */}
      <div
        className="flex-1 min-h-0 flex flex-col items-center justify-center px-10"
        style={{
          paddingBottom: answerRevealed ? `calc(${ANSWER_PANEL_H} - 120px)` : '0%',
          transition: `padding-bottom ${REVEAL_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        {/* Image alongside text — takes upper portion of space */}
        {question.image && (
          <div className="flex-[3] min-h-0 flex items-center justify-center w-full mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={question.image}
              alt="Question"
              className="max-w-full max-h-full rounded-2xl object-contain shadow-lg"
            />
          </div>
        )}

        {/* Measured container — question text shrinks to fit */}
        <div ref={containerRef} className={`${question.image ? 'flex-[2]' : 'flex-1'} min-h-0 flex items-center justify-center w-full overflow-hidden`}>
          <p
            ref={textRef}
            className="text-white font-black text-center leading-tight"
            style={{
              fontSize: `${fontSize}px`,
              textShadow: '0px 4px 16px rgba(34, 34, 34, 0.06)',
              transition: `font-size 0.3s ease`,
            }}
          >
            {question.text}
          </p>
        </div>
      </div>

      {/* Bottom answer panel */}
      {answerPanel}
    </div>
  );
}
