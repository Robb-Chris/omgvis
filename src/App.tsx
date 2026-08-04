import React, { useEffect, useRef } from 'react';
import { useStore } from './store/useStore';
import { Viewport } from './components/Viewport';
import { Controls } from './components/Controls';
import { Inspector } from './components/Inspector';
import { Tutorial } from './components/Tutorial';

import SieveWorkerScript from './engine/SieveWorker.ts?worker';

export const App: React.FC = () => {
  const maxN = useStore((state) => state.maxN);
  const setOmegaData = useStore((state) => state.setOmegaData);
  const setIsComputing = useStore((state) => state.setIsComputing);
  const isTutorialActive = useStore((state) => state.isTutorialActive);
  const tutorialStep = useStore((state) => state.tutorialStep);

  const workerRef = useRef<Worker | null>(null);

  // Initial intro animation: smooth ease-in-out increase from N=100 to N=500
  useEffect(() => {
    if (isTutorialActive && tutorialStep !== 0) return;

    let frameId: number | null = null;
    const startTime = performance.now();
    const startN = 100;
    const targetN = 500;
    const duration = 7500; // 7.5 seconds

    const animateN = (now: number) => {
      if (useStore.getState().isTutorialActive && useStore.getState().tutorialStep !== 0) {
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Dual-phase easing: smooth early acceleration, long feather-soft exponential deceleration tail
      let easeProgress = 0;
      if (progress < 0.35) {
        const p = progress / 0.35;
        easeProgress = 0.2 * p * p;
      } else {
        const p = (progress - 0.35) / 0.65;
        easeProgress = 0.2 + 0.8 * (1 - Math.pow(1 - p, 4));
      }

      const currentN = Math.round(startN + (targetN - startN) * easeProgress);
      useStore.getState().setMaxN(currentN);

      if (progress < 1) {
        frameId = requestAnimationFrame(animateN);
      }
    };

    frameId = requestAnimationFrame(animateN);

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [isTutorialActive, tutorialStep]);

  // Step 2/5 Tutorial Animation: smooth increase from N=500 to N=2000 on Sacks Primes Spiral
  useEffect(() => {
    if (!isTutorialActive || tutorialStep !== 1) return;

    let frameId: number | null = null;
    const startTime = performance.now();
    const startN = 500;
    const targetN = 2000;
    const duration = 4500; // 4.5 seconds

    const animateStep2 = (now: number) => {
      if (!useStore.getState().isTutorialActive || useStore.getState().tutorialStep !== 1) {
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Smootherstep 5th order polynomial
      const easeProgress =
        progress * progress * progress * (progress * (progress * 6 - 15) + 10);

      const currentN = Math.round(startN + (targetN - startN) * easeProgress);
      useStore.getState().setMaxN(currentN);

      if (progress < 1) {
        frameId = requestAnimationFrame(animateStep2);
      }
    };

    frameId = requestAnimationFrame(animateStep2);

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [isTutorialActive, tutorialStep]);

  // Step 5/5 Tutorial Animation:
  // Phase 1 (0 to 3.5s): N=100 -> 500 on Sacks Rounded Spiral
  // Phase 2 (3.5s to 7.5s): Switch to Ulam Square Grid, N=500 -> 1000
  useEffect(() => {
    if (!isTutorialActive || tutorialStep !== 4) return;

    let frameId: number | null = null;
    const startTime = performance.now();
    const phase1Duration = 3500; // 3.5s
    const phase2Duration = 4000; // 4.0s
    const totalDuration = phase1Duration + phase2Duration;

    // Initialize Phase 1 at N=100 on Sacks spiral
    useStore.getState().setMaxN(100);
    useStore.getState().setLayoutType('sacks');

    const animateStep5 = (now: number) => {
      if (!useStore.getState().isTutorialActive || useStore.getState().tutorialStep !== 4) {
        return;
      }

      const elapsed = now - startTime;

      if (elapsed <= phase1Duration) {
        // Phase 1: N=100 to 500 on Sacks Rounded Spiral
        const progress = Math.min(1, elapsed / phase1Duration);
        const easeProgress = progress * progress * (3 - 2 * progress);
        const currentN = Math.round(100 + (500 - 100) * easeProgress);

        if (useStore.getState().layoutType !== 'sacks') {
          useStore.getState().setLayoutType('sacks');
        }
        useStore.getState().setMaxN(currentN);
      } else {
        // Phase 2: Switch to Ulam Square Grid, N=500 to 1000
        const progress = Math.min(1, (elapsed - phase1Duration) / phase2Duration);
        const easeProgress = progress * progress * (3 - 2 * progress);
        const currentN = Math.round(500 + (1000 - 500) * easeProgress);

        if (useStore.getState().layoutType !== 'ulam') {
          useStore.getState().setLayoutType('ulam');
        }
        useStore.getState().setMaxN(currentN);
      }

      if (elapsed < totalDuration) {
        frameId = requestAnimationFrame(animateStep5);
      }
    };

    frameId = requestAnimationFrame(animateStep5);

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [isTutorialActive, tutorialStep]);

  // Web Worker lifecycle for high N > 10,000
  useEffect(() => {
    if (maxN <= 10000) return; // N <= 10,000 is computed synchronously in memory for zero-lag 60fps animations!

    setIsComputing(true);
    const worker = new SieveWorkerScript();
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const { type, omega, elapsedMs } = e.data;
      if (type === 'result') {
        const omegaArray = new Uint8Array(omega);
        setOmegaData(omegaArray, elapsedMs);
      }
    };

    worker.postMessage({ maxN });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [maxN, setOmegaData, setIsComputing]);

  return (
    <div
      className="fade-in-container"
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}
    >
      <Viewport />
      <Controls />
      <Inspector />
      <Tutorial />
    </div>
  );
};
