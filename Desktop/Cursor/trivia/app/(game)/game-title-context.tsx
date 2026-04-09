'use client';
import { createContext, useContext, useState } from 'react';

type Ctx = { title: string; setTitle: (t: string) => void };
const GameTitleContext = createContext<Ctx>({ title: '', setTitle: () => {} });

export function GameTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState('');
  return <GameTitleContext.Provider value={{ title, setTitle }}>{children}</GameTitleContext.Provider>;
}

export const useGameTitle = () => useContext(GameTitleContext);
