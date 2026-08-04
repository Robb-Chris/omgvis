import React, { useEffect, useRef } from 'react';
import { RenderPipeline } from '../engine/RenderPipeline';
import { useStore } from '../store/useStore';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export const Viewport: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pipelineRef = useRef<RenderPipeline | null>(null);

  const maxN = useStore((state) => state.maxN);
  const omegaData = useStore((state) => state.omegaData);
  const displayMode = useStore((state) => state.displayMode);
  const layoutType = useStore((state) => state.layoutType);
  const selectedDepth = useStore((state) => state.selectedDepth);
  const theme = useStore((state) => state.theme);
  const setSelectedN = useStore((state) => state.setSelectedN);
  const setHoveredN = useStore((state) => state.setHoveredN);

  // Initialize pipeline
  useEffect(() => {
    if (!containerRef.current) return;

    const pipeline = new RenderPipeline(containerRef.current);
    pipeline.setCallbacks(
      (n) => setSelectedN(n),
      (n) => setHoveredN(n)
    );
    pipelineRef.current = pipeline;

    const handleResize = () => {
      if (containerRef.current && pipelineRef.current) {
        pipelineRef.current.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      pipeline.dispose();
    };
  }, [setSelectedN, setHoveredN]);

  // Update pipeline data when maxN, omegaData, displayMode, theme, layoutType, or selectedDepth changes
  useEffect(() => {
    if (pipelineRef.current && omegaData) {
      pipelineRef.current.updateData(maxN, omegaData, displayMode, theme, layoutType, selectedDepth);
    }
  }, [maxN, omegaData, displayMode, theme, layoutType, selectedDepth]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
          cursor: 'grab',
        }}
      />

      {/* Floating Zoom & Pan Controls (Bottom-Left) */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: 24,
          left: 24,
          zIndex: 10,
          display: 'flex',
          gap: 6,
          padding: '6px 8px',
        }}
      >
        <button
          onClick={() => pipelineRef.current?.zoomIn()}
          className="btn-pill"
          title="Zoom In"
          style={{ padding: '6px 10px' }}
        >
          <ZoomIn size={16} />
        </button>

        <button
          onClick={() => pipelineRef.current?.zoomOut()}
          className="btn-pill"
          title="Zoom Out"
          style={{ padding: '6px 10px' }}
        >
          <ZoomOut size={16} />
        </button>

        <button
          onClick={() => pipelineRef.current?.resetCamera()}
          className="btn-pill"
          title="Reset Camera View"
          style={{ padding: '6px 10px' }}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};
