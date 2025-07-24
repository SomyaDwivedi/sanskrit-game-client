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
const role = localStorage.getItem("role");
const GameResults: React.FC<GameResultsProps> = ({
  teams,
  onCreateNewGame,
  showCreateNewGame = false,
}) => {
  // Calculate round winners
  const getRoundWinner = (roundIndex: number) => {
    const team1Score = teams[0].roundScores[roundIndex] || 0;
    const team2Score = teams[1].roundScores[roundIndex] || 0;
    
    if (team1Score > team2Score) return 0; // Team 1 wins
    if (team2Score > team1Score) return 1; // Team 2 wins
    return 'tie'; // Tie
  };

  // Calculate final winner
  const getFinalWinner = () => {
    const team1Total = teams[0].score;
    const team2Total = teams[1].score;
    
    if (team1Total > team2Total) return 0; // Team 1 wins
    if (team2Total > team1Total) return 1; // Team 2 wins
    return 'tie'; // Tie
  };

  const finalWinner = getFinalWinner();

  return (
    <AnimatedCard>
      <div className="max-w-6xl mx-auto">
        <div className="glass-card p-12 text-center">
          {/* FINAL CHAMPION DISPLAY AT TOP */}
          <div className="mb-12">
            <div className="text-6xl mb-4 animate-float">🏆</div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent animate-celebration">
              FINAL RESULTS
            </h1>
            
            {finalWinner === 'tie' ? (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black p-6 rounded-2xl mb-4">
                <h2 className="text-4xl font-bold mb-2">🏆 IT'S A TIE! 🏆</h2>
                <div className="flex justify-center items-center gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{teams[0].name}</div>
                    <div className="text-xl">{teams[0].score} points</div>
                  </div>
                  <div className="text-3xl">👑</div>
                  <div className="text-3xl">👑</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{teams[1].name}</div>
                    <div className="text-xl">{teams[1].score} points</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black p-6 rounded-2xl mb-4">
                <h2 className="text-4xl font-bold mb-2">🏆 WINNER 🏆</h2>
                <p className="text-3xl font-bold">{teams[finalWinner].name}</p>
                <p className="text-xl mt-2">Final Score: {teams[finalWinner].score} points</p>
              </div>
            )}
          </div>

          {/* DETAILED TEAM SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {teams
              .sort((a, b) => b.score - a.score)
              .map((team, index) => {
                const isWinner = finalWinner !== 'tie' && index === 0;
                const isTie = finalWinner === 'tie';
                
                return (
                  <div
                    key={team.id}
                    className={`glass-card p-6 ${
                      isWinner || isTie
                        ? "border-yellow-400/50 bg-yellow-400/10"
                        : ""
                    }`}
                  >
                    <div className="text-center">
                      <h3 className="text-2xl font-semibold mb-2 flex items-center justify-center gap-2">
                        {team.name}
                        {(isWinner || isTie) && (
                          <span className="text-yellow-500 text-2xl">👑</span>
                        )}
                      </h3>
                      
                      <div className="text-3xl font-bold mb-4 text-yellow-400">
                        {team.score} points
                      </div>

                      {/* Round breakdown for this team */}
                      <div className="space-y-2 mb-4">
                        {[1, 2, 3].map((round) => {
                          const roundIndex = round - 1;
                          const roundScore = team.roundScores[roundIndex] || 0;
                          const roundWinner = getRoundWinner(roundIndex);
                          const wonRound = (teams.indexOf(team) === 0 && roundWinner === 0) || 
                                         (teams.indexOf(team) === 1 && roundWinner === 1);
                          // Only show crown if there's a clear winner (not a tie)
                          
                          return (
                            <div key={round} className="flex justify-between items-center">
                              <span className="text-sm text-slate-400">Round {round}:</span>
                              <span className={`font-bold ${wonRound ? 'text-yellow-400' : 'text-slate-300'}`}>
                                {roundScore} {wonRound && '👑'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Team members */}
                      <div className="flex flex-wrap gap-1 justify-center">
                        {team.members
                          .filter((member) => member.trim() !== "")
                          .map((member, i) => (
                            <span
                              key={i}
                              className="text-xs bg-slate-700 px-2 py-1 rounded"
                            >
                              {member}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 justify-center">
            <Link to={role === "Host" ? ROUTES.HOSTHOME : ROUTES.PLAYERHOME}>
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