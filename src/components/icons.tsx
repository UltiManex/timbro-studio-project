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

export const ToneIcon = ({ tone, className, ...props }: { tone: 'Comedic' | 'Dramatic' | 'Suspenseful' | 'Inspirational' | 'User' } & SVGProps<SVGSVGElement>) => {
  const iconMap = {
    Comedic: '😂',
    Dramatic: '🎭',
    Suspenseful: '🤫',
    Inspirational: '✨',
    User: '⭐',
  };
  
  // Props might include width/height from className, which Tailwind will apply.
  // If not, SVG defaults to its intrinsic size or needs explicit width/height.
  // Using a viewBox allows scaling. Font size inside SVG text is relative to this viewBox.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20" // A common viewBox for small icons
      fill="currentColor" // Inherit text color for the emoji
      className={className} // Apply passed className for sizing (h-5 w-5 etc.) and other styles
      // Default width/height can be set here if needed, but className usually handles it
      // width={props.width || "20"} 
      // height={props.height || "20"}
      {...props} // Spread other SVG props like onClick
    >
      <text 
        x="50%" 
        y="50%" 
        dominantBaseline="central" 
        textAnchor="middle" 
        fontSize="14" // Adjust font size to fit well within the 20x20 viewBox
      >
        {iconMap[tone]}
      </text>
    </svg>
  );
};
