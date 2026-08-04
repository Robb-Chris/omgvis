import React, { useId, useEffect, useRef } from 'react';
import { useStore, DisplayMode, LayoutType } from '../store/useStore';
import { erdosKacParams, gaussianPDF } from '../engine/MathEngine';
import { Sun, Moon, Activity, Cpu, Layers, Info, Filter, X, HelpCircle } from 'lucide-react';

export const Controls: React.FC = () => {
  const maxNSliderId = useId();
  const showGaussianId = useId();
  const showHistogramId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const maxN = useStore((state) => state.maxN);
  const setMaxN = useStore((state) => state.setMaxN);
  const omegaData = useStore((state) => state.omegaData);
  const displayMode = useStore((state) => state.displayMode);
  const setDisplayMode = useStore((state) => state.setDisplayMode);
  const layoutType = useStore((state) => state.layoutType);
  const setLayoutType = useStore((state) => state.setLayoutType);
  const selectedDepth = useStore((state) => state.selectedDepth);
  const setSelectedDepth = useStore((state) => state.setSelectedDepth);
  const isTutorialActive = useStore((state) => state.isTutorialActive);
  const tutorialStep = useStore((state) => state.tutorialStep);

  const isComputing = useStore((state) => state.isComputing);
  const computeElapsedMs = useStore((state) => state.computeElapsedMs);

  const showGaussian = useStore((state) => state.showGaussian);
  const toggleGaussian = useStore((state) => state.toggleGaussian);
  const showHistogram = useStore((state) => state.showHistogram);
  const toggleHistogram = useStore((state) => state.toggleHistogram);

  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const startTutorial = useStore((state) => state.startTutorial);

  // Convert slider (0 - 100) to logarithmic scale (100 to 5,000,000)
  const minLog = Math.log10(100);
  const maxLog = Math.log10(5000000);

  const sliderValue = Math.round(
    ((Math.log10(Math.max(100, maxN)) - minLog) / (maxLog - minLog)) * 100
  );

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const logVal = minLog + (val / 100) * (maxLog - minLog);
    const n = Math.round(Math.pow(10, logVal));
    setMaxN(n);
  };

  // Click handler on histogram canvas to spotlight depth bar
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const width = 316;
    const margin = { top: 20, right: 15, bottom: 28, left: 30 };
    const maxDepth = 11;
    const chartW = width - margin.left - margin.right;
    const barWidth = chartW / maxDepth;

    if (x >= margin.left && x <= width - margin.right) {
      const depth = Math.floor((x - margin.left) / barWidth);
      if (depth >= 0 && depth < maxDepth) {
        if (selectedDepth === depth) {
          setSelectedDepth(null);
        } else {
          setSelectedDepth(depth);
        }
      }
    }
  };

  // Render Erdős–Kac Gaussian Chart inside left panel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 316;
    const height = 160;
    const dpr = Math.min(window.devicePixelRatio, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    if (!showHistogram && !showGaussian) return;
    if (!omegaData || maxN <= 0) return;

    // Calculate frequencies
    const maxDepth = 11;
    const counts = new Array(maxDepth).fill(0);
    let totalCount = 0;

    const limit = Math.min(maxN, omegaData.length - 1);
    for (let i = 1; i <= limit; i++) {
      const w = omegaData[i];
      if (w < maxDepth) {
        counts[w]++;
        totalCount++;
      }
    }

    if (totalCount === 0) return;

    const freq = counts.map((c) => c / totalCount);
    const maxFreq = Math.max(...freq, 0.08);

    const margin = { top: 20, right: 15, bottom: 28, left: 30 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const getBarColor = (depth: number) => {
      if (theme === 'light') {
        switch (depth) {
          case 0:
            return '#0F172A';
          case 1:
            return '#0284C7';
          case 2:
            return '#059669';
          case 3:
            return '#D97706';
          case 4:
            return '#E11D48';
          default:
            return '#7C3AED';
        }
      }
      switch (depth) {
        case 0:
          return '#F8FAFC';
        case 1:
          return '#38BDF8';
        case 2:
          return '#34D399';
        case 3:
          return '#FBBF24';
        case 4:
          return '#FB7185';
        default:
          return '#C084FC';
      }
    };

    const isStep3BellFocus = isTutorialActive && tutorialStep === 2;

    // Draw Histogram Bars
    if (showHistogram) {
      const barWidth = chartW / maxDepth;
      for (let d = 0; d < maxDepth; d++) {
        const barH = (freq[d] / maxFreq) * chartH;
        const x = margin.left + d * barWidth;
        const y = margin.top + (chartH - barH);

        const isSpotlight = selectedDepth === d;
        const isDimmed = selectedDepth !== null && !isSpotlight;

        const col = getBarColor(d);
        // Dim bars down on Step 3 of tutorial (opacity ~13%) so the Bell Curve is crystal clear!
        ctx.fillStyle = isStep3BellFocus
          ? (theme === 'light' ? 'rgba(203, 213, 225, 0.35)' : 'rgba(30, 41, 59, 0.45)')
          : isDimmed
          ? (theme === 'light' ? '#CBD5E1' : '#334155')
          : col;
        ctx.beginPath();
        ctx.roundRect(x + 2, y, barWidth - 4, barH, [3, 3, 0, 0]);
        ctx.fill();

        if (isSpotlight) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.fillStyle = isSpotlight ? '#38BDF8' : theme === 'dark' ? '#a0a4ad' : '#444746';
        ctx.font = isSpotlight ? '700 11px Outfit, sans-serif' : '500 10px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Ω=${d}`, x + barWidth / 2, height - margin.bottom + 14);
      }
    }

    // Draw Erdős–Kac Gaussian Curve
    if (showGaussian) {
      const { mu, sigma } = erdosKacParams(maxN);

      // Area fill
      const areaGrad = ctx.createLinearGradient(0, margin.top, 0, margin.top + chartH);
      areaGrad.addColorStop(0, theme === 'light' ? 'rgba(2, 132, 199, 0.22)' : 'rgba(56, 189, 248, 0.25)');
      areaGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

      ctx.fillStyle = areaGrad;
      ctx.beginPath();

      const steps = 80;
      for (let i = 0; i <= steps; i++) {
        const d = (i / steps) * (maxDepth - 1);
        const pdfVal = gaussianPDF(d, mu, sigma);
        const x = margin.left + (d / (maxDepth - 1)) * chartW;
        const y = margin.top + chartH - (pdfVal / maxFreq) * chartH;

        if (i === 0) {
          ctx.moveTo(x, margin.top + chartH);
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.lineTo(margin.left + chartW, margin.top + chartH);
      ctx.closePath();
      ctx.fill();

      // Dashed Line
      ctx.beginPath();
      ctx.strokeStyle = theme === 'light' ? '#0284C7' : '#38BDF8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);

      for (let i = 0; i <= steps; i++) {
        const d = (i / steps) * (maxDepth - 1);
        const pdfVal = gaussianPDF(d, mu, sigma);
        const x = margin.left + (d / (maxDepth - 1)) * chartW;
        const y = margin.top + chartH - (pdfVal / maxFreq) * chartH;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Mean mu pin
      const muX = margin.left + (mu / (maxDepth - 1)) * chartW;
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(muX, margin.top);
      ctx.lineTo(muX, margin.top + chartH);
      ctx.stroke();

      ctx.fillStyle = '#FBBF24';
      ctx.font = '600 9px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`μ ≈ ${mu.toFixed(2)}`, muX, margin.top - 4);
    }
  }, [maxN, omegaData, showHistogram, showGaussian, theme, selectedDepth, isTutorialActive, tutorialStep]);

  const { mu, sigma } = erdosKacParams(maxN);

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        top: 24,
        left: 24,
        zIndex: 10,
        width: 360,
        maxHeight: 'calc(100vh - 48px)',
        overflowY: 'auto',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={18} style={{ color: 'var(--accent)' }} />
            <h1 style={{ fontSize: '1.4rem', color: 'var(--text)', margin: 0 }}>omgvis</h1>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginTop: 2 }}>
            Space Network & Erdős–Kac Theorem
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={startTutorial}
            className="btn-pill"
            title="Start Interactive Educational Tour"
            style={{ padding: '6px 10px' }}
          >
            <HelpCircle size={15} />
          </button>

          <button
            onClick={toggleTheme}
            className="btn-pill"
            title="Toggle Light/Dark Theme"
            style={{ padding: '6px 10px' }}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>

      {/* 2. Logarithmic Range Slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 8 }}>
          <label htmlFor={maxNSliderId} style={{ color: 'var(--text-2)', cursor: 'pointer' }}>Upper Bound N</label>
          <span style={{ fontFamily: 'Outfit', fontWeight: 600, color: 'var(--accent)', fontSize: '0.95rem' }}>
            {maxN.toLocaleString()}
          </span>
        </div>
        <input
          id={maxNSliderId}
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={sliderValue}
          onChange={handleSliderChange}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 4 }}>
          <span>100</span>
          <span>100K</span>
          <span>5M</span>
        </div>
      </div>

      {/* 3. Graph Layout Selector Dropdown */}
      <div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginBottom: 6 }}>
          Graph Layout
        </div>
        <select
          value={layoutType}
          onChange={(e) => setLayoutType(e.target.value as LayoutType)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--surface-hover)',
            color: 'var(--text)',
            fontSize: '0.85rem',
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="shells">Erdős–Kac Depth Shells (Concentric Rings)</option>
          <option value="sacks">Sacks Polar Spiral (Rounded Galaxy)</option>
          <option value="ulam">Classic Ulam Square Grid Spiral</option>
        </select>
      </div>

      {/* 4. Duality Filter Mode Toggle Pills & Depth Spotlight Pill */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>
            Duality Filter
          </div>
          {selectedDepth !== null && (
            <button
              onClick={() => setSelectedDepth(null)}
              className="btn-pill"
              title="Clear Depth Spotlight Filter"
              style={{
                fontSize: '0.72rem',
                padding: '2px 6px',
                background: 'var(--accent-glow)',
                color: 'var(--accent)',
                borderColor: 'var(--accent)',
              }}
            >
              <Filter size={11} />
              Spotlight: Ω={selectedDepth}
              <X size={11} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['combined', 'primes', 'composites'] as DisplayMode[]).map((mode) => (
            <button
              key={mode}
              className={`btn-pill ${displayMode === mode ? 'active' : ''}`}
              onClick={() => setDisplayMode(mode)}
              style={{ flex: 1, justifyContent: 'center', textTransform: 'capitalize', padding: '6px 0' }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Integrated Erdős–Kac Gaussian Overlay Section */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={16} style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontSize: '0.9rem', margin: 0, color: 'var(--text)' }}>
              Erdős–Kac Distribution
            </h3>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <label
              htmlFor={showGaussianId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.75rem',
                color: showGaussian ? 'var(--text)' : 'var(--text-3)',
                cursor: 'pointer',
              }}
            >
              <input
                id={showGaussianId}
                type="checkbox"
                checked={showGaussian}
                onChange={toggleGaussian}
                style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              Bell
            </label>

            <label
              htmlFor={showHistogramId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.75rem',
                color: showHistogram ? 'var(--text)' : 'var(--text-3)',
                cursor: 'pointer',
              }}
            >
              <input
                id={showHistogramId}
                type="checkbox"
                checked={showHistogram}
                onChange={toggleHistogram}
                style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              Bars
            </label>
          </div>
        </div>

        {/* Live Parameters */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '5px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-hover)',
            fontSize: '0.75rem',
            color: 'var(--text-2)',
          }}
        >
          <span>
            μ = ln(ln N) ≈ <strong style={{ color: '#FBBF24' }}>{mu.toFixed(2)}</strong>
          </span>
          <span>
            σ = √(ln(ln N)) ≈ <strong style={{ color: '#38BDF8' }}>{sigma.toFixed(2)}</strong>
          </span>
        </div>

        {/* Chart Canvas with Interactive Bar Click */}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          title="Click any depth bar (Ω=0..10) to spotlight that prime factor depth on the graph!"
          style={{ width: 316, height: 160, display: 'block', cursor: 'pointer' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--text-3)' }}>
          <Info size={12} />
          <span>Click any bar to spotlight Ω depth on the graph!</span>
        </div>
      </div>

      {/* 6. Compute Status Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.75rem',
          color: 'var(--text-3)',
          paddingTop: 10,
          borderTop: '1px solid var(--border)',
        }}
      >
        <Cpu size={13} style={{ color: isComputing ? 'var(--accent)' : 'var(--text-3)' }} />
        {isComputing ? (
          <span>Computing Additive Sieve...</span>
        ) : (
          <span>Sieve execution: {computeElapsedMs.toFixed(1)}ms</span>
        )}
      </div>
    </div>
  );
};
