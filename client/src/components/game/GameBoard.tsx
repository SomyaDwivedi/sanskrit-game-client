import React from "react";
import { Game } from "../../types";
import { getCurrentQuestion } from "../../utils/gameHelper";
import QuestionCard from "./QuestionCard";
import AnswerGrid from "./AnswerGrid";
import BuzzerDisplay from "./BuzzerDisplay";
import GameControls from "./GameControls";

interface GameBoardProps {
  game: Game;
  currentBuzzer?: {
    playerName: string;
    teamName: string;
    timestamp: number;
  } | null;
  answerTimeLeft?: number;
  onRevealAnswer?: (answerIndex: number) => void;
  onNextQuestion?: () => void;
  onClearBuzzer?: () => void;
  isHost?: boolean;
  variant?: "host" | "player";
  controlMessage?: string;
}

const GameBoard: React.FC<GameBoardProps> = ({
  game,
  currentBuzzer,
  answerTimeLeft = 0,
  onRevealAnswer,
  onNextQuestion,
  onClearBuzzer,
  isHost = false,
  variant = "host",
  controlMessage,
}) => {
  const currentQuestion = getCurrentQuestion(game);

  if (!currentQuestion) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-xl font-bold text-slate-300">
          No question available
        </p>
      </div>
    );
  }

  if (variant === "player") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <QuestionCard
          question={currentQuestion}
          currentRound={game.currentRound}
          questionIndex={game.currentQuestionIndex}
          totalQuestions={game.questions.length}
          variant="compact"
        />

        <AnswerGrid
          answers={currentQuestion.answers}
          currentRound={game.currentRound}
          variant="player"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <QuestionCard
        question={currentQuestion}
        currentRound={game.currentRound}
        questionIndex={game.currentQuestionIndex}
        totalQuestions={game.questions.length}
        variant="compact"
      />

      <AnswerGrid
        answers={currentQuestion.answers}
        currentRound={game.currentRound}
        onRevealAnswer={onRevealAnswer}
        isHost={isHost}
        variant="compact"
      />

      {/* Current Buzzer Display */}
      {game.currentBuzzer && currentBuzzer && (
        <BuzzerDisplay
          currentBuzzer={currentBuzzer}
          answerTimeLeft={answerTimeLeft}
          onNextQuestion={onNextQuestion}
          isHost={isHost}
        />
      )}

      {/* Host Controls */}
      {isHost && onClearBuzzer && onNextQuestion && (
        <GameControls
          onClearBuzzer={onClearBuzzer}
          onNextQuestion={onNextQuestion}
          controlMessage={controlMessage}
          variant="compact"
        />
      )}
    </div>
  );
};

export default GameBoard;
