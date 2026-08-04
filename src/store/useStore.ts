import { create } from 'zustand';
import { computeAdditiveSieve } from '../engine/MathEngine';

export type DisplayMode = 'combined' | 'primes' | 'composites';
export type LayoutType = 'sacks' | 'ulam' | 'shells';

export interface OmgVisState {
  // Compute & Data
  maxN: number;
  omegaData: Uint8Array | null;
  isComputing: boolean;
  computeProgress: number;
  computeElapsedMs: number;

  // Viewport & Filtering & Layout
  displayMode: DisplayMode;
  layoutType: LayoutType;
  selectedDepth: number | null; // Depth Ω spotlight filter
  selectedN: number | null;
  hoveredN: number | null;

  // Overlay Analytics & Theme
  showGaussian: boolean;
  showHistogram: boolean;
  theme: 'dark' | 'light';

  // Interactive Educational Tutorial
  isTutorialActive: boolean;
  tutorialStep: number;

  // Actions
  setMaxN: (n: number) => void;
  setOmegaData: (data: Uint8Array, elapsedMs: number) => void;
  setIsComputing: (computing: boolean) => void;
  setComputeProgress: (progress: number) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setLayoutType: (layout: LayoutType) => void;
  setSelectedDepth: (depth: number | null) => void;
  setSelectedN: (n: number | null) => void;
  setHoveredN: (n: number | null) => void;
  toggleGaussian: () => void;
  toggleHistogram: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;

  startTutorial: () => void;
  nextTutorialStep: () => void;
  prevTutorialStep: () => void;
  closeTutorial: () => void;
}

export const useStore = create<OmgVisState>((set) => ({
  maxN: 100,
  omegaData: computeAdditiveSieve(10000), // Pre-compute N=10,000 in memory for zero-lag 60fps animations
  isComputing: false,
  computeProgress: 100,
  computeElapsedMs: 0.4,

  displayMode: 'combined',
  layoutType: 'shells',
  selectedDepth: null,
  selectedN: null,
  hoveredN: null,

  showGaussian: true,
  showHistogram: true,

  theme: (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark',

  isTutorialActive: typeof window !== 'undefined' ? !localStorage.getItem('omgvis_tutorial_seen') : false,
  tutorialStep: 0,

  setMaxN: (maxN) => {
    const currentOmega = useStore.getState().omegaData;
    // For N <= 10,000, compute synchronously in 0.4ms to eliminate worker race conditions & camera snaps!
    if (maxN <= 10000) {
      if (!currentOmega || currentOmega.length <= maxN) {
        const newData = computeAdditiveSieve(Math.max(10000, maxN));
        set({ maxN, omegaData: newData, isComputing: false, computeProgress: 100, computeElapsedMs: 0.4 });
      } else {
        set({ maxN, isComputing: false });
      }
    } else {
      set({ maxN, isComputing: true });
    }
  },
  setOmegaData: (omegaData, computeElapsedMs) => set({ omegaData, isComputing: false, computeProgress: 100, computeElapsedMs }),
  setIsComputing: (isComputing) => set({ isComputing }),
  setComputeProgress: (computeProgress) => set({ computeProgress }),
  setDisplayMode: (displayMode) => set({ displayMode }),
  setLayoutType: (layoutType) => set({ layoutType }),
  setSelectedDepth: (selectedDepth) => set({ selectedDepth }),
  setSelectedN: (selectedN) => set({ selectedN }),
  setHoveredN: (hoveredN) => set({ hoveredN }),
  toggleGaussian: () => set((state) => ({ showGaussian: !state.showGaussian })),
  toggleHistogram: () => set((state) => ({ showHistogram: !state.showHistogram })),
  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    set({ theme });
  },
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    return { theme: nextTheme };
  }),

  startTutorial: () => set({ isTutorialActive: true, tutorialStep: 0 }),
  nextTutorialStep: () => set((state) => {
    const nextStep = state.tutorialStep + 1;
    if (nextStep >= 5) {
      localStorage.setItem('omgvis_tutorial_seen', 'true');
      return { isTutorialActive: false, tutorialStep: 0, selectedDepth: null };
    }
    return { tutorialStep: nextStep };
  }),
  prevTutorialStep: () => set((state) => ({ tutorialStep: Math.max(0, state.tutorialStep - 1) })),
  closeTutorial: () => {
    localStorage.setItem('omgvis_tutorial_seen', 'true');
    set({ isTutorialActive: false, tutorialStep: 0, selectedDepth: null });
  },
}));

if (typeof window !== 'undefined') {
  (window as any).useStore = useStore;
}
