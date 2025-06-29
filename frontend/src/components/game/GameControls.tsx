import React from "react";
import Button from "../common/Button";

interface GameControlsProps {
  onClearBuzzer: () => void;
  onNextQuestion: () => void;
  controlMessage?: string;
  variant?: "host" | "compact";
}

const GameControls: React.FC<GameControlsProps> = ({
  onClearBuzzer,
  onNextQuestion,
  controlMessage,
  variant = "host",
}) => {
  if (variant === "compact") {
    return (
      <div className="glass-card p-2">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              onClick={onClearBuzzer}
              variant="secondary"
              size="sm"
              className="text-xs py-1 px-3"
            >
              🔄 Reset
            </Button>
            <Button
              onClick={onNextQuestion}
              variant="primary"
              size="sm"
              className="text-xs py-1 px-3"
            >
              ➡️ Next
            </Button>
          </div>
          {controlMessage && (
            <div className="text-blue-300 text-xs">{controlMessage}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 mt-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-slate-300">
          Quiz Control Panel
        </h3>
        {controlMessage && (
          <p className="text-sm text-yellow-400 mt-1">{controlMessage}</p>
        )}
      </div>

      <div className="flex justify-center gap-4">
        <Button onClick={onClearBuzzer} variant="secondary" size="sm">
          Clear Buzzer
        </Button>
        <Button onClick={onNextQuestion} variant="primary" size="sm">
          Next Question
        </Button>
      </div>

      <div className="text-center mt-4">
        <div className="text-slate-300 text-sm">
          <span className="font-semibold">Game Rules:</span> Teams take turns
          answering. 3 strikes and the other team gets a chance to steal.
        </div>
      </div>
    </div>
  );
};

export default GameControls;
