import React from "react";
import AnimatedCard from "../common/AnimatedCard";
import Button from "../common/Button";

interface BuzzerDisplayProps {
  currentBuzzer?: {
    playerId?: string;
    teamId?: string;
    playerName: string;
    teamName: string;
    timestamp: number;
  } | null;
  answerTimeLeft?: number;
  onNextQuestion?: () => void;
  onCorrectAnswer?: () => void;
  onIncorrectAnswer?: () => void;
  isHost?: boolean;
  playerAnswer?: string;
}

const BuzzerDisplay: React.FC<BuzzerDisplayProps> = ({
  currentBuzzer,
  answerTimeLeft = 0,
  onNextQuestion,
  onCorrectAnswer,
  onIncorrectAnswer,
  isHost = false,
  playerAnswer,
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
                {playerAnswer && (
                  <p className="text-md text-white mt-2">
                    Answer: <span className="font-bold">{playerAnswer}</span>
                  </p>
                )}
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

          <div className="flex flex-col md:flex-row items-end gap-2">
            {currentBuzzer && (
              <span className="text-sm text-slate-400">
                {new Date(currentBuzzer.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            )}

            {isHost && currentBuzzer && (
              <div className="flex gap-2">
                <Button
                  onClick={onCorrectAnswer}
                  className="btn-success text-xs py-2 px-4"
                >
                  ✓ Correct
                </Button>
                <Button
                  onClick={onIncorrectAnswer}
                  className="btn-danger text-xs py-2 px-4"
                >
                  ✗ Incorrect
                </Button>
              </div>
            )}

            {isHost && (
              <Button
                onClick={onNextQuestion}
                className="btn-primary text-xs py-2 px-4"
              >
                Next Question
              </Button>
            )}
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
};

export default BuzzerDisplay;