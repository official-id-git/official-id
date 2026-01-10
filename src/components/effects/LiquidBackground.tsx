import React from 'react';

interface LiquidBackgroundProps {
  colors: string[];
  className?: string;
}

export const LiquidBackground: React.FC<LiquidBackgroundProps> = ({ colors, className = '' }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Animated gradient blobs */}
      <div 
        className="absolute w-full h-full animate-liquid-1"
        style={{
          background: `radial-gradient(circle at 20% 50%, ${colors[0]} 0%, transparent 50%)`,
        }}
      />
      <div 
        className="absolute w-full h-full animate-liquid-2"
        style={{
          background: `radial-gradient(circle at 80% 80%, ${colors[1]} 0%, transparent 50%)`,
        }}
      />
      <div 
        className="absolute w-full h-full animate-liquid-3"
        style={{
          background: `radial-gradient(circle at 40% 40%, ${colors[2] || colors[0]} 0%, transparent 50%)`,
        }}
      />
      
      {/* Base gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
          opacity: 0.7,
        }}
      />
      
      {/* Animated wave overlay */}
      <svg 
        className="absolute bottom-0 w-full h-32 animate-wave" 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path 
          fill="rgba(255,255,255,0.1)" 
          fillOpacity="1" 
          d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,128C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
    </div>
  );
};
