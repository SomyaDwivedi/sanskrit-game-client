import React from "react";
import { Game } from "../../types";
import { getCurrentQuestion } from "../../utils/gameHelper";

interface GameBoardProps {
  game: Game;
  onRevealAnswer?: (answerIndex: number) => void;
  onNextQuestion?: () => void;
  isHost?: boolean;
  variant?: "host" | "player";
  controlMessage?: string;
}

const GameBoard: React.FC<GameBoardProps> = ({
  game,
  onRevealAnswer,
  onNextQuestion,
  isHost = false,
  variant = "host",
  controlMessage,
}) => {
  const currentQuestion = getCurrentQuestion(game);

  if (!currentQuestion) {
    return (
      <div className="glass-card p-6 text-center question-card">
        <p className="text-lg font-bold text-slate-300">
          No question available
        </p>
      </div>
    );
  }

  // Create round status indicator like in the image
  const RoundStatus = () => (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((roundNum) => (
        <div key={roundNum} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
              roundNum < game.currentRound
                ? "bg-green-500 text-white border-green-400"
                : roundNum === game.currentRound
                ? "bg-yellow-400 text-black border-yellow-300"
                : "bg-gray-600 text-gray-300 border-gray-500"
            }`}
          >
            {roundNum}
          </div>
          {roundNum < 3 && (
            <div
              className={`w-6 h-0.5 mx-1 ${
                roundNum < game.currentRound ? "bg-green-500" : "bg-gray-500"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  if (variant === "player") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Question Header - Compact with Round Status */}
        <div className="glass-card question-header bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold">
                Round {game.currentRound} • {currentQuestion.questionCategory}
              </h2>
              <div className="text-xs text-slate-400">
                Question {game.currentQuestionIndex + 1} of{" "}
                {game.questions.length}
              </div>
            </div>
            <RoundStatus />
          </div>
        </div>

        {/* Question Text - Compact */}
        <div className="glass-card question-card">
          <h2 className="text-center">{currentQuestion.question}</h2>
        </div>

        {/* Answer Grid - Vertical Layout */}
        <div className="answer-grid">
          {currentQuestion.answers.slice(0, 3).map((answer, index) => (
            <div
              key={index}
              className={`answer-card glass-card transition-all ${
                answer.revealed
                  ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400 animate-pulse"
                  : "border-slate-500/50"
              }`}
            >
              <span className="answer-text">
                {answer.revealed ? (
                  <span className="text-black">
                    {index + 1}. {answer.answer}
                  </span>
                ) : (
                  <span className="text-slate-400">
                    {index + 1}. {"\u00A0".repeat(12)}
                  </span>
                )}
              </span>
              <span
                className={`answer-points ${
                  answer.revealed
                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {answer.revealed ? answer.score * game.currentRound : "?"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Question Header with Round Status */}
      <div className="glass-card question-header bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold">
              Round {game.currentRound} • {currentQuestion.questionCategory}
            </h2>
            <div className="text-xs text-slate-400">
              Question {game.currentQuestionIndex + 1} of {game.questions.length}
            </div>
          </div>
          <RoundStatus />
        </div>
      </div>

      {/* Question Text */}
      <div className="glass-card question-card">
        <h2 className="text-center">{currentQuestion.question}</h2>
      </div>

      {/* Answer Grid - Vertical Layout for Host - Only 3 answers, Host sees all */}
      <div className="answer-grid">
        {currentQuestion.answers.slice(0, 3).map((answer, index) => (
          <div
            key={index}
            className={`answer-card glass-card transition-all ${
              answer.revealed
                ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400 animate-pulse"
                : "hover:border-blue-400"
            } ${isHost && !answer.revealed ? "cursor-pointer" : ""}`}
            onClick={() =>
              isHost && !answer.revealed && onRevealAnswer?.(index)
            }
          >
            <span className="answer-text">
              {/* HOST ALWAYS SEES THE ANSWER TEXT */}
              {isHost ? (
                <span className={answer.revealed ? "text-black" : "text-blue-300"}>
                  {index + 1}. {answer.answer}
                  {!answer.revealed && <span className="ml-2 text-xs text-yellow-400">(Click to reveal)</span>}
                </span>
              ) : (
                // NON-HOST VIEW
                answer.revealed ? (
                  <span className="text-black">
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
              className={`answer-points ${
                answer.revealed
                  ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              {answer.revealed || isHost ? answer.score * game.currentRound : "?"}
            </span>
          </div>
        ))}
      </div>

      {/* Host Control Message */}
      {isHost && controlMessage && (
        <div className="glass-card host-controls">
          <div className="text-center">
            <div className="text-xs text-blue-400">{controlMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;