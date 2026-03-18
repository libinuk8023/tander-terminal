"use client";

export default function HeaderLogo({ size = 60 }: { size?: number }) {
  return (
    <svg
      className="tis-logo"
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Tander Intelligence Logo"
    >
      <defs>
        <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="logoSoftGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <radialGradient id="coreGlow" cx="50%" cy="50%" r="52%">
          <stop offset="0%" stopColor="#e5fdff" stopOpacity="0.98" />
          <stop offset="30%" stopColor="#8ef3ff" stopOpacity="0.34" />
          <stop offset="65%" stopColor="#4fdfff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#4fdfff" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="mainLine" x1="0" y1="0" x2="200" y2="200">
          <stop offset="0%" stopColor="#c8fbff" />
          <stop offset="48%" stopColor="#70edff" />
          <stop offset="100%" stopColor="#26b8ff" />
        </linearGradient>

        <linearGradient id="subLine" x1="200" y1="0" x2="0" y2="200">
          <stop offset="0%" stopColor="#d9fdff" />
          <stop offset="45%" stopColor="#7febff" />
          <stop offset="100%" stopColor="#30bbff" />
        </linearGradient>

        <linearGradient id="tFill" x1="100" y1="76" x2="100" y2="144">
          <stop offset="0%" stopColor="#f0feff" />
          <stop offset="42%" stopColor="#8ef0ff" />
          <stop offset="100%" stopColor="#33bbff" />
        </linearGradient>
      </defs>

      {/* 核心柔光 */}
      <circle cx="100" cy="100" r="34" fill="url(#coreGlow)" />
      <circle cx="100" cy="100" r="20" fill="#73e9ff" opacity="0.09" />

      {/* 最外层主环 */}
      <circle
  cx="100"
  cy="100"
  r="90"
  stroke="#67ebff"
  strokeWidth="6"
  opacity="0.08"
/>
      <g className="tis-ring-outer">
<circle cx="100" cy="100" r="90" stroke="#67ebff" strokeWidth="6" opacity="0.08" />
<circle cx="100" cy="100" r="90" stroke="url(#mainLine)" strokeWidth="1.4" opacity="0.98" />
<circle cx="100" cy="100" r="86" stroke="#8ff4ff" strokeWidth="2" opacity="0.22" />        <circle cx="100" cy="100" r="82" stroke="#78eeff" strokeWidth="1" strokeDasharray="3 6" opacity="0.55" />
        <circle cx="100" cy="100" r="75" stroke="#78eeff" strokeWidth="0.8" strokeDasharray="1 7" opacity="0.28" />
      </g>
      <circle
  cx="100"
  cy="100"
  r="86"
  stroke="#8ff4ff"
  strokeWidth="2"
  opacity="0.25"
/>

      {/* HUD 断裂扫描弧 */}
      <g className="tis-ring-scan" filter="url(#logoGlow)">
        <path d="M34 70 A78 78 0 0 1 52 42" stroke="#8bf4ff" strokeWidth="1.8" strokeLinecap="round" opacity="0.98" />
        <path d="M66 28 A78 78 0 0 1 92 22" stroke="#8bf4ff" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
        <path d="M108 22 A78 78 0 0 1 134 28" stroke="#8bf4ff" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
        <path d="M148 42 A78 78 0 0 1 166 70" stroke="#8bf4ff" strokeWidth="1.8" strokeLinecap="round" opacity="0.98" />
        <path d="M166 130 A78 78 0 0 1 148 158" stroke="#8bf4ff" strokeWidth="1.8" strokeLinecap="round" opacity="0.98" />
        <path d="M134 172 A78 78 0 0 1 108 178" stroke="#8bf4ff" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
        <path d="M92 178 A78 78 0 0 1 66 172" stroke="#8bf4ff" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
        <path d="M52 158 A78 78 0 0 1 34 130" stroke="#8bf4ff" strokeWidth="1.8" strokeLinecap="round" opacity="0.98" />
      </g>

      {/* 十字 HUD 刻度 */}
      <g className="tis-crosshair">
        <line x1="100" y1="8" x2="100" y2="22" stroke="#9ff7ff" strokeWidth="1" opacity="0.9" />
        <line x1="192" y1="100" x2="178" y2="100" stroke="#9ff7ff" strokeWidth="1" opacity="0.9" />
        <line x1="100" y1="192" x2="100" y2="178" stroke="#9ff7ff" strokeWidth="1" opacity="0.9" />
        <line x1="8" y1="100" x2="22" y2="100" stroke="#9ff7ff" strokeWidth="1" opacity="0.9" />
      </g>

      {/* 主节点 */}
      <g className="tis-nodes" filter="url(#logoGlow)">
        <circle cx="100" cy="10" r="2.6" fill="#b9fbff" />
        <circle cx="190" cy="100" r="2.6" fill="#b9fbff" />
        <circle cx="100" cy="190" r="2.6" fill="#b9fbff" />
        <circle cx="10" cy="100" r="2.6" fill="#b9fbff" />
      </g>

      {/* 微粒子 */}
      <g className="tis-particles" filter="url(#logoGlow)">
        <circle cx="56" cy="30" r="1.1" fill="#95f7ff" opacity="0.8" />
        <circle cx="145" cy="34" r="1.1" fill="#95f7ff" opacity="0.8" />
        <circle cx="170" cy="62" r="1" fill="#95f7ff" opacity="0.7" />
        <circle cx="30" cy="146" r="1" fill="#95f7ff" opacity="0.6" />
        <circle cx="148" cy="170" r="1.1" fill="#95f7ff" opacity="0.7" />
        <circle cx="54" cy="166" r="1" fill="#95f7ff" opacity="0.65" />
      </g>

      {/* 多层六边形结构 */}
      <g className="tis-hex" filter="url(#logoGlow)">
        <polygon
          points="100,34 154,66 154,134 100,166 46,134 46,66"
          stroke="url(#mainLine)"
          strokeWidth="2.15"
          fill="none"
        />

        <polygon
          points="100,50 140,74 140,126 100,150 60,126 60,74"
          stroke="url(#subLine)"
          strokeWidth="1.25"
          fill="none"
          opacity="0.96"
        />

        <polygon
          points="100,62 126,78 126,122 100,138 74,122 74,78"
          stroke="#aaf8ff"
          strokeWidth="0.9"
          fill="none"
          opacity="0.62"
        />

        <line x1="46" y1="66" x2="100" y2="150" stroke="#7cecff" strokeWidth="0.9" opacity="0.72" />
        <line x1="154" y1="66" x2="100" y2="150" stroke="#7cecff" strokeWidth="0.9" opacity="0.72" />
        <line x1="46" y1="134" x2="100" y2="50" stroke="#7cecff" strokeWidth="0.9" opacity="0.42" />
        <line x1="154" y1="134" x2="100" y2="50" stroke="#7cecff" strokeWidth="0.9" opacity="0.42" />

        <line x1="60" y1="74" x2="140" y2="74" stroke="#89f0ff" strokeWidth="0.75" opacity="0.32" />
        <line x1="74" y1="122" x2="126" y2="122" stroke="#89f0ff" strokeWidth="0.75" opacity="0.28" />
      </g>

      {/* 中心品牌化 T */}
      <g className="tis-core-t" filter="url(#logoSoftGlow)">
        <path
          d="M70 78 L130 78 L118 91 L108 91 L108 95 L92 95 L92 91 L82 91 Z"
          fill="url(#tFill)"
        />
        <rect x="94" y="95" width="12" height="28" rx="2" fill="url(#tFill)" />
        <path d="M94 123 H106 L102.6 136 L100 142 L97.4 136 Z" fill="url(#tFill)" />
        <circle cx="100" cy="100" r="3.8" fill="#f1feff" filter="url(#logoGlow)" />
      </g>
    </svg>
  );
}