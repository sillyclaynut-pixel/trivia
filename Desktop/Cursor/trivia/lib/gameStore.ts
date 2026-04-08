import { GameState, Category, Player, AVATAR_COLORS, AVATAR_FACES } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';

const games = new Map<string, GameState>();

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
  let code: string;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (games.has(code));
  return code;
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

function set(code: string, updates: Partial<GameState>): GameState | null {
  const game = games.get(code);
  if (!game) return null;
  const updated = { ...game, ...updates };
  games.set(code, updated);
  return updated;
}

export function createGame(): GameState {
  const code = generateCode();
  const game: GameState = {
    id: uuidv4(),
    title: 'My Trivia Game',
    code,
    phase: 'board',
    categories: defaultCategories(),
    players: defaultPlayers(),
    activeQuestion: null,
    buzzedPlayerId: null,
  };
  games.set(code, game);
  return game;
}

export function getGame(code: string): GameState | null {
  return games.get(code) ?? null;
}

export function addPlayer(code: string, socketId: string, teamName: string): GameState | null {
  const game = games.get(code);
  if (!game) return null;

  const matchIdx = game.players.findIndex(
    (p) => p.teamName.toLowerCase() === teamName.toLowerCase()
  );
  if (matchIdx >= 0) {
    const updated = [...game.players];
    updated[matchIdx] = { ...updated[matchIdx], id: socketId };
    return set(code, { players: updated });
  }

  const usedColors = game.players.map((p) => p.color);
  const usedFaces = game.players.map((p) => p.face);
  const color = AVATAR_COLORS.find((c) => !usedColors.includes(c)) ?? AVATAR_COLORS[game.players.length % AVATAR_COLORS.length];
  const face = AVATAR_FACES.find((f) => !usedFaces.includes(f)) ?? AVATAR_FACES[game.players.length % AVATAR_FACES.length];

  return set(code, {
    players: [...game.players, { id: socketId, teamName, score: 0, color, face }],
  });
}

export function renameTeam(code: string, playerId: string, teamName: string): GameState | null {
  const game = games.get(code);
  if (!game) return null;
  return set(code, {
    players: game.players.map((p) => p.id === playerId ? { ...p, teamName } : p),
  });
}

export function removePlayer(code: string, socketId: string): GameState | null {
  const game = games.get(code);
  if (!game) return null;
  return set(code, { players: game.players.filter((p) => p.id !== socketId) });
}

export function buzz(code: string, socketId: string): GameState | null {
  const game = games.get(code);
  if (!game || game.phase !== 'question' || game.buzzedPlayerId !== null) return null;
  return set(code, { phase: 'buzzed', buzzedPlayerId: socketId });
}

export function judgeAnswer(code: string, correct: boolean, playerId: string): GameState | null {
  const game = games.get(code);
  if (!game) return null;

  const player = game.players.find((p) => p.id === playerId);
  if (!player || !game.activeQuestion) {
    return set(code, { phase: 'board', activeQuestion: null, buzzedPlayerId: null });
  }

  const { categoryId, questionId } = game.activeQuestion;
  const pointValue = game.categories
    .find((c) => c.id === categoryId)
    ?.questions.find((q) => q.id === questionId)?.points ?? 0;
  const delta = correct ? pointValue : -pointValue;

  if (correct) {
    return set(code, {
      phase: 'board',
      buzzedPlayerId: null,
      activeQuestion: null,
      players: game.players.map((p) => p.id === player.id ? { ...p, score: p.score + delta } : p),
      categories: game.categories.map((c) =>
        c.id === categoryId
          ? { ...c, questions: c.questions.map((q) => q.id === questionId ? { ...q, answered: true } : q) }
          : c
      ),
    });
  } else {
    return set(code, {
      phase: 'question',
      buzzedPlayerId: null,
      players: game.players.map((p) => p.id === player.id ? { ...p, score: p.score + delta } : p),
    });
  }
}

export function selectQuestion(code: string, categoryId: string, questionId: string): GameState | null {
  return set(code, { phase: 'question', activeQuestion: { categoryId, questionId }, buzzedPlayerId: null });
}

export function dismissQuestion(code: string): GameState | null {
  return set(code, { phase: 'board', activeQuestion: null, buzzedPlayerId: null });
}

export function markActiveQuestionAnswered(code: string): GameState | null {
  const game = games.get(code);
  if (!game?.activeQuestion) return game ?? null;
  const { categoryId, questionId } = game.activeQuestion;
  return set(code, {
    categories: game.categories.map((c) =>
      c.id === categoryId
        ? { ...c, questions: c.questions.map((q) => q.id === questionId ? { ...q, answered: true } : q) }
        : c
    ),
  });
}

export function updateGameContent(code: string, title: string, categories: Category[]): GameState | null {
  return set(code, { title, categories });
}

export function resetGame(code: string): GameState | null {
  const game = games.get(code);
  if (!game) return null;
  const resetPlayers = game.players.map((p, i) => ({
    ...p,
    id: p.id.startsWith('preset-') ? p.id : `preset-${i}`,
    score: 0,
  }));
  return set(code, {
    phase: 'board',
    players: resetPlayers,
    activeQuestion: null,
    buzzedPlayerId: null,
    categories: game.categories.map((c) => ({
      ...c,
      questions: c.questions.map((q) => ({ ...q, answered: false })),
    })),
  });
}
