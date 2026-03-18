"use client";

export default function EarthCoreV3() {
  return (
    <div className="earth-core-v3">
      <div className="earth-v3-glow" />

      <img
        src="/earth-core.jpg"
        alt="Earth"
        className="earth-v3-img"
      />

      <svg className="earth-v3-orbits" viewBox="0 0 600 600" aria-hidden="true">
        <defs>
          <filter id="earthV3Glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="300" cy="300" r="210" className="earth-v3-orbit-line" />
        <circle cx="300" cy="300" r="248" className="earth-v3-orbit-line" />
        <ellipse cx="300" cy="300" rx="280" ry="110" className="earth-v3-orbit-line orbit-tilt-a" />
        <ellipse cx="300" cy="300" rx="250" ry="320" className="earth-v3-orbit-line orbit-tilt-b" />

        <circle cx="300" cy="300" r="210" className="earth-v3-orbit-flow flow-a" filter="url(#earthV3Glow)" />
        <circle cx="300" cy="300" r="248" className="earth-v3-orbit-flow flow-b" filter="url(#earthV3Glow)" />
        <ellipse cx="300" cy="300" rx="280" ry="110" className="earth-v3-orbit-flow flow-c orbit-tilt-a" filter="url(#earthV3Glow)" />
        <ellipse cx="300" cy="300" rx="250" ry="320" className="earth-v3-orbit-flow flow-d orbit-tilt-b" filter="url(#earthV3Glow)" />

        {/* 数据粒子 */}
        <circle cx="510" cy="300" r="4" className="earth-v3-particle particle-a" />
        <circle cx="548" cy="300" r="3.5" className="earth-v3-particle particle-b" />
        <circle cx="580" cy="300" r="3.5" className="earth-v3-particle particle-c orbit-tilt-a" />
        <circle cx="550" cy="80" r="3.5" className="earth-v3-particle particle-d orbit-tilt-b" />
      </svg>

      <div className="earth-v3-scan-ring ring-a" />
      <div className="earth-v3-scan-ring ring-b" />
    </div>
  );
}