import React from "react";
import Logo from "../common/Logo";

interface HeaderProps {
  gameCode?: string;
  timer?: string;
}

const Header: React.FC<HeaderProps> = ({ gameCode, timer }) => {
  return (
    <header className="glass-card p-4 mb-6 sticky top-0 z-50 backdrop-blur-md">
      <div className="container mx-auto flex justify-between items-center">
        <Logo />

        {gameCode && (
          <div className="text-center">
            <div className="text-sm text-slate-400">Game Code</div>
            <div className="text-2xl font-mono font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {gameCode}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          {timer && (
            <div className="timer-display">
              <span className="text-sm text-slate-400">Time</span>
              <span className="text-xl font-bold ml-2">{timer}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
