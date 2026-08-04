import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ChevronRight, ChevronLeft, X, Sparkles, Compass, BarChart2, Orbit, Layers } from 'lucide-react';

export const Tutorial: React.FC = () => {
  const isTutorialActive = useStore((state) => state.isTutorialActive);
  const tutorialStep = useStore((state) => state.tutorialStep);
  const nextTutorialStep = useStore((state) => state.nextTutorialStep);
  const prevTutorialStep = useStore((state) => state.prevTutorialStep);
  const closeTutorial = useStore((state) => state.closeTutorial);

  const setMaxN = useStore((state) => state.setMaxN);
  const setDisplayMode = useStore((state) => state.setDisplayMode);
  const setLayoutType = useStore((state) => state.setLayoutType);
  const setSelectedDepth = useStore((state) => state.setSelectedDepth);

  // Synchronize UI & graph state per tutorial step
  useEffect(() => {
    if (!isTutorialActive) return;

    switch (tutorialStep) {
      case 0:
        setMaxN(100);
        setDisplayMode('combined');
        setLayoutType('shells');
        setSelectedDepth(null);
        break;
      case 1:
        // Step 1: Primes Only on Sacks Polar Spiral to show curving prime highways
        setMaxN(500);
        setDisplayMode('primes');
        setLayoutType('sacks');
        setSelectedDepth(null);
        break;
      case 2:
        // Step 2: Scale up to N = 5,000,000 to demonstrate full Erdős-Kac Bell Curve!
        setMaxN(5000000);
        setDisplayMode('combined');
        setLayoutType('shells');
        setSelectedDepth(null);
        break;
      case 3:
        // Step 3: Interactive Spotlight on Primes (Ω=1) at N = 500
        setMaxN(500);
        setDisplayMode('combined');
        setLayoutType('shells');
        setSelectedDepth(1);
        break;
      case 4:
        // Step 5: Multi-phase animation managed by App.tsx (Sacks N=100->500 then Ulam N=500->1000)
        setDisplayMode('combined');
        setSelectedDepth(null);
        break;
    }
  }, [isTutorialActive, tutorialStep, setMaxN, setDisplayMode, setLayoutType, setSelectedDepth]);

  if (!isTutorialActive) return null;

  const steps = [
    {
      title: 'Numbers Have Building Blocks',
      icon: <Sparkles size={20} style={{ color: '#38BDF8' }} />,
      tag: 'Step 1 of 5',
      topOffset: 24,
      paragraphs: [
        <span key="p1">
          <strong>Prime numbers</strong> like 2, 3, 5, and 7 are pure building blocks that cannot be divided further.
        </span>,
        <span key="p2">
          <strong>Composite numbers</strong> are made by multiplying primes together, like 15 (which is 3 x 5). The count of prime factors in a number is its <strong>Prime Depth</strong>.
        </span>,
      ],
    },
    {
      title: 'Hidden Spiral Highways',
      icon: <Compass size={20} style={{ color: '#34D399' }} />,
      tag: 'Step 2 of 5',
      topOffset: 240,
      paragraphs: [
        <span key="p1">
          <strong>Prime numbers</strong> can feel unpredictable, but when you plot them along a <strong>continuous spiral</strong>, curving pathways of primes appear.
        </span>,
        <span key="p2">
          The cyan nodes shown here are <strong>pure primes</strong> forming natural spiral arms in space.
        </span>,
      ],
    },
    {
      title: 'The Gaussian Bell Curve',
      icon: <BarChart2 size={20} style={{ color: '#FBBF24' }} />,
      tag: 'Step 3 of 5',
      topOffset: 340,
      paragraphs: [
        <span key="p1">
          Here is something fascinating from the <strong>Erdős–Kac Theorem</strong>. Even though prime factors seem random, when you look at millions of numbers together, their prime factor depths shape a smooth, predictable <strong>Bell Curve</strong>.
        </span>,
        <span key="p2">
          We scaled N up to <strong>5 Million</strong> here so you can see the curve form.
        </span>,
      ],
    },
    {
      title: 'Spotlight a Specific Depth',
      icon: <Orbit size={20} style={{ color: '#FB7185' }} />,
      tag: 'Step 4 of 5',
      topOffset: 410,
      paragraphs: [
        <span key="p1">
          You can click any bar on the <strong>distribution chart</strong> to highlight numbers with 1, 2, 3, or more prime factors while <strong>dimming out</strong> the rest of the network.
        </span>,
      ],
    },
    {
      title: 'Different Layout Lenses',
      icon: <Layers size={20} style={{ color: '#C084FC' }} />,
      tag: 'Step 5 of 5',
      topOffset: 160,
      paragraphs: [
        <span key="p1">
          You can view these patterns through 3 geometric shapes: <strong>Concentric Rings</strong>, a <strong>Galaxy Spiral</strong>, or a <strong>Square Grid</strong>.
        </span>,
        <span key="p2">
          Use the <strong>Graph Layout</strong> dropdown anytime to switch your view.
        </span>,
      ],
    },
  ];

  const current = steps[tutorialStep];

  return (
    <>
      {/* Dimmed Focus Backdrop Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 40,
          background: 'rgba(2, 2, 6, 0.35)',
          pointerEvents: 'none',
          transition: 'all 0.4s ease',
        }}
      />

      {/* Top-Left Floating Tutorial Card */}
      <div
        style={{
          position: 'absolute',
          top: current.topOffset,
          left: 400,
          zIndex: 50,
          width: 380,
          padding: '20px 22px',
          borderRadius: 'var(--radius-lg)',
          transition: 'top 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.25)',
        }}
        className="glass-panel"
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {current.icon}
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {current.tag}
            </span>
          </div>

          <button
            onClick={closeTutorial}
            className="btn-pill"
            title="Close Tutorial"
            style={{ padding: 4, borderRadius: '50%' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Step Title */}
        <h2 style={{ fontSize: '1.1rem', color: 'var(--text)', marginBottom: 10, fontWeight: 700 }}>
          {current.title}
        </h2>

        {/* Paragraphs with Bold Emphasis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {current.paragraphs.map((p, idx) => (
            <p key={idx} style={{ fontSize: '0.84rem', color: 'var(--text-2)', lineHeight: 1.55 }}>
              {p}
            </p>
          ))}
        </div>

        {/* Bottom Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          {/* Step Indicator Dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {steps.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: idx === tutorialStep ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: idx === tutorialStep ? 'var(--accent)' : 'var(--border)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {tutorialStep > 0 && (
              <button
                onClick={prevTutorialStep}
                className="btn-pill"
                style={{ padding: '6px 12px' }}
              >
                <ChevronLeft size={15} />
                Back
              </button>
            )}

            <button
              onClick={nextTutorialStep}
              className="btn-pill active"
              style={{ padding: '6px 14px' }}
            >
              {tutorialStep === steps.length - 1 ? 'Got it!' : 'Next'}
              {tutorialStep < steps.length - 1 && <ChevronRight size={15} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
