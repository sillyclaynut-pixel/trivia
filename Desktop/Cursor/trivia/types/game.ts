export interface Question {
  id: string;
  text: string;
  answer: string;
  points: number;
  answered: boolean;
  image?: string; // base64 data URL
}

export interface Category {
  id: string;
  name: string;
  questions: Question[];
}

export const AVATAR_FACES = [
  '/images/face-1.png',
  '/images/face-2.png',
  '/images/face-3.png',
  '/images/face-4.png',
  '/images/face-5.png',
];
export const AVATAR_COLORS = [
  '#FFD93D', // yellow
  '#6BCB77', // green
  '#FF6B9D', // pink
  '#4ECDC4', // teal
  '#FF9F43', // orange
];

export interface Player {
  id: string;
  teamName: string;
  score: number;
  color: string;
  face: string;
}

export type GamePhase = 'waiting' | 'board' | 'question' | 'buzzed';

export interface ActiveQuestion {
  categoryId: string;
  questionId: string;
}

export interface GameState {
  id: string;
  title: string;
  code: string;
  phase: GamePhase;
  categories: Category[];
  players: Player[];
  activeQuestion: ActiveQuestion | null;
  buzzedPlayerId: string | null;
}
