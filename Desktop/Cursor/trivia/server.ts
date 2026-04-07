import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import {
  getGame,
  addPlayer,
  removePlayer,
  buzz,
  judgeAnswer,
  selectQuestion,
  dismissQuestion,
  markActiveQuestionAnswered,
  startGame,
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
    maxHttpBufferSize: 1e8, // 100 MB — needed for base64 image payloads
  });

  io.on('connection', (socket) => {
    // ── Player joins the game ──────────────────────────────────
    socket.on('join_game', ({ teamName }: { teamName: string }) => {
      const updated = addPlayer(socket.id, teamName);
      socket.join('game');
      io.to('game').emit('game_state', updated);
    });

    // ── Host connects ──────────────────────────────────────────
    socket.on('host_connect', () => {
      socket.join('game');
      socket.emit('game_state', getGame());
    });

    // ── Host starts game ───────────────────────────────────────
    socket.on('host_start', () => {
      io.to('game').emit('game_state', startGame());
    });

    // ── Host selects a question ────────────────────────────────
    socket.on('host_select_question', ({ categoryId, questionId }: { categoryId: string; questionId: string }) => {
      io.to('game').emit('game_state', selectQuestion(categoryId, questionId));
    });

    // ── Host dismisses question ────────────────────────────────
    socket.on('host_dismiss_question', () => {
      io.to('game').emit('game_state', dismissQuestion());
    });

    // ── Host marks active question answered (answer revealed) ──
    socket.on('host_mark_answered', () => {
      io.to('game').emit('game_state', markActiveQuestionAnswered());
    });

    // ── Host judges answer ─────────────────────────────────────
    socket.on('host_judge', ({ correct, playerId }: { correct: boolean; playerId: string }) => {
      io.to('game').emit('game_state', judgeAnswer(correct, playerId));
    });

    // ── Player buzzes ──────────────────────────────────────────
    socket.on('buzz', () => {
      const updated = buzz(socket.id);
      if (updated) io.to('game').emit('game_state', updated);
    });

    // ── Host saves game content ────────────────────────────────
    socket.on('host_save_game', ({ title, categories }: { title: string; categories: Category[] }) => {
      io.to('game').emit('game_state', updateGameContent(title, categories));
    });

    // ── Host renames a team ────────────────────────────────────
    socket.on('host_rename_team', ({ playerId, teamName }: { playerId: string; teamName: string }) => {
      io.to('game').emit('game_state', renameTeam(playerId, teamName));
    });

    // ── Host resets game ───────────────────────────────────────
    socket.on('host_reset_game', () => {
      io.to('game').emit('game_state', resetGame());
    });

    // ── Disconnect ─────────────────────────────────────────────
    socket.on('disconnect', () => {
      const before = getGame();
      const wasPlayer = before.players.some((p) => p.id === socket.id);
      if (wasPlayer) {
        io.to('game').emit('game_state', removePlayer(socket.id));
      }
    });
  });

  const port = parseInt(process.env.PORT ?? '3000', 10);
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
