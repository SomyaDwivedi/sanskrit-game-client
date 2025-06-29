import React from "react";
import { Answer } from "../../types";
import AnimatedCard from "../common/AnimatedCard";

interface AnswerGridProps {
  answers: Answer[];
  currentRound: number;
  onRevealAnswer?: (answerIndex: number) => void;
  isHost?: boolean;
  variant?: "default" | "compact" | "player";
}

const AnswerGrid: React.FC<AnswerGridProps> = ({
  answers,
  currentRound,
  onRevealAnswer,
  isHost = false,
  variant = "default",
}) => {
  if (variant === "compact") {
    return (
      <div className="flex-1 grid grid-cols-2 gap-2 mb-2 overflow-auto">
        {answers.map((answer, index) => (
          <div
            key={index}
            className={`glass-card p-2 transition-all ${
              answer.revealed
                ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400"
                : "bg-gradient-to-r from-slate-700/20 to-slate-600/20 border-slate-500/30"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">
                <span
                  className={
                    answer.revealed ? "text-green-300" : "text-slate-300"
                  }
                >
                  {index + 1}. {answer.text}
                </span>
                {answer.revealed && (
                  <span className="ml-2 text-green-400 text-xs">
                    ✓ REVEALED
                  </span>
                )}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-bold ${
                  answer.revealed
                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black"
                    : "bg-slate-600 text-slate-300"
                }`}
              >
                {answer.points * currentRound}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "player") {
    return (
      <div className="flex-1 grid grid-cols-2 gap-3 overflow-auto">
        {answers.map((answer, index) => (
          <div
            key={index}
            className={`glass-card p-3 transition-all ${
              answer.revealed
                ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400"
                : "border-slate-500/50"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold">
                {answer.revealed ? (
                  <span className="animate-reveal">
                    {index + 1}. {answer.text}
                  </span>
                ) : (
                  `${index + 1}. ${"_".repeat(10)}`
                )}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-sm font-bold ${
                  answer.revealed
                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black"
                    : "bg-slate-700"
                }`}
              >
                {answer.revealed ? answer.points * currentRound : "?"}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {answers.map((answer, index) => (
        <AnimatedCard key={index} delay={200 + index * 50}>
          <div
            className={`glass-card p-4 transition-all hover-lift ${
              answer.revealed
                ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400"
                : "hover:border-blue-400"
            } ${isHost && !answer.revealed ? "cursor-pointer" : ""}`}
            onClick={() =>
              isHost && !answer.revealed && onRevealAnswer?.(index)
            }
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">
                {answer.revealed ? (
                  <span className="animate-reveal">
                    {index + 1}. {answer.text}
                  </span>
                ) : (
                  `${index + 1}. ${"_".repeat(12)}`
                )}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  answer.revealed
                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black"
                    : "bg-slate-700"
                }`}
              >
                {answer.revealed ? answer.points * currentRound : "?"}
              </span>
            </div>
          </div>
        </AnimatedCard>
      ))}
    </div>
  );
};

export default AnswerGrid;
