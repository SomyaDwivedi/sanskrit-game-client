import React from "react";
import { RoundSummary, Team } from "../../types";
import AnimatedCard from "../common/AnimatedCard";
import Button from "../common/Button";

interface RoundSummaryProps {
  roundSummary: RoundSummary;
  teams: Team[];
  isHost?: boolean;
  isGameFinished?: boolean;
  onContinueToNextRound?: () => void;
  onBackToHome?: () => void;
}

const RoundSummaryComponent: React.FC<RoundSummaryProps> = ({
  roundSummary,
  teams,
  isHost = false,
  isGameFinished = false,
  onContinueToNextRound,
  onBackToHome,
}) => {
  const { round, teamScores } = roundSummary;
  
  // Determine round winner
  const team1Score = teamScores.team1.roundScore;
  const team2Score = teamScores.team2.roundScore;
  const roundWinner = team1Score > team2Score ? teamScores.team1 : 
                     team2Score > team1Score ? teamScores.team2 : null;

  return (
    <AnimatedCard>
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-8 text-center">
          {/* Round Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-2">
              {isGameFinished ? "🏆 FINAL RESULTS 🏆" : `📊 Round ${round} Summary`}
            </h2>
            {roundWinner && !isGameFinished && (
              <p className="text-xl text-yellow-400 font-semibold">
                🎉 {roundWinner.teamName} wins Round {round}!
              </p>
            )}
          </div>

          {/* Team Scores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Team 1 */}
            <div className={`glass-card p-6 ${
              team1Score > team2Score && !isGameFinished
                ? "border-yellow-400/50 bg-yellow-400/10"
                : ""
            }`}>
              <h3 className="text-2xl font-bold mb-4">{teamScores.team1.teamName}</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg">Round {round} Points:</span>
                  <span className="text-2xl font-bold text-green-400">
                    +{team1Score}
                  </span>
                </div>
                
                <div className="border-t border-slate-400 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Score:</span>
                    <span className="text-3xl font-bold text-orange-400">
                      {teamScores.team1.totalScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Team member badges */}
              <div className="mt-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  {teams.find(t => t.name === teamScores.team1.teamName)?.members
                    .filter(member => member.trim() !== "")
                    .map((member, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-700 px-2 py-1 rounded"
                      >
                        {member}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            {/* Team 2 */}
            <div className={`glass-card p-6 ${
              team2Score > team1Score && !isGameFinished
                ? "border-yellow-400/50 bg-yellow-400/10"
                : ""
            }`}>
              <h3 className="text-2xl font-bold mb-4">{teamScores.team2.teamName}</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg">Round {round} Points:</span>
                  <span className="text-2xl font-bold text-green-400">
                    +{team2Score}
                  </span>
                </div>
                
                <div className="border-t border-slate-400 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Score:</span>
                    <span className="text-3xl font-bold text-orange-400">
                      {teamScores.team2.totalScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Team member badges */}
              <div className="mt-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  {teams.find(t => t.name === teamScores.team2.teamName)?.members
                    .filter(member => member.trim() !== "")
                    .map((member, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-700 px-2 py-1 rounded"
                      >
                        {member}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Current Game Leader */}
          {!isGameFinished && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg">
              <h4 className="text-lg font-semibold mb-2">🥇 Current Game Leader</h4>
              <p className="text-xl">
                {teamScores.team1.totalScore > teamScores.team2.totalScore
                  ? `${teamScores.team1.teamName} (${teamScores.team1.totalScore} points)`
                  : teamScores.team2.totalScore > teamScores.team1.totalScore
                  ? `${teamScores.team2.teamName} (${teamScores.team2.totalScore} points)`
                  : "It's a tie!"
                }
              </p>
            </div>
          )}

          {/* Final Winner */}
          {isGameFinished && (
            <div className="mb-6 p-6 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-lg border-2 border-yellow-400/50">
              <h4 className="text-2xl font-bold mb-2">🏆 GAME WINNER 🏆</h4>
              <p className="text-3xl font-bold">
                {teamScores.team1.totalScore > teamScores.team2.totalScore
                  ? `${teamScores.team1.teamName}!`
                  : teamScores.team2.totalScore > teamScores.team1.totalScore
                  ? `${teamScores.team2.teamName}!`
                  : "It's a Tie!"
                }
              </p>
              {teamScores.team1.totalScore !== teamScores.team2.totalScore && (
                <p className="text-lg mt-2 text-slate-300">
                  Final Score: {Math.max(teamScores.team1.totalScore, teamScores.team2.totalScore)} points
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            {isHost && !isGameFinished && round < 3 && onContinueToNextRound && (
              <Button
                onClick={onContinueToNextRound}
                variant="primary"
                size="xl"
                icon={<span className="text-2xl">➡️</span>}
              >
                Continue to Round {round + 1}
              </Button>
            )}

            {isGameFinished && onBackToHome && (
              <Button
                onClick={onBackToHome}
                variant="secondary"
                size="lg"
                icon={<span className="text-xl">🏠</span>}
              >
                Back to Home
              </Button>
            )}

            {!isHost && (
              <div className="text-lg text-slate-400">
                {isGameFinished 
                  ? "Thanks for playing!" 
                  : "Waiting for host to continue..."
                }
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          {!isGameFinished && (
            <div className="mt-8">
              <div className="text-sm text-slate-400 mb-2">Game Progress</div>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3].map((roundNum) => (
                  <div
                    key={roundNum}
                    className={`w-4 h-4 rounded-full ${
                      roundNum <= round
                        ? "bg-green-500"
                        : roundNum === round + 1
                        ? "bg-yellow-500"
                        : "bg-slate-600"
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Round {round} of 3 Complete
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimatedCard>
  );
};

export default RoundSummaryComponent;