import React from "react";

const Logo: React.FC = () => (
  <div className="flex items-center gap-3">
    <div className="text-3xl animate-float">🎮</div>
    <div>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
        Sanskrit Shabd Samvad
      </h1>
      <p className="text-xs text-slate-400">Interactive Team Quiz Game</p>
    </div>
  </div>
);

export default Logo;
