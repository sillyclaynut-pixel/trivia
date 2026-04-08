import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import {
  createGame,
  getGame,
  addPlayer,
  removePlayer,
  buzz,
  judgeAnswer,
  selectQuestion,
  dismissQuestion,
  markActiveQuestionAnswered,
  updateGameContent,
  resetGame,
  renameTeam,
} from './lib/gameStore';
import { Category } from './types/game';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: '*' },
    maxHttpBufferSize: 1e8,
  });

  // Track which game each socket belongs to
  const socketToCode = new Map<string, string>();

  io.on('connection', (socket) => {

    // ── Create a new game ─────────────────────────────────────
    socket.on('create_game', () => {
      const game = createGame();
      socketToCode.set(socket.id, game.code);
      socket.join(game.code);
      socket.emit('game_created', { code: game.code, gameState: game });
    });

    // ── Host connects to existing game ────────────────────────
    socket.on('host_connect', ({ code }: { code: string }) => {
      const game = getGame(code);
      if (!game) return socket.emit('game_error', 'Game not found');
      socketToCode.set(socket.id, code);
      socket.join(code);
      socket.emit('game_state', game);
    });

    // ── Player joins game ─────────────────────────────────────
    socket.on('join_game', ({ code, teamName }: { code: string; teamName: string }) => {
      const updated = addPlayer(code, socket.id, teamName);
      if (!updated) return socket.emit('game_error', 'Game not found');
      socketToCode.set(socket.id, code);
      socket.join(code);
      io.to(code).emit('game_state', updated);
      socket.emit('joined', { code });
    });

    // ── Host selects a question ───────────────────────────────
    socket.on('host_select_question', ({ code, categoryId, questionId }: { code: string; categoryId: string; questionId: string }) => {
      const updated = selectQuestion(code, categoryId, questionId);
      if (updated) io.to(code).emit('game_state', updated);
    });

    // ── Host dismisses question ───────────────────────────────
    socket.on('host_dismiss_question', ({ code }: { code: string }) => {
      const updated = dismissQuestion(code);
      if (updated) io.to(code).emit('game_state', updated);
    });

    // ── Host marks active question answered ───────────────────
    socket.on('host_mark_answered', ({ code }: { code: string }) => {
      const updated = markActiveQuestionAnswered(code);
      if (updated) io.to(code).emit('game_state', updated);
    });

    // ── Host judges answer ────────────────────────────────────
    socket.on('host_judge', ({ code, correct, playerId }: { code: string; correct: boolean; playerId: string }) => {
      const updated = judgeAnswer(code, correct, playerId);
      if (updated) io.to(code).emit('game_state', updated);
    });

    // ── Player buzzes ─────────────────────────────────────────
    socket.on('buzz', () => {
      const code = socketToCode.get(socket.id);
      if (!code) return;
      const updated = buzz(code, socket.id);
      if (updated) io.to(code).emit('game_state', updated);
    });

    // ── Host saves game content ───────────────────────────────
    socket.on('host_save_game', ({ code, title, categories }: { code: string; title: string; categories: Category[] }) => {
      const updated = updateGameContent(code, title, categories);
      if (updated) io.to(code).emit('game_state', updated);
    });

    // ── Host renames a team ───────────────────────────────────
    socket.on('host_rename_team', ({ code, playerId, teamName }: { code: string; playerId: string; teamName: string }) => {
      const updated = renameTeam(code, playerId, teamName);
      if (updated) io.to(code).emit('game_state', updated);
    });

    // ── Host resets game ──────────────────────────────────────
    socket.on('host_reset_game', ({ code }: { code: string }) => {
      const updated = resetGame(code);
      if (updated) io.to(code).emit('game_state', updated);
    });

    // ── Disconnect ────────────────────────────────────────────
    socket.on('disconnect', () => {
      const code = socketToCode.get(socket.id);
      if (!code) return;
      const game = getGame(code);
      if (game?.players.some((p) => p.id === socket.id)) {
        const updated = removePlayer(code, socket.id);
        if (updated) io.to(code).emit('game_state', updated);
      }
      socketToCode.delete(socket.id);
    });
  });

  const port = parseInt(process.env.PORT ?? '3000', 10);
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
