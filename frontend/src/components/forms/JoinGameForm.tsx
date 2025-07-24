import React from "react";
import { Link } from "react-router-dom";
import AnimatedCard from "../common/AnimatedCard";
import Button from "../common/Button";
import Input from "../common/Input";
import { ROUTES } from "../../utils/constants";

interface JoinGameFormProps {
  gameCode: string;
  playerName: string;
  onGameCodeChange: (value: string) => void;
  onPlayerNameChange: (value: string) => void;
  onJoinGame: () => void;
  isLoading: boolean;
  error?: string;
}

const JoinGameForm: React.FC<JoinGameFormProps> = ({
  gameCode,
  onGameCodeChange,
  onPlayerNameChange,
  onJoinGame,
  isLoading,
  error,
}) => {
  const playerName = localStorage.getItem("username") || "Player";
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    localStorage.setItem("playerName", playerName);
    if (e.key === "Enter") {
      onJoinGame();
    }
  };

  return (
    <AnimatedCard>
      <div className="max-w-md mx-auto">
        <div className="glass-card p-8 text-center">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4 flex items-center justify-center text-white text-4xl">
              🎮
            </div>
            <p className="text-lg text-slate-300 mb-4">
              Ready to join the competition?
            </p>
            <p className="text-slate-400">
              Enter the game code below to join as <strong>{playerName}</strong>
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-8">
            <Input
              id="gameCode"
              value={gameCode}
              onChange={(e) => onGameCodeChange(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="Enter 6-digit code"
              label="Game Code"
              variant="center"
              maxLength={6}
              disabled={isLoading}
            />

            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your name"
              label="Your Name"
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={onJoinGame}
            disabled={isLoading || !gameCode.trim() || !playerName.trim()}
            variant="success"
            size="xl"
            loading={isLoading}
            icon={!isLoading ? <span className="text-2xl">🚀</span> : undefined}
            className="mb-6"
          >
            {isLoading ? "Joining..." : "JOIN GAME"}
          </Button>

          <div className="mt-6">
            <Link
              to={ROUTES.PLAYERHOME}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
};

export default JoinGameForm;
