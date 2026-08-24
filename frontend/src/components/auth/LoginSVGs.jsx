/* ── Premium Vector Illustrations for Login Pages (Light theme) ── */

export function AdminIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background glow */}
      <circle cx="240" cy="240" r="200" fill="url(#admin-glow)" opacity="0.08" />

      {/* Outer ring */}
      <circle cx="240" cy="240" r="165" stroke="url(#admin-ring)" strokeWidth="1" opacity="0.2" />
      <circle cx="240" cy="240" r="140" stroke="url(#admin-ring)" strokeWidth="0.5" opacity="0.12" />

      {/* Main shield shape */}
      <path d="M240 110 L340 155 L340 230 C340 305 295 360 240 380 C185 360 140 305 140 230 L140 155 Z"
            fill="url(#admin-shield)" stroke="url(#admin-shield-stroke)" strokeWidth="2" opacity="0.9" />

      {/* Shield inner glow */}
      <path d="M240 140 L315 172 L315 225 C315 285 280 330 240 345 C200 330 165 285 165 225 L165 172 Z"
            fill="url(#admin-shield-inner)" opacity="0.3" />

      {/* Lock icon inside shield */}
      <rect x="218" y="225" width="44" height="36" rx="6" fill="#ffffff" opacity="0.95" />
      <path d="M228 240 V235 C228 228.5 233.5 223 240 223 C246.5 223 252 228.5 252 235 V240"
            stroke="#1e3a5f" strokeWidth="3" strokeLinecap="round" />
      <circle cx="240" cy="247" r="4" fill="#1e3a5f" />
      <line x1="240" y1="247" x2="240" y2="253" stroke="#1e3a5f" strokeWidth="2.5" strokeLinecap="round" />

      {/* Data bars - left */}
      <rect x="100" y="180" width="24" height="60" rx="4" fill="#4795FE" opacity="0.06" />
      <rect x="100" y="210" width="24" height="30" rx="4" fill="url(#admin-bar1)" opacity="0.5" />
      <rect x="130" y="160" width="24" height="80" rx="4" fill="#4795FE" opacity="0.06" />
      <rect x="130" y="190" width="24" height="50" rx="4" fill="url(#admin-bar2)" opacity="0.4" />

      {/* Data bars - right */}
      <rect x="326" y="170" width="24" height="70" rx="4" fill="#4795FE" opacity="0.06" />
      <rect x="326" y="195" width="24" height="45" rx="4" fill="url(#admin-bar2)" opacity="0.5" />
      <rect x="356" y="185" width="24" height="55" rx="4" fill="#4795FE" opacity="0.06" />
      <rect x="356" y="210" width="24" height="30" rx="4" fill="url(#admin-bar1)" opacity="0.4" />

      {/* Data nodes */}
      <circle cx="100" cy="300" r="6" fill="url(#admin-dot)" opacity="0.4" />
      <circle cx="130" cy="320" r="4" fill="url(#admin-dot)" opacity="0.25" />
      <circle cx="380" cy="290" r="6" fill="url(#admin-dot)" opacity="0.4" />
      <circle cx="350" cy="330" r="4" fill="url(#admin-dot)" opacity="0.25" />

      {/* Connecting lines */}
      <path d="M100 300 L130 320 L240 300 L350 330 L380 290"
            stroke="url(#admin-ring)" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />

      {/* Top decorative dots */}
      <circle cx="160" cy="85" r="3" fill="#4795FE" opacity="0.15" />
      <circle cx="240" cy="75" r="4" fill="#4795FE" opacity="0.2" />
      <circle cx="320" cy="85" r="3" fill="#4795FE" opacity="0.15" />
      <circle cx="280" cy="95" r="2" fill="#4795FE" opacity="0.1" />
      <circle cx="200" cy="95" r="2" fill="#4795FE" opacity="0.1" />

      {/* Bottom decorative line */}
      <line x1="170" y1="380" x2="310" y2="380" stroke="url(#admin-ring)" strokeWidth="1" strokeDasharray="2 4" opacity="0.12" />
      <circle cx="170" cy="380" r="3" fill="url(#admin-dot)" opacity="0.25" />
      <circle cx="310" cy="380" r="3" fill="url(#admin-dot)" opacity="0.25" />

      {/* Corner accents */}
      <path d="M60 420 L70 420 L70 410" stroke="#4795FE" strokeWidth="1.5" opacity="0.1" fill="none" />
      <path d="M420 420 L410 420 L410 410" stroke="#4795FE" strokeWidth="1.5" opacity="0.1" fill="none" />

      {/* Gradients */}
      <defs>
        <radialGradient id="admin-glow" cx="50%" cy="50%" r="50%">
          <stop stopColor="#4795FE" />
          <stop offset="1" stopColor="#4795FE" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="admin-ring" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#4795FE" stopOpacity="0.3" />
          <stop offset="1" stopColor="#6366f1" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="admin-shield" x1="240" y1="110" x2="240" y2="380">
          <stop stopColor="#4795FE" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="admin-shield-stroke" x1="240" y1="110" x2="240" y2="380">
          <stop stopColor="#60a5fa" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="admin-shield-inner" x1="240" y1="140" x2="240" y2="345">
          <stop stopColor="white" stopOpacity="0.15" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="admin-bar1" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#60a5fa" />
          <stop offset="1" stopColor="#4795FE" />
        </linearGradient>
        <linearGradient id="admin-bar2" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#a78bfa" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
        <radialGradient id="admin-dot" cx="50%" cy="50%" r="50%">
          <stop stopColor="#60a5fa" />
          <stop offset="1" stopColor="#4795FE" stopOpacity="0.3" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function ManagerIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background glow */}
      <circle cx="240" cy="240" r="200" fill="url(#mgr-glow)" opacity="0.08" />

      {/* Network circles */}
      <circle cx="240" cy="240" r="160" stroke="url(#mgr-ring)" strokeWidth="1" opacity="0.18" />
      <circle cx="240" cy="240" r="120" stroke="url(#mgr-ring)" strokeWidth="0.5" opacity="0.1" />

      {/* Central node - leader */}
      <circle cx="240" cy="240" r="45" fill="url(#mgr-center)" opacity="0.12" />
      <circle cx="240" cy="240" r="35" fill="url(#mgr-center-glow)" opacity="0.25" />
      <circle cx="240" cy="240" r="28" fill="url(#mgr-center-solid)" />

      {/* Leader icon - person silhouette */}
      <circle cx="240" cy="228" r="10" fill="#ffffff" opacity="0.95" />
      <path d="M222 265 C222 251 230 245 240 245 C250 245 258 251 258 265"
            fill="#ffffff" opacity="0.95" />

      {/* Crown/star indicator */}
      <path d="M240 205 L244 214 L253 213 L247 220 L250 229 L240 224 L230 229 L233 220 L227 213 L236 214 Z"
            fill="#fbbf24" opacity="0.95" />

      {/* Team nodes - connected */}
      {[
        { x: 140, y: 160, delay: 0 },
        { x: 340, y: 160, delay: 1 },
        { x: 115, y: 300, delay: 2 },
        { x: 365, y: 300, delay: 3 },
        { x: 160, y: 360, delay: 4 },
        { x: 320, y: 360, delay: 5 },
      ].map((node, i) => (
        <g key={i}>
          {/* Connection line to center */}
          <line
            x1={240} y1={240}
            x2={node.x} y2={node.y}
            stroke="url(#mgr-ring)" strokeWidth="1.5"
            strokeDasharray="4 3" opacity={0.2}
          />
          {/* Node dot */}
          <circle cx={node.x} cy={node.y} r="16" fill="url(#mgr-center)" opacity="0.08" />
          <circle cx={node.x} cy={node.y} r="11" fill="url(#mgr-center-glow)" opacity="0.2" />
          <circle cx={node.x} cy={node.y} r="7" fill="url(#mgr-dot)" />
        </g>
      ))}

      {/* Growth arrow */}
      <path d="M115 140 L160 120 L200 130 L250 105 L300 115 L340 90"
            stroke="url(#mgr-arrow)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M340 90 L330 86 M340 90 L336 97" stroke="url(#mgr-arrow)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Growth dots on arrow */}
      <circle cx="160" cy="120" r="3" fill="#fbbf24" opacity="0.5" />
      <circle cx="250" cy="105" r="3" fill="#fbbf24" opacity="0.6" />
      <circle cx="340" cy="90" r="3" fill="#fbbf24" opacity="0.8" />

      {/* Decorative elements */}
      <circle cx="85" cy="120" r="2" fill="#f59e0b" opacity="0.15" />
      <circle cx="420" cy="110" r="3" fill="#f59e0b" opacity="0.12" />
      <circle cx="100" cy="380" r="2" fill="#f59e0b" opacity="0.1" />
      <circle cx="400" cy="380" r="2.5" fill="#f59e0b" opacity="0.12" />

      {/* Bottom decorative line */}
      <line x1="150" y1="405" x2="330" y2="405" stroke="url(#mgr-ring)" strokeWidth="1" strokeDasharray="3 5" opacity="0.1" />

      {/* Gradients */}
      <defs>
        <radialGradient id="mgr-glow" cx="50%" cy="50%" r="50%">
          <stop stopColor="#f59e0b" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mgr-ring" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fbbf24" stopOpacity="0.3" />
          <stop offset="1" stopColor="#f97316" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id="mgr-center" cx="50%" cy="50%" r="50%">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f59e0b" />
        </radialGradient>
        <radialGradient id="mgr-center-glow" cx="50%" cy="50%" r="50%">
          <stop stopColor="#fbbf24" stopOpacity="0.4" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0.1" />
        </radialGradient>
        <radialGradient id="mgr-center-solid" cx="50%" cy="50%" r="50%">
          <stop stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </radialGradient>
        <radialGradient id="mgr-dot" cx="50%" cy="50%" r="50%">
          <stop stopColor="#fbbf24" stopOpacity="0.8" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0.4" />
        </radialGradient>
        <linearGradient id="mgr-arrow" x1="115" y1="140" x2="340" y2="90">
          <stop stopColor="#fbbf24" stopOpacity="0.3" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function EmployeeIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background glow */}
      <circle cx="240" cy="240" r="200" fill="url(#emp-glow)" opacity="0.08" />

      {/* Ring */}
      <circle cx="240" cy="240" r="155" stroke="url(#emp-ring)" strokeWidth="1" opacity="0.18" />
      <circle cx="240" cy="240" r="130" stroke="url(#emp-ring)" strokeWidth="0.5" opacity="0.08" />

      {/* Calendar base */}
      <rect x="175" y="195" width="130" height="130" rx="16" fill="url(#emp-card)" opacity="0.12" />
      <rect x="180" y="200" width="120" height="120" rx="14" fill="url(#emp-card-bg)" opacity="0.25" />

      {/* Calendar header */}
      <rect x="185" y="205" width="110" height="28" rx="6" fill="url(#emp-accent)" opacity="0.2" />
      <text x="240" y="224" textAnchor="middle" fill="#0d9488" fontSize="11" fontWeight="700"
            fontFamily="system-ui" opacity="0.8">MARCH 2026</text>

      {/* Calendar dates */}
      {[
        { x: 193, y: 248 },
        { x: 211, y: 248 },
        { x: 229, y: 248 },
        { x: 247, y: 248, active: true },
        { x: 265, y: 248 },
        { x: 283, y: 248 },
        { x: 193, y: 268 },
        { x: 211, y: 268 },
        { x: 229, y: 268 },
        { x: 247, y: 268 },
        { x: 265, y: 268 },
        { x: 283, y: 268 },
        { x: 193, y: 288 },
        { x: 211, y: 288, active: true },
        { x: 229, y: 288 },
        { x: 247, y: 288 },
        { x: 265, y: 288 },
        { x: 283, y: 288 },
      ].map((day, i) => (
        day.active ? (
          <rect key={i} x={day.x - 7} y={day.y - 7} width="14" height="14" rx="3"
                fill="url(#emp-accent)" opacity="0.5" />
        ) : (
          <circle key={i} cx={day.x} cy={day.y} r="1.5" fill="#0d9488" opacity="0.2" />
        )
      ))}

      {/* Checkmark list */}
      <rect x="188" y="280" width="20" height="20" rx="4" fill="url(#emp-accent)" opacity="0.12" />
      <path d="M193 290 L197 294 L203 286" stroke="url(#emp-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <rect x="188" y="300" width="20" height="20" rx="4" fill="url(#emp-accent)" opacity="0.08" />
      <rect x="188" y="300" width="12" height="20" rx="4" fill="url(#emp-accent)" opacity="0.12" />

      {/* User avatar circle */}
      <circle cx="330" cy="160" r="30" fill="url(#emp-accent)" opacity="0.08" />
      <circle cx="330" cy="160" r="24" fill="url(#emp-accent)" opacity="0.15" />
      <circle cx="330" cy="151" r="8" fill="#0d9488" opacity="0.3" />
      <ellipse cx="330" cy="170" rx="14" ry="8" fill="#0d9488" opacity="0.2" />

      {/* Decorative dots */}
      <circle cx="120" cy="160" r="3" fill="#14b8a6" opacity="0.15" />
      <circle cx="140" cy="175" r="2" fill="#14b8a6" opacity="0.1" />
      <circle cx="350" cy="330" r="3" fill="#14b8a6" opacity="0.15" />
      <circle cx="370" cy="345" r="2" fill="#14b8a6" opacity="0.1" />
      <circle cx="100" cy="350" r="4" fill="#14b8a6" opacity="0.08" />
      <circle cx="380" cy="130" r="2.5" fill="#14b8a6" opacity="0.12" />

      {/* Floating sparkles */}
      <path d="M145 140 L148 146 L154 148 L148 150 L145 156 L142 150 L136 148 L142 146 Z"
            fill="#14b8a6" opacity="0.15" />
      <path d="M360 290 L362 294 L366 295 L362 296 L360 300 L358 296 L354 295 L358 294 Z"
            fill="#14b8a6" opacity="0.12" />

      {/* Bottom line */}
      <line x1="165" y1="370" x2="315" y2="370" stroke="url(#emp-ring)" strokeWidth="1" strokeDasharray="3 4" opacity="0.1" />

      {/* Gradients */}
      <defs>
        <radialGradient id="emp-glow" cx="50%" cy="50%" r="50%">
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#14b8a6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="emp-ring" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#14b8a6" stopOpacity="0.25" />
          <stop offset="1" stopColor="#0d9488" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="emp-card" x1="175" y1="195" x2="305" y2="325">
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id="emp-card-bg" x1="180" y1="200" x2="300" y2="320">
          <stop stopColor="#14b8a6" stopOpacity="0.06" />
          <stop offset="1" stopColor="#0d9488" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="emp-accent" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Hero illustration for the role selection page ── */
export function HeroIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 560 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background shapes */}
      <circle cx="280" cy="200" r="180" fill="url(#hero-glow)" opacity="0.08" />
      <circle cx="280" cy="200" r="150" stroke="url(#hero-ring)" strokeWidth="1" opacity="0.12" />

      {/* Three floating nodes representing the 3 roles */}
      {/* Admin node - top */}
      <g>
        <circle cx="280" cy="95" r="42" fill="url(#hero-admin)" opacity="0.1" />
        <circle cx="280" cy="95" r="33" fill="url(#hero-admin)" opacity="0.18" />
        <rect x="268" y="90" width="24" height="20" rx="4" fill="url(#hero-admin-solid)" opacity="0.6" />
        <path d="M274 103 V100 C274 97 276.5 95 280 95 C283.5 95 286 97 286 100 V103"
              stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <circle cx="280" cy="107" r="2.5" fill="#ffffff" opacity="0.8" />
      </g>

      {/* Manager node - bottom left */}
      <g>
        <circle cx="170" cy="270" r="42" fill="url(#hero-manager)" opacity="0.1" />
        <circle cx="170" cy="270" r="33" fill="url(#hero-manager)" opacity="0.18" />
        <circle cx="170" cy="263" r="9" fill="#ffffff" opacity="0.6" />
        <path d="M158 285 C158 277 163.5 272 170 272 C176.5 272 182 277 182 285"
              fill="#ffffff" opacity="0.5" />
        <path d="M170 255 L172.5 260 L178 261 L174 265 L175 271 L170 268 L165 271 L166 265 L162 261 L167.5 260 Z"
              fill="#fbbf24" opacity="0.8" />
      </g>

      {/* Employee node - bottom right */}
      <g>
        <circle cx="390" cy="270" r="42" fill="url(#hero-employee)" opacity="0.1" />
        <circle cx="390" cy="270" r="33" fill="url(#hero-employee)" opacity="0.18" />
        <circle cx="390" cy="262" r="9" fill="#ffffff" opacity="0.6" />
        <path d="M378 285 C378 276 383.5 271 390 271 C396.5 271 402 276 402 285"
              fill="#ffffff" opacity="0.5" />
        {/* Checkmark */}
        <circle cx="400" cy="256" r="8" fill="#10b981" opacity="0.6" />
        <path d="M397 256 L399.5 258.5 L403 254" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Connecting lines */}
      <path d="M280 137 L170 228" stroke="url(#hero-ring)" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.18" />
      <path d="M280 137 L390 228" stroke="url(#hero-ring)" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.18" />
      <path d="M212 270 L348 270" stroke="url(#hero-ring)" strokeWidth="1" strokeDasharray="3 5" opacity="0.1" />

      {/* Orbiting dots */}
      <circle cx="335" cy="125" r="3" fill="#4795FE" opacity="0.3" />
      <circle cx="225" cy="125" r="2" fill="#f59e0b" opacity="0.3" />
      <circle cx="280" cy="55" r="2.5" fill="#14b8a6" opacity="0.3" />
      <circle cx="130" cy="200" r="2" fill="#4795FE" opacity="0.2" />
      <circle cx="430" cy="200" r="2.5" fill="#14b8a6" opacity="0.2" />

      {/* Bottom decorative wave */}
      <path d="M0 380 Q140 350 280 370 Q420 390 560 365 V400 H0 Z"
            fill="url(#hero-wave)" opacity="0.05" />

      <defs>
        <radialGradient id="hero-glow" cx="50%" cy="50%" r="50%">
          <stop stopColor="#4795FE" />
          <stop offset="1" stopColor="#4795FE" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-ring" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#4795FE" stopOpacity="0.25" />
          <stop offset="1" stopColor="#6366f1" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="hero-admin" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#4795FE" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <radialGradient id="hero-admin-solid" cx="50%" cy="50%" r="50%">
          <stop stopColor="#4795FE" />
          <stop offset="1" stopColor="#3b82f6" />
        </radialGradient>
        <linearGradient id="hero-manager" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f59e0b" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="hero-employee" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id="hero-wave" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#4795FE" />
          <stop offset="0.5" stopColor="#6366f1" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
