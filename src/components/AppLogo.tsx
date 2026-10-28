import React, { useState } from 'react';

interface AppLogoProps {
  className?: string;
  alt?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = 'w-20 h-20',
  alt = 'Logo Officiel FAAB BUD'
}) => {
  const [srcIndex, setSrcIndex] = useState(0);
  const sources = [
    './assets/aistudio/logo_faab_bud_1012d3d3.png?v=7',
    './logo.png?v=7',
    './favicon.png?v=7'
  ];

  if (srcIndex < sources.length) {
    return (
      <img
        src={sources[srcIndex]}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setSrcIndex(prev => prev + 1)}
        className={`${className} object-contain shrink-0 select-none drop-shadow-md bg-transparent`}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 240"
      fill="none"
      className={`${className} shrink-0 select-none drop-shadow-md`}
      role="img"
      aria-label={alt}
    >
      <rect x="6" y="28" width="228" height="206" rx="32" fill="#4c1d95" />
      <rect x="26" y="88" width="188" height="122" rx="14" fill="#FFFFFF" />
      <text
        x="120"
        y="162"
        fontFamily="Plus Jakarta Sans, Arial Black, sans-serif"
        fontSize="36"
        fontWeight="900"
        fill="#4c1d95"
        textAnchor="middle"
      >
        FAAB BUD
      </text>
    </svg>
  );
};
