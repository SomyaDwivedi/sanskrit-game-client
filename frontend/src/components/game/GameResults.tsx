import React from "react";
import { Link } from "react-router-dom";
import { Team } from "../../types";
import { getGameWinner } from "../../utils/gameHelper";
import { ROUTES } from "../../utils/constants";
import AnimatedCard from "../common/AnimatedCard";
import Button from "../common/Button";

interface GameResultsProps {
  teams: Team[];
  onCreateNewGame?: () => void;
  showCreateNewGame?: boolean;
}

const GameResults: React.FC<GameResultsProps> = ({
  teams,
  onCreateNewGame,
  showCreateNewGame = false,
}) => {
  const winner = getGameWinner(teams);

  return (
    <AnimatedCard>
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-12 text-center">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black p-8 rounded-2xl mb-8 animate-celebration">
            <h2 className="text-5xl font-bold mb-4">🏆 CHAMPIONS 🏆</h2>
            <p className="text-3xl font-bold">{winner.name}</p>
            <p className="text-xl mt-2">Score: {winner.score}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {teams
              .sort((a, b) => b.score - a.score)
              .map((team, index) => (
                <div
                  key={team.id}
                  className={`glass-card p-6 ${
                    index === 0 ? "border-yellow-400/50 bg-yellow-400/10" : ""
                  }`}
                >
                  <h3 className="text-xl font-semibold mb-2">{team.name}</h3>
                  <p className="text-2xl font-bold mb-1">{team.score}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {team.members.map((member, i) => (
                      <span
                        key={i}
                        className="text-sm bg-slate-700 px-2 py-1 rounded"
                      >
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          <div className="flex gap-4 justify-center">
            {showCreateNewGame && onCreateNewGame && (
              <Button onClick={onCreateNewGame} variant="primary" size="lg">
                Create New Game
              </Button>
            )}

            <Link to={ROUTES.HOME}>
              <Button variant="secondary" size="lg">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
};

export default GameResults;
