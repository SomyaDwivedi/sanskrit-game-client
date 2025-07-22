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
  // Only show first 3 answers
  const displayAnswers = answers.slice(0, 3);

  if (variant === "compact") {
    return (
      <div className="flex-1 flex flex-col gap-1 mb-2 overflow-auto">
        {displayAnswers.map((answer, index) => (
          <div
            key={index}
            className={`glass-card p-2 transition-all ${
              answer.revealed
                ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400 animate-pulse"
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
                  {index + 1}. {answer.revealed ? answer.answer : "_".repeat(8)}
                </span>
                {answer.revealed && (
                  <span className="ml-2 text-green-400 text-xs animate-bounce">
                    ✓ REVEALED
                  </span>
                )}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-bold min-w-[40px] text-center ${
                  answer.revealed
                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black"
                    : "bg-slate-600 text-slate-300"
                }`}
              >
                {answer.revealed ? answer.score * currentRound : "?"}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "player") {
    return (
      <div className="flex-1 flex flex-col gap-2 overflow-auto">
        {displayAnswers.map((answer, index) => (
          <div
            key={index}
            className={`glass-card p-3 transition-all ${
              answer.revealed
                ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400 animate-pulse"
                : "border-slate-500/50"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-base">
                {answer.revealed ? (
                  <span className="animate-reveal text-green-300">
                    {index + 1}. {answer.answer}
                  </span>
                ) : (
                  <span className="text-slate-400">
                    {index + 1}. {"\u00A0".repeat(12)}
                  </span>
                )}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold min-w-[50px] text-center ${
                  answer.revealed
                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {answer.revealed ? answer.score * currentRound : "?"}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default variant - vertical layout for host (SHOW ALL ANSWERS)
  return (
    <div className="flex flex-col gap-2 mb-4">
      {displayAnswers.map((answer, index) => (
        <AnimatedCard key={index} delay={200 + index * 50}>
          <div
            className={`glass-card p-3 transition-all hover-lift ${
              answer.revealed
                ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400 animate-pulse"
                : "hover:border-blue-400 cursor-pointer"
            } ${isHost && !answer.revealed ? "cursor-pointer" : ""}`}
            onClick={() =>
              isHost && !answer.revealed && onRevealAnswer?.(index)
            }
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">
                {/* HOST ALWAYS SEES THE ANSWER TEXT */}
                {isHost ? (
                  <span className={answer.revealed ? "text-green-300" : "text-blue-300"}>
                    {index + 1}. {answer.answer}
                    {!answer.revealed && <span className="ml-2 text-xs text-yellow-400">(Click to reveal)</span>}
                  </span>
                ) : (
                  // NON-HOST VIEW
                  answer.revealed ? (
                    <span className="animate-reveal text-green-300">
                      {index + 1}. {answer.answer}
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      {index + 1}. {"\u00A0".repeat(15)}
                    </span>
                  )
                )}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold min-w-[60px] text-center ${
                  answer.revealed
                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {answer.revealed || isHost ? answer.score * currentRound : "?"}
              </span>
            </div>
          </div>
        </AnimatedCard>
      ))}
    </div>
  );
};

export default AnswerGrid;