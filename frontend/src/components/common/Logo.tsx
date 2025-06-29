import React from "react";

const Logo: React.FC = () => (
  <div className="flex items-center gap-3">
    <div className="text-3xl animate-float">🎮</div>
    <div>
      <h1 
        className="text-2xl font-bold gradient-text-primary"
        style={{
          color: 'var(--logo-text)',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 50%, var(--primary) 100%)',
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