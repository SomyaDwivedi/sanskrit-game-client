import React, { useEffect } from "react";
import { RoundSummary, Team } from "../../types";
import AnimatedCard from "../common/AnimatedCard";
import Button from "../common/Button";
import confetti from "canvas-confetti";

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
  const team1Score = teamScores.team1.roundScore;
  const team2Score = teamScores.team2.roundScore;
  const roundWinner =
    team1Score > team2Score
      ? teamScores.team1
      : team2Score > team1Score
      ? teamScores.team2
      : null;

  useEffect(() => {
    if ((!isGameFinished && roundWinner) || isGameFinished) {
      const duration = 1800;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;
      const interval: NodeJS.Timeout = setInterval(function () {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 40 * (timeLeft / duration);
        confetti(
          Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.4, 0.6) },
            colors: ["#f5c800", "#b33131", "#f39800"],
          })
        );
        confetti(
          Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.4, 0.6) },
            colors: ["#f5c800", "#b33131", "#f39800"],
          })
        );
      }, 250);
      return () => clearInterval(interval);
    }
  }, [isGameFinished, roundWinner]);

  return (
    <AnimatedCard>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-slate-200">
          {/* Header */}
          <div className="mb-6">
            <span className="text-5xl mb-2 block">🏆</span>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              {isGameFinished ? "Final Results" : `Round ${round} Summary`}
            </h2>
            {roundWinner && !isGameFinished && (
              <p className="text-lg text-yellow-600 font-semibold">
                {roundWinner.teamName} wins this round!
              </p>
            )}
          </div>

          {/* Team Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[teamScores.team1, teamScores.team2].map((team, idx) => {
              const isWinner =
                !isGameFinished &&
                ((idx === 0 && team1Score > team2Score) ||
                  (idx === 1 && team2Score > team1Score));
              return (
                <div
                  key={team.teamName}
                  className={`rounded-lg border p-4 bg-slate-50 ${
                    isWinner
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <h3 className="text-xl font-semibold text-slate-700">
                      {team.teamName}
                    </h3>
                    {isWinner && (
                      <span className="ml-2 text-yellow-500 text-xl">👑</span>
                    )}
                  </div>
                  <div className="mb-2">
                    <span className="text-sm text-slate-500">Round Points:</span>
                    <span className="ml-2 text-lg font-bold text-green-600">
                      +{team.roundScore}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Total Score:</span>
                    <span className="ml-2 text-lg font-bold text-orange-600">
                      {team.totalScore}
                    </span>
                  </div>
                  {/* Members */}
                  <div className="mt-3 flex flex-wrap gap-1 justify-center">
                    {teams
                      .find((t) => t.name === team.teamName)
                      ?.members.filter((m) => m.trim() !== "")
                      .map((member, i) => (
                        <span
                          key={i}
                          className="text-xs bg-slate-200 px-2 py-1 rounded-full border border-slate-300"
                        >
                          {member}
                        </span>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current Leader */}
          {!isGameFinished && (
            <div className="mb-4 p-3 rounded bg-slate-100 border border-slate-200">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-xl">🥇</span>
                <span className="text-base font-medium text-slate-700">Current Leader</span>
              </div>
              <span className="text-lg font-bold text-blue-700">
                {teamScores.team1.totalScore > teamScores.team2.totalScore
                  ? `${teamScores.team1.teamName} (${teamScores.team1.totalScore} pts)`
                  : teamScores.team2.totalScore > teamScores.team1.totalScore
                  ? `${teamScores.team2.teamName} (${teamScores.team2.totalScore} pts)`
                  : "It's a tie!"}
              </span>
            </div>
          )}

          {/* Final Winner */}
          {isGameFinished && (
            <div className="mb-4 p-4 rounded bg-yellow-50 border border-yellow-300">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">🏆</span>
                <span className="text-xl font-bold text-yellow-700">Game Winner</span>
                <span className="text-2xl">🏆</span>
              </div>
              <span className="text-xl font-bold text-orange-700 block mt-2">
                {teamScores.team1.totalScore > teamScores.team2.totalScore
                  ? `${teamScores.team1.teamName}!`
                  : teamScores.team2.totalScore > teamScores.team1.totalScore
                  ? `${teamScores.team2.teamName}!`
                  : "It's a Tie!"}
              </span>
              {teamScores.team1.totalScore !== teamScores.team2.totalScore && (
                <span className="text-base mt-1 text-slate-600 block">
                  Final Score: {Math.max(teamScores.team1.totalScore, teamScores.team2.totalScore)} pts
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center mt-4">
            {isHost && !isGameFinished && round < 3 && onContinueToNextRound && (
              <Button
                onClick={onContinueToNextRound}
                variant="primary"
                size="lg"
                icon={<span className="text-xl">🚀</span>}
              >
                Next Round
              </Button>
            )}
            {isGameFinished && onBackToHome && (
              <Button
                onClick={onBackToHome}
                variant="secondary"
                size="lg"
                icon={<span className="text-xl">🏠</span>}
              >
                Home
              </Button>
            )}
            {!isHost && (
              <div className="text-base text-slate-400">
                {isGameFinished ? "Thanks for playing!" : "Waiting for host..."}
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          {!isGameFinished && (
            <div className="mt-6">
              <div className="text-xs text-slate-400 mb-1">Game Progress</div>
              <div className="flex justify-center space-x-3">
                {[1, 2, 3].map((roundNum) => (
                  <div key={roundNum} className="relative">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                        roundNum < round
                          ? "bg-green-500 text-white"
                          : roundNum === round
                          ? "bg-yellow-400 text-white"
                          : "bg-slate-300 text-slate-500"
                      }`}
                    >
                      {roundNum}
                    </div>
                    {roundNum < 3 && (
                      <div
                        className={`absolute top-1/2 -right-3 w-2 h-0.5 transform -translate-y-1/2 ${
                          roundNum < round ? "bg-green-500" : "bg-slate-300"
                        }`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-xs text-slate-500 mt-2">
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
