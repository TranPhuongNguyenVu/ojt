import { useEffect, useState } from 'react';

/** Design canvas width — UI always lays out as FHD, then scales to the viewport. */
export const FHD_WIDTH = 1920;

function computeMetrics() {
  const scale = window.innerWidth / FHD_WIDTH;
  return {
    scale,
    // Logical height so visual height fills the viewport after zoom/scale
    height: Math.max(window.innerHeight / scale, 1),
  };
}

/**
 * Keeps children laid out at FHD (1920px) and scales the whole screen to fit the window.
 * Uses CSS zoom (Chromium/Edge); falls back to transform scale for Firefox.
 */
const FhdScaleShell = ({ children, className = '' }) => {
  const [metrics, setMetrics] = useState(() =>
    typeof window === 'undefined' ? { scale: 1, height: 1080 } : computeMetrics()
  );
  const [useZoom, setUseZoom] = useState(true);

  useEffect(() => {
    setUseZoom(typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
      ? CSS.supports('zoom', '1')
      : 'zoom' in document.documentElement.style);

    const update = () => setMetrics(computeMetrics());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div
      className="fhd-scale-viewport fixed inset-0 overflow-hidden bg-gray-50 dark:bg-[#050505]"
      style={useZoom ? undefined : { height: '100vh', width: '100vw' }}
    >
      <div
        className={`fhd-scale-canvas ${className}`}
        style={
          useZoom
            ? {
                width: FHD_WIDTH,
                height: metrics.height,
                zoom: metrics.scale,
              }
            : {
                width: FHD_WIDTH,
                height: metrics.height,
                transform: `scale(${metrics.scale})`,
                transformOrigin: 'top left',
              }
        }
      >
        {children}
      </div>
    </div>
  );
};

export default FhdScaleShell;
