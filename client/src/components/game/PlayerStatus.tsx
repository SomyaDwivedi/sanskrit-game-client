import React from "react";
import { Team } from "../../types";
import StatusIndicator from "../common/StatusIndicator";

interface PlayerStatusProps {
  playerName: string;
  team: Team | null;
  isActiveTeam: boolean;
}

const PlayerStatus: React.FC<PlayerStatusProps> = ({
  playerName,
  team,
  isActiveTeam,
}) => {
  return (
    <div className="glass-card p-4 mb-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">{playerName}</h3>
        <div className="text-sm text-slate-400 mb-3">
          {team?.name} • Score: {team?.score || 0}
        </div>

        <StatusIndicator
          type="strikes"
          count={team?.strikes || 0}
          label="Strikes"
          className="mb-2"
        />

        <StatusIndicator type="team-status" isActive={isActiveTeam} />
      </div>
    </div>
  );
};

export default PlayerStatus;
