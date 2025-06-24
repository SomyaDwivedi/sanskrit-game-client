import React from "react";
import { Question } from "../types";
import AnimatedCard from "./AnimatedCard";

interface QuestionDisplayProps {
  question: Question;
  currentRound: number;
  questionIndex: number;
  totalQuestions: number;
  onRevealAnswer?: (answerIndex: number) => void;
  isHost?: boolean;
  showHostReference?: boolean;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  currentRound,
  questionIndex,
  totalQuestions,
  onRevealAnswer,
  isHost = false,
  showHostReference = true,
}) => {
  return (
    <div>
      {/* Question Header */}
      <AnimatedCard>
        <div className="glass-card p-4 mb-4 text-center bg-gradient-to-r from-purple-600/20 to-blue-600/20">
          <h3 className="text-lg font-bold">
            Round {currentRound} • {question.category}
          </h3>
          <p className="text-sm text-slate-400">
            Question {questionIndex + 1} of {totalQuestions}
          </p>
        </div>
      </AnimatedCard>

      {/* Question */}
      <AnimatedCard delay={100}>
        <div className="glass-card p-8 mb-6">
          <h2 className="text-2xl font-semibold text-center mb-4">
            {question.question}
          </h2>
          <p className="text-center text-slate-400">Survey Says...</p>
        </div>
      </AnimatedCard>

      {/* Answers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {question.answers.map((answer, index) => (
          <AnimatedCard key={index} delay={200 + index * 50}>
            <div
              className={`glass-card p-4 transition-all hover-lift ${
                answer.revealed
                  ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400"
                  : "hover:border-blue-400"
              } ${isHost && !answer.revealed ? "cursor-pointer" : ""}`}
              onClick={() => isHost && !answer.revealed && onRevealAnswer?.(index)}
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

      {/* Host Reference (only show if host and showHostReference is true) */}
      {isHost && showHostReference && (
        <AnimatedCard delay={500}>
          <div className="glass-card p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
            <h4 className="text-sm font-semibold text-purple-300 mb-3">
              🔒 Host Reference (Hidden from Players)
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {question.answers.map((answer, index) => (
                <div
                  key={index}
                  className="flex justify-between text-slate-400"
                >
                  <span>
                    {index + 1}. {answer.text}
                  </span>
                  <span className="font-bold text-yellow-400">
                    {answer.points * currentRound}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedCard>
      )}
    </div>
  );
};

export default QuestionDisplay;