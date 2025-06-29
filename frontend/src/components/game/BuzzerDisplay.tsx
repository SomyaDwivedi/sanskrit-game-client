import React from "react";
import AnimatedCard from "../common/AnimatedCard";

interface BuzzerDisplayProps {
  currentBuzzer?: {
    playerName: string;
    teamName: string;
    timestamp: number;
  } | null;
  answerTimeLeft?: number;
  onNextQuestion?: () => void;
  isHost?: boolean;
}

const BuzzerDisplay: React.FC<BuzzerDisplayProps> = ({
  currentBuzzer,
  answerTimeLeft = 0,
  onNextQuestion,
  isHost = false,
}) => {
  return (
    <AnimatedCard delay={50}>
      <div className="glass-card p-4 mb-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-400/30">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {currentBuzzer ? (
              <>
                <h3 className="font-bold text-yellow-400">
                  <span className="animate-pulse">🔔</span>{" "}
                  {currentBuzzer.playerName} buzzed in!
                </h3>
                <p className="text-sm text-slate-400">
                  Team: {currentBuzzer.teamName}
                </p>
              </>
            ) : (
              <h3 className="font-bold text-slate-300">
                Buzzer is open - Players can buzz in anytime!
              </h3>
            )}

            {answerTimeLeft > 0 && (
              <div className="mt-2">
                <span
                  className={`font-bold ${
                    answerTimeLeft <= 5
                      ? "text-red-400 animate-pulse"
                      : "text-blue-400"
                  }`}
                >
                  Time remaining: {answerTimeLeft}s
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentBuzzer && (
              <span className="text-sm text-slate-400">
                {new Date(currentBuzzer.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            )}

            {isHost && (
              <button
                onClick={onNextQuestion}
                className="btn-primary text-xs py-2 px-4"
              >
                Next Question
              </button>
            )}
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
};

export default BuzzerDisplay;
