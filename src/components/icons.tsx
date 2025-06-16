import { SVGProps } from 'react';

export const Logo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 50"
    width="120"
    height="30"
    role="img"
    aria-label="Timbro Logo"
    {...props}
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <text
      x="10"
      y="35"
      fontFamily="Inter, sans-serif"
      fontSize="30"
      fontWeight="bold"
      fill="url(#logoGradient)"
    >
      Timbro
    </text>
  </svg>
);

export const MagicWandIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 4V2" />
    <path d="M15 10V8" />
    <path d="M10.29 7.24 9 6" />
    <path d="M15 6h-2" />
    <path d="M21 10h-2" />
    <path d="M18.71 12.76 17.5 14" />
    <path d="m18 22-3-3" />
    <path d="m6 8-3-3" />
    <path d="M3 3v3h3" />
    <path d="M14.5 5.5 19 10l-2.86 2.86a2 2 0 0 1-2.83 0L10 9.5l-1.57 1.57A2 2 0 0 1 5.6 11L3 8.4V3H2v11l3.5-3.5L9 11l.5-8.5L3 3" />
  </svg>
);

export const TrustBadgeIcon = (props: SVGProps<SVGSVGElement>) => (
 <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2L3.5 5.5v5c0 4.42 3.58 8 8.5 8s8.5-3.58 8.5-8v-5L12 2z" />
    <polyline points="7 12 10 15 17 8" />
  </svg>
);

export const ToneIcon = ({ tone, ...props }: { tone: 'Comedic' | 'Dramatic' | 'Suspenseful' | 'Inspirational' | 'User' } & SVGProps<SVGSVGElement>) => {
  const iconMap = {
    Comedic: '😂',
    Dramatic: '🎭',
    Suspenseful: '🤫',
    Inspirational: '✨',
    User: '⭐',
  };
  return (
    <text fontSize="18" x="2" y="18" {...props}>
      {iconMap[tone]}
    </text>
  );
};
