import { create } from 'zustand'

interface UIState {
  isSidebarOpen: boolean;
  isAuthModalOpen: boolean;
  isPlaylistModalOpen: boolean;
  authModalTab: 'signin' | 'signup';
  
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  openAuthModal: (tab?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  setAuthModalTab: (tab: 'signin' | 'signup') => void;
  setPlaylistModalOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  isAuthModalOpen: false,
  isPlaylistModalOpen: false,
  authModalTab: 'signin',

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
  openAuthModal: (tab = 'signin') => set({ isAuthModalOpen: true, authModalTab: tab }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  setAuthModalTab: (tab) => set({ authModalTab: tab }),
  setPlaylistModalOpen: (isOpen) => set({ isPlaylistModalOpen: isOpen }),
}))
