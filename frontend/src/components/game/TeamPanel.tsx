import React from "react";
import { Team } from "../../types";
import { getTeamColorClasses } from "../../utils/gameHelper";

interface TeamPanelProps {
  team: Team;
  teamIndex: number;
  isActive?: boolean;
  showMembers?: boolean;
  playerName?: string;
  isPlayerTeam?: boolean;
  currentRound?: number;
  roundScore?: number;
  questionsAnswered?: number;
  questionPoints?: number[]; // Array of points earned for each question [q1, q2, q3]
}

const TeamPanel: React.FC<TeamPanelProps> = ({
  team,
  teamIndex,
  isActive = false,
  showMembers = true,
  playerName,
  isPlayerTeam = false,
  currentRound = 1,
  roundScore = 0,
  questionsAnswered = 0,
  questionPoints = [0, 0, 0], // Default to no points
}) => {
  const colorClasses = getTeamColorClasses(teamIndex);

  return (
    <div
      className={`glass-card p-3 h-full flex flex-col transition-all ${
        isActive ? `${colorClasses.ring} animate-pulse-slow` : ""
      } ${
        isPlayerTeam ? "border-yellow-400/50 bg-yellow-400/10" : ""
      }`}
    >
      {/* Team Name and Round Score (TOP) */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold mb-2 flex items-center justify-center gap-2">
          {team.name}
          {isPlayerTeam && <span className="text-yellow-400">👤</span>}
        </h3>
        {isPlayerTeam && playerName && (
          <div className="text-xs text-yellow-300 mb-2 font-medium">
            {playerName}
          </div>
        )}
        {/* Round Score at the TOP */}
        <div
          className={`text-2xl font-bold mb-1 animate-score ${colorClasses.primary}`}
        >
          {team.currentRoundScore || 0}
        </div>
        <div className="text-xs text-slate-400">Round {currentRound} Points</div>
      </div>

      {/* Team Members (only show if showMembers is true) */}
      {showMembers && team.members && team.members.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-slate-400 mb-2">
            Team Members
          </h4>
          <div className="space-y-1">
            {team.members
              .filter((member) => member.trim() !== "")
              .map((member, idx) => (
                <div
                  key={idx}
                  className="text-xs glass-card p-1 flex items-center gap-1"
                >
                  {idx === 0 && <span className="text-yellow-400">👑</span>}
                  {member}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Active Team Indicator */}
      {isActive && (
        <div className="text-center mb-4">
          <div className="text-xs bg-gray-800 px-2 py-2 rounded-lg border border-gray-600">
            <div className="text-gray-200 font-bold">🎯 YOUR TURN</div>
            <div className="text-gray-300 text-xs mt-1">Question {questionsAnswered + 1} of 3</div>
          </div>
        </div>
      )}

      {/* Push content up and round display to very bottom */}
      <div className="flex-grow"></div>

      {/* Round Display Header - At Bottom */}
      <div className="glass-card p-2 mb-3 bg-gradient-to-r from-red-600/20 to-red-700/20 border-red-500/30 text-center">
        <h4 className="text-sm font-bold text-red-300 mb-1">
          Round {currentRound}
        </h4>
        
        {/* Question Progress Indicators */}
        <div className="flex justify-center gap-1 mb-2">
          {[1, 2, 3].map((questionNum) => (
            <div key={questionNum} className="flex flex-col items-center">
              {/* Question Number Indicator */}
              <div
                className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${
                  questionNum <= questionsAnswered
                    ? "bg-green-500 text-white"
                    : questionNum === questionsAnswered + 1 && isActive
                    ? "bg-yellow-500 text-black animate-pulse"
                    : "bg-gray-600 text-gray-300"
                }`}
              >
                {questionNum <= questionsAnswered ? "✓" : questionNum}
              </div>
              
              {/* Points for this Question */}
              <div className="text-xs mt-1 font-semibold min-h-[14px]">
                {questionNum <= questionsAnswered && questionPoints[questionNum - 1] > 0 ? (
                  <span className="text-green-300">+{questionPoints[questionNum - 1]}</span>
                ) : (
                  <span className="text-transparent">0</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Total Game Score Display (BOTTOM) */}
        <div className="bg-white text-black rounded px-2 py-1">
          <div className="text-xl font-bold">
            {team.score}
          </div>
          <div className="text-xs">Total Game Points</div>
        </div>
      </div>
    </div>
  );
};

export default TeamPanel;