'use client';

import { createContext, useContext } from 'react';
import { Socket } from 'socket.io-client';

export interface LayoutContextType {
  user: any;
  token: string;
  logout: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  socket: Socket | null;
  unreadNotifications: number;
  setUnreadNotifications: React.Dispatch<React.SetStateAction<number>>;
  syncLogs: string[];
  addLog: (message: string) => void;
}

export const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout debe usarse dentro de un LayoutProvider');
  }
  return context;
}
