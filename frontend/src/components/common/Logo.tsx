import React from "react";

const Logo: React.FC = () => (
  <div className="flex items-center gap-3">
    <div className="text-3xl animate-float">🎮</div>
    <div>
      <h1 
        className="text-2xl font-samarkan font-bold"
        style={{
          color: 'var(--logo-text)',
          background: 'linear-gradient(135deg, var(--header-accent, var(--accent)) 0%, #FFD700 50%, var(--header-accent, var(--accent)) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          backgroundSize: '200% 200%',
        }}
      >
        Sanskrit Shabd Samvad
      </h1>
      <p 
        className="text-xs"
        style={{ color: 'var(--subtitle-text)' }}
      >
        Interactive Team Quiz Game
      </p>
    </div>
  </div>
);

export default Logo;