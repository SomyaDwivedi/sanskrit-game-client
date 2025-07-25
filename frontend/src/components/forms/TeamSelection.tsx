import React from "react";
import { Team } from "../../types";
import AnimatedCard from "../common/AnimatedCard";

interface TeamSelectionProps {
  teams: Team[];
  selectedTeamId?: string;
  onSelectTeam: (teamId: string) => void;
  playerName: string;
}

const TeamSelection: React.FC<TeamSelectionProps> = ({
  teams,
  selectedTeamId,
  onSelectTeam,
}) => {
  const playerName = localStorage.getItem("username") || "Player";

  return (
    <div className="glass-card p-8 text-center mb-8">
      <h2 className="text-3xl font-bold mb-4">Welcome {playerName}!</h2>

      <div className="mb-6">
        {!selectedTeamId ? (
          <div>
            <h3 className="text-xl font-semibold mb-4">Choose your team:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((team, index) => (
                <AnimatedCard key={team.id} delay={index * 100}>
                  <button
                    onClick={() => onSelectTeam(team.id)}
                    className={`w-full p-6 rounded-xl text-left transition-all transform hover:scale-105 ${
                      team.id === selectedTeamId
                        ? "bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-2 border-green-500 shadow-lg shadow-green-500/20"
                        : "bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/50 hover:to-slate-600/50 border-2 border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xl font-bold">{team.name}</h4>
                      {team.id === selectedTeamId && (
                        <span className="text-green-400 text-2xl animate-bounce">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-400">Current members:</p>
                      <div className="flex flex-wrap gap-2">
                        {team.members
                          .filter((m) => m)
                          .map((member, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-slate-700/50 px-2 py-1 rounded-full"
                            >
                              {member}
                            </span>
                          ))}
                      </div>
                    </div>
                    <div className="mt-3 text-sm">
                      {team.members.filter((m) => m).length} / 5 members
                    </div>
                  </button>
                </AnimatedCard>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
              <p className="text-green-300 font-medium">
                You've joined{" "}
                {teams.find((t) => t.id === selectedTeamId)?.name || "a team"}!
              </p>
            </div>
            <p className="text-slate-400">
              Waiting for the host to start the game...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamSelection;
