import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 40, showText = true }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1A73E8" />
            <stop offset="100%" stopColor="#00C6FF" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Background Board Shape - Rounded Square with subtle shadow */}
        <rect
          x="10"
          y="10"
          width="80"
          height="80"
          rx="20"
          fill="white"
          stroke="url(#waveGradient)"
          strokeWidth="6"
          className="dark:fill-dark-surface"
        />

        {/* The Wave - Dynamic Pulse */}
        <path
          d="M 25 50 
             Q 35 25, 45 50 
             T 65 50 
             T 85 50"
          stroke="url(#waveGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        >
          <animate
            attributeName="d"
            dur="3s"
            repeatCount="indefinite"
            values="
              M 25 50 Q 35 25, 45 50 T 65 50 T 85 50;
              M 25 50 Q 35 75, 45 50 T 65 50 T 85 50;
              M 25 50 Q 35 25, 45 50 T 65 50 T 85 50
            "
          />
        </path>

        {/* Small dots representing particles/data */}
        <circle cx="75" cy="35" r="4" fill="#00C6FF" opacity="0.8">
           <animate attributeName="cy" values="35;30;35" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="35" cy="65" r="3" fill="#1A73E8" opacity="0.6">
           <animate attributeName="cy" values="65;70;65" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </svg>
      
      {showText && (
        <span className={`font-bold tracking-tight text-gray-900 dark:text-white`} style={{ fontSize: size * 0.7 }}>
          Board<span className="text-primary">Wave</span>
        </span>
      )}
    </div>
  );
};
