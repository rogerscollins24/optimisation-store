type IconProps = {
  className?: string;
  size?: number;
};

export function BrandHomeIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="brand-cart-neon" x1="14" y1="16" x2="53" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffbe9f" />
          <stop offset="0.48" stopColor="#ff6a38" />
          <stop offset="1" stopColor="#ff3b1a" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="14" fill="#220806" stroke="#ff8c61" strokeOpacity="0.28" />
      <g stroke="url(#brand-cart-neon)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 18h8c1.8 0 3.3 1.2 3.7 2.9l3.5 17.2c0.5 2.4 2.7 4.1 5.2 4.1h11" />
        <path d="M29 26h19" />
        <path d="M31 32.5h16" />
        <path d="M32.6 38.8h13.4" />
        <circle cx="34.5" cy="48.2" r="4.2" />
        <circle cx="46.3" cy="48.2" r="4.2" />
      </g>
    </svg>
  );
}

export function ShipWheelIcon({ className, size = 30 }: IconProps) {
  const spokes = [0, 45, 90, 135];

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="19" stroke="#8B5A2B" strokeWidth="4" fill="#D7A15F" fillOpacity="0.28" />
      <circle cx="32" cy="32" r="7" fill="#E7BF82" stroke="#8B5A2B" strokeWidth="2.5" />
      {spokes.map((angle) => {
        const radians = (angle * Math.PI) / 180;
        const x = Math.cos(radians) * 18;
        const y = Math.sin(radians) * 18;
        const outerX = Math.cos(radians) * 27;
        const outerY = Math.sin(radians) * 27;

        return (
          <g key={angle}>
            <line
              x1={32 - x}
              y1={32 - y}
              x2={32 + x}
              y2={32 + y}
              stroke="#8B5A2B"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx={32 + outerX} cy={32 + outerY} r="3.2" fill="#C88A42" stroke="#8B5A2B" strokeWidth="1.4" />
            <circle cx={32 - outerX} cy={32 - outerY} r="3.2" fill="#C88A42" stroke="#8B5A2B" strokeWidth="1.4" />
          </g>
        );
      })}
    </svg>
  );
}
