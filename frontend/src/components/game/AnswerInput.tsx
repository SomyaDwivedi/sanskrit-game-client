import React from "react";
import Input from "../common/Input";
import Button from "../common/Button";

interface AnswerInputProps {
  answer: string;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  canSubmit: boolean;
  isMyTeam: boolean;
  teamName?: string;
  currentAttempt?: number;
  maxAttempts?: number;
}

const AnswerInput: React.FC<AnswerInputProps> = ({
  answer,
  onAnswerChange,
  onSubmit,
  canSubmit,
  isMyTeam,
  teamName,
  currentAttempt = 1,
  maxAttempts = 3,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canSubmit && answer.trim()) {
      onSubmit();
    }
  };

  const attemptsRemaining = maxAttempts - (currentAttempt - 1);

  return (
    <div className="glass-card p-4 flex-1">
      <div className="text-center mb-4">
        {isMyTeam ? (
          <h3 className="text-lg font-semibold text-green-300 mb-2">
            🎯 Your team has control!
          </h3>
        ) : (
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            ⏳ Other team is answering...
          </h3>
        )}
      </div>

      <div className="space-y-3">
        <Input
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            isMyTeam ? "Enter your answer..." : "Wait for your turn..."
          }
          className={`w-full ${
            canSubmit
              ? "border-green-400 bg-green-50/5"
              : "border-slate-400 bg-slate-50/5 opacity-60"
          }`}
          disabled={!canSubmit}
          autoFocus={!!canSubmit}
        />

        {isMyTeam && (
          <Button
            onClick={onSubmit}
            disabled={!answer.trim() || !canSubmit}
            variant={canSubmit && answer.trim() ? "success" : "secondary"}
            className="w-full"
          >
            Submit Answer (Attempt {currentAttempt}/{maxAttempts})
          </Button>
        )}
      </div>

      <div className="mt-3 text-center">
        {isMyTeam ? (
          <p className="text-xs text-green-200">
            Attempt {currentAttempt} of {maxAttempts} • Enter your answer above
          </p>
        ) : (
          <p className="text-xs text-gray-400">
            Wait for the other team to finish
          </p>
        )}
      </div>
    </div>
  );
};

export default AnswerInput;