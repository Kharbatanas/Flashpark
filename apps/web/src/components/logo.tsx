'use client';

const BRAND = {
  primary: '#06B6D4',
  dark: '#0A0A0A',
  light: '#F0F9FF',
} as const;

const SIZE_MAP = {
  sm: { icon: 20, text: 16 },
  md: { icon: 28, text: 20 },
  lg: { icon: 40, text: 32 },
} as const;

/**
 * Flashpark icon mark — location pin with "P" and lightning bolt accent.
 * Works standalone for favicons, app icons, and loading states.
 */
export function LogoIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Flashpark icon"
    >
      {/* Pin body */}
      <path
        d="M32 2C18.745 2 8 12.745 8 26c0 18 24 36 24 36s24-18 24-36C56 12.745 45.255 2 32 2Z"
        fill={BRAND.primary}
      />
      {/* Inner circle cutout for depth */}
      <circle cx="32" cy="26" r="16" fill="#fff" opacity="0.15" />
      {/* P letterform — geometric, bold */}
      <path
        d="M25 16v20h5V31h4c5.523 0 10-3.582 10-8s-4.477-7-10-7H25Zm5 4.5h4c2.761 0 5 1.343 5 3s-2.239 3-5 3h-4v-6Z"
        fill="#fff"
      />
      {/* Lightning bolt accent — small, top-right of pin */}
      <path
        d="M42 8l-4 7h3l-2 6 5-8h-3.5L42 8Z"
        fill={BRAND.light}
        opacity="0.9"
      />
    </svg>
  );
}

/**
 * Full Flashpark logo — icon mark + wordmark.
 * "flash" in dark/light color, "park" in brand cyan.
 */
export function Logo({
  size = 'md',
  variant = 'dark',
}: {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
}) {
  const { icon, text } = SIZE_MAP[size];
  const textColor = variant === 'dark' ? BRAND.dark : BRAND.light;
  const gap = Math.round(icon * 0.25);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${gap}px`,
      }}
    >
      <LogoIcon size={icon} />
      <svg
        height={text}
        viewBox="0 0 220 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="flashpark"
      >
        {/* "flash" */}
        <text
          x="0"
          y="38"
          fontFamily="'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
          fontWeight="700"
          fontSize="42"
          letterSpacing="-1"
          fill={textColor}
        >
          flash
        </text>
        {/* "park" */}
        <text
          x="112"
          y="38"
          fontFamily="'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
          fontWeight="700"
          fontSize="42"
          letterSpacing="-1"
          fill={BRAND.primary}
        >
          park
        </text>
      </svg>
    </span>
  );
}
