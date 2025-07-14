import React from "react";
import { Team } from "../../types";
import { getTeamColorClasses } from "../../utils/gameHelper";

interface TeamPanelProps {
  team: Team;
  teamIndex: number;
  isActive?: boolean;
  showMembers?: boolean; // New prop to control member display
  playerName?: string; // Player's name to show if this is their team
  isPlayerTeam?: boolean; // Whether this is the current player's team
}

const TeamPanel: React.FC<TeamPanelProps> = ({
  team,
  teamIndex,
  isActive = false,
  showMembers = true, // Default to true for host view
  playerName,
  isPlayerTeam = false,
}) => {
  const colorClasses = getTeamColorClasses(teamIndex);

  return (
    <div
      className={`glass-card p-6 h-full transition-all ${
        isActive ? `${colorClasses.ring} animate-pulse-slow` : ""
      } ${
        isPlayerTeam ? "border-yellow-400/50 bg-yellow-400/10" : ""
      }`}
    >
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
          {team.name}
          {isPlayerTeam && <span className="text-yellow-400">👤</span>}
        </h3>
        {isPlayerTeam && playerName && (
          <div className="text-sm text-yellow-300 mb-2 font-medium">
            {playerName}
          </div>
        )}
        <div
          className={`text-5xl font-bold mb-4 animate-score ${colorClasses.primary}`}
        >
          {team.score}
        </div>
        <div className="text-sm text-slate-400">Points</div>
      </div>

      {/* Only show team members if showMembers is true */}
      {showMembers && team.members && team.members.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-400 mb-3">
            Team Members
          </h4>
          <div className="space-y-2">
            {team.members
              .filter((member) => member.trim() !== "")
              .map((member, idx) => (
                <div
                  key={idx}
                  className="text-sm glass-card p-2 flex items-center gap-2"
                >
                  {idx === 0 && <span className="text-yellow-400">👑</span>}
                  {member}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Strikes display */}
      <div className="text-center">
        <div className="flex justify-center gap-2 mb-2">
          {[1, 2, 3].map((strike) => (
            <div
              key={strike}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                strike <= team.strikes
                  ? "bg-red-500 border-red-500 text-white animate-strike"
                  : "border-slate-600"
              }`}
            >
              {strike <= team.strikes ? "✗" : ""}
            </div>
          ))}
        </div>
        <div className="text-sm text-slate-400">Strikes</div>
      </div>

      {isActive && (
        <div className="mt-4 text-center">
          <div className="text-xs bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1 rounded-full border border-blue-400/30">
            Active Team
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPanel;