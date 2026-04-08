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
      <path
        d="M10 28.5L32 10L54 28.5V51C54 53.2091 52.2091 55 50 55H14C11.7909 55 10 53.2091 10 51V28.5Z"
        fill="currentColor"
      />
      <path d="M24 40L32 34L40 40V50H24V40Z" fill="white" fillOpacity="0.95" />
      <path d="M16.5 43H25.5V52H16.5V43Z" fill="white" fillOpacity="0.95" />
      <path d="M38.5 43H47.5V52H38.5V43Z" fill="white" fillOpacity="0.95" />
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
