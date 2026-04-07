import { GameState, Category, Player, AVATAR_COLORS, AVATAR_FACES } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';

function defaultPlayers(): Player[] {
  return Array.from({ length: 4 }, (_, i) => ({
    id: `preset-${i}`,
    teamName: `Team ${i + 1}`,
    score: 0,
    color: AVATAR_COLORS[i],
    face: AVATAR_FACES[i],
  }));
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function defaultCategories(): Category[] {
  return Array.from({ length: 5 }, (_, ci) => ({
    id: uuidv4(),
    name: `Category ${ci + 1}`,
    questions: [100, 200, 300, 400, 500].map((pts) => ({
      id: uuidv4(),
      text: '',
      answer: '',
      points: pts,
      answered: false,
    })),
  }));
}

// Single global game for simplicity — can be extended to multi-game
let game: GameState = {
  id: uuidv4(),
  title: 'My Trivia Game',
  code: generateCode(),
  phase: 'board',
  categories: defaultCategories(),
  players: defaultPlayers(),
  activeQuestion: null,
  buzzedPlayerId: null,
};

export function getGame(): GameState {
  return game;
}

export function updateGame(updates: Partial<GameState>): GameState {
  game = { ...game, ...updates };
  return game;
}

export function addPlayer(socketId: string, teamName: string): GameState {
  // If a preset slot has this name, claim it (so buzzing works via real socket ID)
  const matchIdx = game.players.findIndex(
    (p) => p.teamName.toLowerCase() === teamName.toLowerCase()
  );
  if (matchIdx >= 0) {
    const updated = [...game.players];
    updated[matchIdx] = { ...updated[matchIdx], id: socketId };
    game = { ...game, players: updated };
    return game;
  }

  const usedColors = game.players.map((p) => p.color);
  const usedFaces = game.players.map((p) => p.face);
  const color = AVATAR_COLORS.find((c) => !usedColors.includes(c)) ?? AVATAR_COLORS[game.players.length % AVATAR_COLORS.length];
  const face = AVATAR_FACES.find((f) => !usedFaces.includes(f)) ?? AVATAR_FACES[game.players.length % AVATAR_FACES.length];

  game = {
    ...game,
    players: [...game.players, { id: socketId, teamName, score: 0, color, face }],
  };
  return game;
}

export function renameTeam(playerId: string, teamName: string): GameState {
  game = {
    ...game,
    players: game.players.map((p) => p.id === playerId ? { ...p, teamName } : p),
  };
  return game;
}

export function removePlayer(socketId: string): GameState {
  game = { ...game, players: game.players.filter((p) => p.id !== socketId) };
  return game;
}

export function buzz(socketId: string): GameState | null {
  if (game.phase !== 'question' || game.buzzedPlayerId !== null) return null;
  game = { ...game, phase: 'buzzed', buzzedPlayerId: socketId };
  return game;
}

export function judgeAnswer(correct: boolean): GameState {
  const player = game.players.find((p) => p.id === game.buzzedPlayerId);
  if (!player || !game.activeQuestion) {
    game = { ...game, phase: 'board', activeQuestion: null, buzzedPlayerId: null };
    return game;
  }

  // Capture before mutation
  const { categoryId, questionId } = game.activeQuestion;

  const pointValue = game.categories
    .find((c) => c.id === categoryId)
    ?.questions.find((q) => q.id === questionId)?.points ?? 0;

  const delta = correct ? pointValue : -pointValue;

  // Mark question answered and update score
  game = {
    ...game,
    phase: 'board',
    buzzedPlayerId: null,
    activeQuestion: null,
    players: game.players.map((p) =>
      p.id === player.id ? { ...p, score: p.score + delta } : p
    ),
    categories: game.categories.map((c) =>
      c.id === categoryId
        ? {
            ...c,
            questions: c.questions.map((q) =>
              q.id === questionId ? { ...q, answered: true } : q
            ),
          }
        : c
    ),
  };
  return game;
}

export function selectQuestion(categoryId: string, questionId: string): GameState {
  game = {
    ...game,
    phase: 'question',
    activeQuestion: { categoryId, questionId },
    buzzedPlayerId: null,
  };
  return game;
}

export function dismissQuestion(): GameState {
  game = { ...game, phase: 'board', activeQuestion: null, buzzedPlayerId: null };
  return game;
}

export function markActiveQuestionAnswered(): GameState {
  if (!game.activeQuestion) return game;
  const { categoryId, questionId } = game.activeQuestion;
  game = {
    ...game,
    categories: game.categories.map((c) =>
      c.id === categoryId
        ? { ...c, questions: c.questions.map((q) => q.id === questionId ? { ...q, answered: true } : q) }
        : c
    ),
  };
  return game;
}

export function startGame(): GameState {
  game = { ...game, phase: 'board' };
  return game;
}

export function updateGameContent(title: string, categories: Category[]): GameState {
  game = { ...game, title, categories };
  return game;
}

export function resetGame(): GameState {
  // Keep team names but reset scores; restore any slots that lost their connection
  const resetPlayers = game.players.map((p, i) => ({
    ...p,
    id: p.id.startsWith('preset-') ? p.id : `preset-${i}`,
    score: 0,
  }));
  game = {
    ...game,
    phase: 'board',
    players: resetPlayers,
    activeQuestion: null,
    buzzedPlayerId: null,
    categories: game.categories.map((c) => ({
      ...c,
      questions: c.questions.map((q) => ({ ...q, answered: false })),
    })),
  };
  return game;
}
