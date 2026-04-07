'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '@/types/game';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io({ path: '/socket.io' });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('game_state', (state: GameState) => setGameState(state));

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = (event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  };

  return { gameState, connected, emit, socket: socketRef.current };
}
