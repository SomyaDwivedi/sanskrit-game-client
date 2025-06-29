import React from "react";
import { Question } from "../../types";
import AnimatedCard from "../common/AnimatedCard";

interface QuestionCardProps {
  question: Question;
  currentRound: number;
  questionIndex: number;
  totalQuestions: number;
  variant?: "default" | "compact";
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentRound,
  questionIndex,
  totalQuestions,
  variant = "default",
}) => {
  if (variant === "compact") {
    return (
      <>
        {/* Question Header */}
        <div className="glass-card p-2 mb-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold">
              Round {currentRound} • {question.category}
            </h2>
            <div className="text-xs text-slate-400">
              Question {questionIndex + 1} of {totalQuestions}
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="glass-card p-3 mb-2">
          <h2 className="text-lg font-semibold text-center mb-1">
            {question.question}
          </h2>
        </div>
      </>
    );
  }

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
        </div>
      </AnimatedCard>
    </div>
  );
};

export default QuestionCard;