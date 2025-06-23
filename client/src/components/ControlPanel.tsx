import React from "react";
import AnimatedCard from "./AnimatedCard";

interface ControlPanelProps {
  controlMessage?: string;
  onAddStrike?: (teamId: string) => void;
  onAwardPoints?: (teamId: string, points: number) => void;
  onSwitchTeams?: () => void;
  onClearBuzzer?: () => void;
  teams?: Array<{ id: string; name: string; strikes: number }>;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  controlMessage,
  onAddStrike,
  onAwardPoints,
  onSwitchTeams,
  onClearBuzzer,
  teams = [],
}) => {
  return (
    <AnimatedCard delay={600}>
      <div className="glass-card p-4 mt-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-slate-300">
            Quiz Control Panel
          </h3>
          {controlMessage && (
            <p className="text-sm text-yellow-400 mt-1">{controlMessage}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Team Controls */}
          {teams.map((team, index) => (
            <div key={team.id} className="glass-card p-3">
              <h4 className="font-semibold text-center mb-2">{team.name}</h4>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => onAddStrike?.(team.id)}
                  className="btn-secondary text-xs py-1 px-2"
                  disabled={team.strikes >= 3}
                >
                  Add Strike
                </button>
                <button
                  onClick={() => onAwardPoints?.(team.id, 10)}
                  className="btn-success text-xs py-1 px-2"
                >
                  +10 Points
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* General Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onSwitchTeams}
            className="btn-accent text-xs py-2 px-4"
          >
            Switch Teams
          </button>
          <button
            onClick={onClearBuzzer}
            className="btn-secondary text-xs py-2 px-4"
          >
            Clear Buzzer
          </button>
        </div>

        <div className="text-center mt-4">
          <div className="text-slate-300 text-sm">
            <span className="font-semibold">Game Rules:</span> Teams take turns
            answering. 3 strikes and the other team gets a chance to steal.
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
};

export default ControlPanel;