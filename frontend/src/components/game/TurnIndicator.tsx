import React from "react";
import { Team, Question } from "../../types";

interface TurnIndicatorProps {
  currentTeam: "team1" | "team2" | null;
  teams: Team[];
  currentQuestion: Question | null;
  questionsAnswered: { team1: number; team2: number };
  round: number;
  variant?: "compact" | "full";
}

const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  currentTeam,
  teams,
  currentQuestion,
  questionsAnswered,
  round,
  variant = "full",
}) => {
  if (!currentTeam || !currentQuestion) {
    return null;
  }

  const activeTeam = teams.find((t) => t.active);
  const waitingTeam = teams.find((t) => !t.active);

  const currentTeamQuestionsAnswered = questionsAnswered[currentTeam];
  const questionNumber = currentTeamQuestionsAnswered + 1;

  if (variant === "compact") {
    return (
      <div className="glass-card p-3 mb-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
        <div className="text-center">
          <h3 className="text-lg font-bold text-blue-300 mb-1">
            🎯 {activeTeam?.name}'s Turn
          </h3>
          <p className="text-sm text-slate-300">
            Question {questionNumber} of 3 • Round {round}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {waitingTeam?.name} is waiting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 mb-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="text-3xl animate-pulse">🎯</div>
          <h2 className="text-2xl font-bold text-blue-300">
            {activeTeam?.name}'s Turn
          </h2>
          <div className="text-3xl animate-pulse">🎯</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="text-lg font-semibold text-slate-300">Round</div>
            <div className="text-2xl font-bold text-orange-400">{round}</div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="text-lg font-semibold text-slate-300">Question</div>
            <div className="text-2xl font-bold text-blue-400">
              {questionNumber} of 3
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-3">
            <div className="text-lg font-semibold text-slate-300">Category</div>
            <div className="text-lg font-bold text-purple-400">
              {currentQuestion.category}
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-400">
          {waitingTeam?.name} will answer after {activeTeam?.name} completes
          their 3 questions
        </div>

        {/* Progress Bar for Current Team */}
        <div className="mt-4">
          <div className="text-xs text-slate-400 mb-2">
            {activeTeam?.name} Progress
          </div>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3].map((qNum) => (
              <div
                key={qNum}
                className={`w-4 h-4 rounded-full ${
                  qNum <= currentTeamQuestionsAnswered
                    ? "bg-green-500"
                    : qNum === questionNumber
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-slate-600"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurnIndicator;
