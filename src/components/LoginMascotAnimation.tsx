import React, { useState } from 'react';
import { RotateCw, Sparkles } from 'lucide-react';

interface LoginMascotAnimationProps {
  companyName?: string;
  themeColor?: string;
  compact?: boolean;
}

export const LoginMascotAnimation: React.FC<LoginMascotAnimationProps> = ({
  companyName = 'ফুড ইআরপি',
  themeColor = '#0d9488',
  compact = false,
}) => {
  const [animKey, setAnimKey] = useState(0);

  const handleReplay = () => {
    setAnimKey((prev) => prev + 1);
  };

  return (
    <div
      key={animKey}
      className={`relative w-full overflow-hidden select-none pointer-events-none ${
        compact ? 'h-36' : 'h-48 md:h-52'
      }`}
      aria-label="Food ERP Mascot Welcome Animation"
    >
      {/* Replay Button */}
      <button
        type="button"
        onClick={handleReplay}
        title="এনিমেশন পুনরায় দেখুন (Replay Animation)"
        className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-teal-300 hover:text-white text-[10px] font-medium border border-teal-500/30 backdrop-blur-xs transition-all opacity-70 hover:opacity-100 group shadow-xs cursor-pointer pointer-events-auto"
      >
        <RotateCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
        <span className="hidden sm:inline">রিপ্লে</span>
      </button>

      {/* SVG Canvas for High-Performance CSS Keyframed Vector Animation */}
      <svg
        viewBox="0 0 440 210"
        className="w-full h-full object-contain pointer-events-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Subtle Stage Lighting & Gradients */}
          <radialGradient id="boxGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#0d9488" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="beamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#2dd4bf" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={themeColor} />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>

          <linearGradient id="caseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#134e4a" />
            <stop offset="100%" stopColor="#042f2e" />
          </linearGradient>

          <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
          </filter>

          {/* Embedded Scoped Keyframes */}
          <style>{`
            /* Phase 1: Character walks in from left (0s -> 1.4s) */
            .mascot-character-group {
              animation: walkIn 1.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
              transform-origin: bottom center;
            }

            @keyframes walkIn {
              0% {
                transform: translateX(-120px);
                opacity: 0;
              }
              25% {
                opacity: 1;
              }
              100% {
                transform: translateX(115px);
                opacity: 1;
              }
            }

            /* Alternating leg swings while walking */
            .leg-left {
              transform-origin: 22px 142px;
              animation: legLeftWalk 1.35s ease-in-out forwards;
            }
            .leg-right {
              transform-origin: 34px 142px;
              animation: legRightWalk 1.35s ease-in-out forwards;
            }

            @keyframes legLeftWalk {
              0% { transform: rotate(24deg); }
              20% { transform: rotate(-24deg); }
              40% { transform: rotate(20deg); }
              60% { transform: rotate(-18deg); }
              80% { transform: rotate(10deg); }
              100% { transform: rotate(0deg); }
            }

            @keyframes legRightWalk {
              0% { transform: rotate(-24deg); }
              20% { transform: rotate(24deg); }
              40% { transform: rotate(-20deg); }
              60% { transform: rotate(18deg); }
              80% { transform: rotate(-10deg); }
              100% { transform: rotate(0deg); }
            }

            /* Body subtle bounce while walking, then proud idle breathe */
            .body-torso {
              animation: bodyWalkBob 1.35s ease-in-out forwards, bodyBreathe 3s ease-in-out 1.5s infinite;
              transform-origin: center bottom;
            }

            @keyframes bodyWalkBob {
              0% { transform: translateY(0px); }
              20% { transform: translateY(-4px); }
              40% { transform: translateY(0px); }
              60% { transform: translateY(-4px); }
              80% { transform: translateY(0px); }
              100% { transform: translateY(0px); }
            }

            @keyframes bodyBreathe {
              0%, 100% { transform: translateY(0px) scale(1); }
              50% { transform: translateY(-1.5px) scale(1.008); }
            }

            /* Right arm: swings during walk, then points/reaches to open the case */
            .arm-right {
              transform-origin: 38px 96px;
              animation: armSwingAndPoint 2.6s ease-in-out forwards;
            }

            @keyframes armSwingAndPoint {
              0% { transform: rotate(-22deg); }
              30% { transform: rotate(20deg); }
              60% { transform: rotate(-15deg); }
              75% { transform: rotate(0deg); }
              85% { transform: rotate(38deg); } /* points towards case */
              95% { transform: rotate(28deg); }
              100% { transform: rotate(20deg); } /* relaxed pose by the opened case */
            }

            /* Left arm: swings naturally, then rests on hip / side */
            .arm-left {
              transform-origin: 16px 96px;
              animation: armLeftSwing 2.6s ease-in-out forwards;
            }

            @keyframes armLeftSwing {
              0% { transform: rotate(22deg); }
              30% { transform: rotate(-20deg); }
              60% { transform: rotate(15deg); }
              80% { transform: rotate(-5deg); }
              100% { transform: rotate(-8deg); }
            }

            /* Character Shadow follows character */
            .mascot-shadow {
              animation: shadowMove 1.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }
            @keyframes shadowMove {
              0% { transform: translateX(-120px) scaleX(0.7); opacity: 0; }
              100% { transform: translateX(115px) scaleX(1); opacity: 0.6; }
            }

            /* Briefcase Latches Click */
            .case-latch {
              transform-origin: center;
              animation: latchUnlock 0.3s ease-out 1.45s forwards;
            }
            @keyframes latchUnlock {
              0% { transform: scale(1); }
              50% { transform: scale(1.35); filter: drop-shadow(0 0 4px #fbbf24); }
              100% { transform: scale(1); }
            }

            /* Briefcase Lid Opens */
            .case-lid {
              transform-origin: 290px 145px;
              animation: lidOpen 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) 1.55s forwards;
            }
            @keyframes lidOpen {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(-105deg);
              }
            }

            /* Light Beam / Glow from the opened box */
            .case-beam {
              opacity: 0;
              transform-origin: 290px 145px;
              animation: beamRise 0.8s ease-out 1.7s forwards, beamPulse 2.5s ease-in-out 2.5s infinite alternate;
            }
            @keyframes beamRise {
              0% { opacity: 0; transform: scaleY(0.2) scaleX(0.5); }
              100% { opacity: 0.85; transform: scaleY(1) scaleX(1); }
            }
            @keyframes beamPulse {
              0% { opacity: 0.7; }
              100% { opacity: 0.95; }
            }

            /* The Revealed Emblem / Welcome Banner floating out */
            .revealed-welcome {
              opacity: 0;
              transform-origin: 290px 140px;
              animation: revealEmerge 0.85s cubic-bezier(0.16, 1, 0.3, 1) 1.85s forwards,
                         revealHover 3s ease-in-out 2.7s infinite alternate;
            }

            @keyframes revealEmerge {
              0% {
                opacity: 0;
                transform: translateY(25px) scale(0.4);
              }
              70% {
                opacity: 1;
                transform: translateY(-42px) scale(1.08);
              }
              100% {
                opacity: 1;
                transform: translateY(-36px) scale(1);
              }
            }

            @keyframes revealHover {
              0% { transform: translateY(-36px) scale(1); }
              100% { transform: translateY(-41px) scale(1.02); }
            }

            /* Sparkles & Star bursts */
            .sparkle-particle-1 {
              opacity: 0;
              animation: sparklePop 0.8s ease-out 2.05s forwards, sparkleTwinkle 2s ease-in-out 2.85s infinite alternate;
            }
            .sparkle-particle-2 {
              opacity: 0;
              animation: sparklePop 0.8s ease-out 2.2s forwards, sparkleTwinkle 2.4s ease-in-out 3s infinite alternate;
            }
            .sparkle-particle-3 {
              opacity: 0;
              animation: sparklePop 0.8s ease-out 2.35s forwards, sparkleTwinkle 1.8s ease-in-out 3.15s infinite alternate;
            }

            @keyframes sparklePop {
              0% { opacity: 0; transform: scale(0); }
              60% { opacity: 1; transform: scale(1.3); }
              100% { opacity: 0.9; transform: scale(1); }
            }
            @keyframes sparkleTwinkle {
              0% { opacity: 0.5; transform: scale(0.85) rotate(0deg); }
              100% { opacity: 1; transform: scale(1.15) rotate(25deg); }
            }
          `}</style>
        </defs>

        {/* 1. STAGE FLOOR & SUBTLE AMBIENCE */}
        <g id="stage-environment">
          {/* Soft Horizon / Stage Base */}
          <line
            x1="20"
            y1="178"
            x2="420"
            y2="178"
            stroke="#1e293b"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            strokeOpacity="0.45"
          />

          {/* Briefcase Static Ground Shadow */}
          <ellipse
            cx="290"
            cy="180"
            rx="46"
            ry="9"
            fill="#020617"
            fillOpacity="0.6"
          />

          {/* Dynamic Character Shadow */}
          <ellipse
            className="mascot-shadow"
            cx="28"
            cy="180"
            rx="26"
            ry="7"
            fill="#020617"
          />
        </g>

        {/* 2. THE BRIEFCASE / EXECUTIVE CHEST (At x=250..330, y=140..178) */}
        <g id="briefcase-assembly">
          {/* Light Beam / Glow from Inside when open */}
          <g className="case-beam">
            {/* Ambient Cone Beam */}
            <polygon
              points="290,145 235,45 345,45"
              fill="url(#beamGrad)"
            />
            {/* Core Radial Glow Orb */}
            <circle
              cx="290"
              cy="125"
              r="40"
              fill="url(#boxGlow)"
            />
          </g>

          {/* Briefcase Interior Cavity (Visible when open) */}
          <rect
            x="254"
            y="140"
            width="72"
            height="36"
            rx="5"
            fill="#042f2e"
            stroke="#0d9488"
            strokeWidth="1.5"
          />
          {/* Gold Trim inside */}
          <rect
            x="258"
            y="144"
            width="64"
            height="28"
            rx="3"
            fill="#0f172a"
            stroke="#f59e0b"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />

          {/* Briefcase Body (Base container) */}
          <rect
            x="252"
            y="145"
            width="76"
            height="32"
            rx="6"
            fill="url(#caseGrad)"
            stroke="#334155"
            strokeWidth="1.5"
            filter="url(#softShadow)"
          />
          {/* Metallic Reinforcement Corners */}
          <path d="M252 153 L260 153 L260 145" fill="none" stroke="url(#goldGrad)" strokeWidth="2" />
          <path d="M328 153 L320 153 L320 145" fill="none" stroke="url(#goldGrad)" strokeWidth="2" />
          <path d="M252 169 L260 169 L260 177" fill="none" stroke="url(#goldGrad)" strokeWidth="2" />
          <path d="M328 169 L320 169 L320 177" fill="none" stroke="url(#goldGrad)" strokeWidth="2" />

          {/* Briefcase Central Handle */}
          <path
            d="M280 145 C280 139, 300 139, 300 145"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Briefcase Latches */}
          <rect
            className="case-latch"
            x="266"
            y="146"
            width="6"
            height="6"
            rx="1.5"
            fill="url(#goldGrad)"
          />
          <rect
            className="case-latch"
            x="308"
            y="146"
            width="6"
            height="6"
            rx="1.5"
            fill="url(#goldGrad)"
          />

          {/* Briefcase Lid (Rotates open) */}
          <g className="case-lid">
            <rect
              x="250"
              y="136"
              width="80"
              height="14"
              rx="5"
              fill="url(#caseGrad)"
              stroke="#475569"
              strokeWidth="1.5"
            />
            {/* Lid Gold Trim */}
            <line x1="254" y1="143" x2="326" y2="143" stroke="url(#goldGrad)" strokeWidth="1.2" />
            <rect x="286" y="139" width="8" height="3" rx="1" fill="#cbd5e1" />
          </g>

          {/* 3. REVEALED CONTENT: FOOD ERP WELCOME EMBLEM & BANNER */}
          <g className="revealed-welcome" filter="url(#glowFilter)">
            {/* Elegant 3D Glass Plaque Background */}
            <rect
              x="232"
              y="74"
              width="116"
              height="48"
              rx="12"
              fill="url(#badgeGrad)"
              stroke="#2dd4bf"
              strokeWidth="1.5"
              strokeOpacity="0.8"
              filter="url(#softShadow)"
            />

            {/* Glowing inner accent border */}
            <rect
              x="234"
              y="76"
              width="112"
              height="44"
              rx="10"
              fill="none"
              stroke="#5eead4"
              strokeWidth="0.8"
              strokeDasharray="4 2"
              strokeOpacity="0.5"
            />

            {/* Emblem Icon: Factory & Wheat Shield */}
            <g transform="translate(242, 82)">
              <circle cx="16" cy="16" r="14" fill="#0d9488" fillOpacity="0.3" stroke="#2dd4bf" strokeWidth="1" />
              {/* Wheat / Food symbol */}
              <path
                d="M16 8 C16 16, 21 16, 21 12 C21 16, 16 20, 16 24"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M16 8 C16 16, 11 16, 11 12 C11 16, 16 20, 16 24"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="16" cy="24" r="1.5" fill="#34d399" />
            </g>

            {/* Welcome Text in Bangla & English */}
            <text
              x="280"
              y="93"
              fill="#f8fafc"
              fontSize="11"
              fontWeight="bold"
              fontFamily="sans-serif"
              letterSpacing="0.4"
            >
              স্বাগতম! WELCOME
            </text>
            <text
              x="280"
              y="107"
              fill="#5eead4"
              fontSize="8.5"
              fontWeight="600"
              fontFamily="sans-serif"
            >
              ফুড ইআরপি অটোমেশন
            </text>

            {/* Little golden ribbon seal */}
            <polygon
              points="340,78 346,84 340,90"
              fill="url(#goldGrad)"
            />
          </g>

          {/* Sparkles / Magic Stars */}
          <g className="sparkle-particle-1" transform="translate(225, 68)">
            <path
              d="M0,5 Q5,5 5,0 Q5,5 10,5 Q5,5 5,10 Q5,5 0,5 Z"
              fill="#fbbf24"
            />
          </g>
          <g className="sparkle-particle-2" transform="translate(348, 62)">
            <path
              d="M0,6 Q6,6 6,0 Q6,6 12,6 Q6,6 6,12 Q6,6 0,6 Z"
              fill="#2dd4bf"
            />
          </g>
          <g className="sparkle-particle-3" transform="translate(300, 48)">
            <circle cx="0" cy="0" r="2.5" fill="#fde047" />
          </g>
        </g>

        {/* 4. THE MASCOT CHARACTER (Walks in and stops beside the case) */}
        <g className="mascot-character-group" id="mascot-character">
          {/* LEFT LEG & SHOE */}
          <g className="leg-left">
            {/* Pants leg */}
            <rect
              x="18"
              y="142"
              width="8"
              height="28"
              rx="4"
              fill="#1e293b"
            />
            {/* Shoe */}
            <path
              d="M16 168 Q24 167 28 171 Q28 174 20 174 Q16 174 16 168 Z"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="0.8"
            />
            <rect x="18" y="172" width="10" height="2" fill="#475569" rx="1" />
          </g>

          {/* RIGHT LEG & SHOE */}
          <g className="leg-right">
            {/* Pants leg */}
            <rect
              x="30"
              y="142"
              width="8"
              height="28"
              rx="4"
              fill="#1e293b"
            />
            {/* Shoe */}
            <path
              d="M28 168 Q36 167 40 171 Q40 174 32 174 Q28 174 28 168 Z"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="0.8"
            />
            <rect x="30" y="172" width="10" height="2" fill="#475569" rx="1" />
          </g>

          {/* TORSO / BODY (Vest, Shirt, Tie, ID Badge) */}
          <g className="body-torso">
            {/* White Shirt base */}
            <rect
              x="17"
              y="94"
              width="22"
              height="48"
              rx="6"
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="0.5"
            />

            {/* Corporate Vest / Production Coat in Theme Color */}
            <path
              d="M17 100 L24 100 L24 142 L17 142 Z"
              fill="url(#suitGrad)"
            />
            <path
              d="M32 100 L39 100 L39 142 L32 142 Z"
              fill="url(#suitGrad)"
            />
            <rect
              x="17"
              y="126"
              width="22"
              height="16"
              fill="url(#suitGrad)"
              rx="3"
            />

            {/* Belt */}
            <rect x="17" y="139" width="22" height="4" fill="#0f172a" />
            <rect x="26" y="138.5" width="4" height="5" rx="1" fill="url(#goldGrad)" />

            {/* Golden Amber Tie / Neckerchief */}
            <polygon
              points="28,98 25,116 28,124 31,116"
              fill="url(#goldGrad)"
            />
            <polygon points="26,96 30,96 28.5,100 27.5,100" fill="#d97706" />

            {/* Staff ID Card Badge on Lanyard */}
            <line x1="28" y1="95" x2="23" y2="110" stroke="#0d9488" strokeWidth="0.8" />
            <rect
              x="20"
              y="110"
              width="6"
              height="9"
              rx="1.2"
              fill="#ffffff"
              stroke="#0d9488"
              strokeWidth="0.6"
            />
            <rect x="21" y="112" width="4" height="2" fill="#0d9488" />
            <line x1="21" y1="115" x2="25" y2="115" stroke="#64748b" strokeWidth="0.6" />
            <line x1="21" y1="117" x2="24" y2="117" stroke="#64748b" strokeWidth="0.6" />

            {/* HEAD & FACE */}
            <g id="mascot-head" transform="translate(0, 0)">
              {/* Neck */}
              <rect x="25" y="88" width="6" height="8" fill="#fed7aa" rx="2" />

              {/* Head / Face Oval */}
              <ellipse
                cx="28"
                cy="76"
                rx="14"
                ry="15"
                fill="#ffedd5"
                stroke="#fdba74"
                strokeWidth="0.8"
              />

              {/* Ears */}
              <circle cx="14" cy="76" r="3.2" fill="#fed7aa" />
              <circle cx="42" cy="76" r="3.2" fill="#fed7aa" />

              {/* Stylish Corporate Haircut */}
              <path
                d="M14 74 C14 62, 42 62, 42 74 C40 65, 34 62, 28 62 C22 62, 16 66, 14 74 Z"
                fill="#1e293b"
              />
              <path
                d="M13 74 C14 66, 20 62, 28 62 C35 62, 39 65, 43 72 C41 68, 38 65, 33 65 C24 65, 18 70, 13 74 Z"
                fill="#334155"
              />

              {/* Friendly Eyebrows */}
              <path d="M19 70 Q22 68 24 70" fill="none" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M32 70 Q34 68 37 70" fill="none" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />

              {/* Eyes - Alert, Happy, Focused */}
              <ellipse cx="22" cy="74" rx="2" ry="2.5" fill="#0f172a" />
              <circle cx="22.6" cy="73.2" r="0.7" fill="#ffffff" />

              <ellipse cx="34" cy="74" rx="2" ry="2.5" fill="#0f172a" />
              <circle cx="34.6" cy="73.2" r="0.7" fill="#ffffff" />

              {/* Rosy Cheeks */}
              <ellipse cx="18" cy="79" rx="2.5" ry="1.4" fill="#fb7185" fillOpacity="0.45" />
              <ellipse cx="38" cy="79" rx="2.5" ry="1.4" fill="#fb7185" fillOpacity="0.45" />

              {/* Cute Nose */}
              <path d="M28 75 L27.5 78 L29.5 78" fill="none" stroke="#fb923c" strokeWidth="0.9" strokeLinecap="round" />

              {/* Cheerful Confident Smile */}
              <path
                d="M23 81 Q28 86 33 81"
                fill="none"
                stroke="#b91c1c"
                strokeWidth="1.3"
                strokeLinecap="round"
              />

              {/* Modern Professional Visor / Smart Headset Mic */}
              <path
                d="M14 76 C13 83, 18 86, 24 86"
                fill="none"
                stroke="#0d9488"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <circle cx="24" cy="86" r="1.8" fill="#2dd4bf" />
            </g>
          </g>

          {/* LEFT ARM */}
          <g className="arm-left">
            <path
              d="M18 97 C12 108, 12 120, 16 128"
              fill="none"
              stroke="url(#suitGrad)"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            {/* Hand */}
            <circle cx="16" cy="129" r="3.2" fill="#ffedd5" />
          </g>

          {/* RIGHT ARM (Reaches toward and unlocks briefcase) */}
          <g className="arm-right">
            <path
              d="M38 97 C46 108, 48 118, 56 126"
              fill="none"
              stroke="url(#suitGrad)"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            {/* Hand with gesturing index finger */}
            <circle cx="56" cy="126" r="3.5" fill="#ffedd5" />
            <path
              d="M57 125 L63 126"
              fill="none"
              stroke="#ffedd5"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </g>
      </svg>
    </div>
  );
};
