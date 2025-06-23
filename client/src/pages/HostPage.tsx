import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

// Import components
import Header from "../components/Header";
import Footer from "../components/Footer";
import AnimatedCard from "../components/AnimatedCard";
import LoadingSpinner from "../components/LoadingSpinner";
import TeamPanel from "../components/TeamPanel";
import QuestionDisplay from "../components/QuestionDisplay";
import BuzzerDisplay from "../components/BuzzerDisplay";
import ControlPanel from "../components/ControlPanel";

// Import hooks
import { useAudio } from "../hooks/useAudio";
import { useTimer, useCountdownTimer } from "../hooks/useTimer";
import { useSocket } from "../hooks/useSocket";

// Import types and utils
import { Game } from "../types";
import {
  getCurrentQuestion,
  getGameStats,
  getGameWinner,
} from "../utils/gameHelper";
import { ROUTES, GAME_CONFIG } from "../utils/constants";

const HostPage: React.FC = () => {
  const [gameCode, setGameCode] = useState<string>("");
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [controlMessage, setControlMessage] = useState<string>("");
  const [currentBuzzer, setCurrentBuzzer] = useState<{
    playerName: string;
    teamName: string;
    timestamp: number;
  } | null>(null);

  // Hooks
  const { soundEnabled, toggleSound, playSound } = useAudio();
  const { timer } = useTimer(game?.status === "active");

  const {
    timeLeft: answerTimeLeft,
    start: startAnswerTimer,
    stop: stopAnswerTimer,
  } = useCountdownTimer(
    30,
    (secondsLeft) => {
      if (secondsLeft <= 5 && secondsLeft > 0) {
        playSound("timerTick");
      }
    },
    () => {
      playSound("timeout");
      setControlMessage("Time's up!");
    }
  );

  const {
    connect,
    hostJoinGame,
    startGame,
    revealAnswer,
    nextQuestion,
    clearBuzzer,
  } = useSocket({
    onGameStarted: (data) => {
      setGame(data.game);
      setCurrentBuzzer(null);
      playSound("correct");
      setControlMessage("Game started! Get ready to play.");
    },
    onPlayerJoined: (data) => {
      playSound("buzz");
      setGame((prev) =>
        prev ? { ...prev, players: [...prev.players, data.player] } : null
      );
    },
    onPlayerBuzzed: (data) => {
      setGame(data.game);
      playSound("buzz");

      setCurrentBuzzer({
        playerName: data.playerName,
        teamName: data.teamName,
        timestamp: data.timestamp,
      });

      startAnswerTimer(30);
    },
    onAnswerCorrect: (data) => {
      setGame(data.game);
      playSound("correct");
      setControlMessage(
        `${data.teamName} got it right! +${data.pointsAwarded} points`
      );
      stopAnswerTimer();
    },
    onAnswerIncorrect: (data) => {
      setGame(data.game);
      playSound("wrong");
      setControlMessage(
        `${data.teamName} got it wrong! Strike ${data.strikes}`
      );
      stopAnswerTimer();
    },
    onAnswerTimeout: (data) => {
      setGame(data.game);
      playSound("timeout");
      setControlMessage(
        `Time's up for ${data.teamName}! Strike ${data.strikes}`
      );
      stopAnswerTimer();
    },
    onTeamSwitched: (data) => {
      setGame(data.game);
      playSound("buzz");
      setControlMessage(`Now ${data.activeTeamName}'s turn to answer!`);
    },
    onAnswerRevealed: (data) => {
      setGame(data.game);
      if (data.byHost) {
        playSound("correct");
      }
    },
    onNextQuestion: (data) => {
      setGame(data.game);
      setCurrentBuzzer(null);
      stopAnswerTimer();
      setControlMessage("New question! Get ready to play.");
      playSound("nextQuestion");
    },
    onGameOver: (data) => {
      setGame(data.game);
      playSound("applause");
      setControlMessage("Game Over! Check out the final results.");
    },
    onBuzzerCleared: (data) => {
      setGame(data.game);
      setCurrentBuzzer(null);
      stopAnswerTimer();
    },
  });

  const createGame = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/create-game");
      const { gameCode } = response.data;
      setGameCode(gameCode);

      const socket = connect();
      if (socket) {
        // Use fixed team names
        const defaultTeams = [
          { name: "Team Red", members: ["Captain Red", "", "", "", ""] },
          { name: "Team Blue", members: ["Captain Blue", "", "", "", ""] },
        ];

        hostJoinGame(gameCode, defaultTeams);

        // Listen for host-joined event
        socket.on("host-joined", (gameData: Game | null) => {
          if (gameData) {
            setGame(gameData);
          }
        });
      }
    } catch (error) {
      console.error("Error creating game:", error);
    }
    setIsLoading(false);
  };

  const handleStartGame = () => {
    if (gameCode) {
      startGame(gameCode);
    }
  };

  const handleRevealAnswer = (answerIndex: number) => {
    if (gameCode && game) {
      const answer =
        game.questions[game.currentQuestionIndex]?.answers[answerIndex];
      if (answer && !answer.revealed) {
        revealAnswer(gameCode, answerIndex);
      }
    }
  };

  const handleNextQuestion = () => {
    if (gameCode) {
      nextQuestion(gameCode);
    }
  };

  const handleClearBuzzer = () => {
    if (gameCode) {
      clearBuzzer(gameCode);
    }
  };
  const currentQuestion = game ? getCurrentQuestion(game) : null;

  // Not created yet - show creation form
  if (!gameCode) {
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header soundEnabled={soundEnabled} onToggleSound={toggleSound} />

        <main className="flex-1 container mx-auto px-4 py-8">
          <AnimatedCard>
            <div className="max-w-2xl mx-auto">
              <div className="glass-card p-8 text-center">
                <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  Host a New Game
                </h2>

                <div className="flex flex-col items-center mb-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4 flex items-center justify-center text-white text-4xl">
                    🎯
                  </div>
                  <p className="text-lg text-slate-300 mb-4">
                    Ready to host a buzzer-based quiz competition?
                  </p>
                  <p className="text-slate-400">
                    Click below to create a new game with Team Red vs Team Blue
                  </p>
                </div>

                <button
                  onClick={createGame}
                  disabled={isLoading}
                  className="btn-primary py-4 px-12 text-xl"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-3">Creating...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl mr-3">🚀</span>
                      CREATE GAME
                    </>
                  )}
                </button>

                <div className="mt-6">
                  <Link
                    to={ROUTES.HOME}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ← Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </main>

        <Footer />
      </div>
    );
  }

  // Waiting Screen
  if (game?.status === "waiting") {
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header
          gameCode={gameCode}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />

        <main className="flex-1 container mx-auto px-4 py-8">
          <AnimatedCard>
            <div className="max-w-2xl mx-auto text-center">
              <div className="glass-card p-8">
                <h2 className="text-3xl font-bold mb-6">Waiting for Players</h2>
                <div className="mb-8">
                  <p className="text-slate-400 mb-4">
                    Share this code with contestants:
                  </p>
                  <div className="text-5xl font-mono font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                    {gameCode}
                  </div>
                </div>

                {game.players.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Connected Players ({game.players.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {game.players.map((player, index) => (
                        <AnimatedCard key={player.id} delay={index * 50}>
                          <div className="glass-card p-3 flex items-center gap-3">
                            <span className="text-green-400">●</span>
                            <span>{player.name}</span>
                          </div>
                        </AnimatedCard>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStartGame}
                  disabled={game.players.length < 2}
                  className="btn-success py-4 px-12 text-xl"
                >
                  <span className="text-2xl mr-3">🎮</span>
                  BEGIN COMPETITION
                </button>
              </div>
            </div>
          </AnimatedCard>
        </main>

        <Footer />
      </div>
    );
  }
  //Active Game
  if (game?.status === "active" && currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header
          gameCode={gameCode}
          timer={timer}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />

        <main className="flex-1 container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Team 1 Panel */}
            <AnimatedCard className="lg:col-span-1">
              <TeamPanel
                team={game.teams[0]}
                teamIndex={0}
                isActive={game.teams[0]?.active}
              />
            </AnimatedCard>

            {/* Game Center */}
            <div className="lg:col-span-2">
              <QuestionDisplay
                question={currentQuestion}
                currentRound={game.currentRound}
                questionIndex={game.currentQuestionIndex}
                totalQuestions={game.questions.length}
                onRevealAnswer={handleRevealAnswer}
                isHost={true}
                showHostReference={true}
              />

              <BuzzerDisplay
                currentBuzzer={currentBuzzer}
                answerTimeLeft={answerTimeLeft}
                onNextQuestion={handleNextQuestion}
                isHost={true}
              />

              <ControlPanel
                controlMessage={controlMessage}
                onClearBuzzer={handleClearBuzzer}
                teams={game.teams}
              />
            </div>

            {/* Team 2 Panel */}
            <AnimatedCard className="lg:col-span-1">
              <TeamPanel
                team={game.teams[1]}
                teamIndex={1}
                isActive={game.teams[1]?.active}
              />
            </AnimatedCard>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Results Screen
  if (game?.status === "finished") {
    const winner = getGameWinner(game.teams);
    const stats = getGameStats(game);

    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header
          gameCode={gameCode}
          timer={timer}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />

        <main className="flex-1 container mx-auto px-4 py-8">
          <AnimatedCard>
            <div className="max-w-4xl mx-auto">
              <div className="glass-card p-12 text-center">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black p-8 rounded-2xl mb-8 animate-celebration">
                  <h2 className="text-5xl font-bold mb-4">🏆 CHAMPIONS 🏆</h2>
                  <p className="text-3xl font-bold">{winner.name}</p>
                  <p className="text-xl mt-2">Score: {winner.score}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {game.teams
                    .sort((a, b) => b.score - a.score)
                    .map((team, index) => (
                      <AnimatedCard key={team.id} delay={index * 200}>
                        <TeamPanel team={team} teamIndex={index} />
                      </AnimatedCard>
                    ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="glass-card p-6 text-center">
                    <div className="text-3xl font-bold text-blue-400">
                      {stats.totalQuestions}
                    </div>
                    <div className="text-sm text-slate-400">
                      Total Questions
                    </div>
                  </div>
                  <div className="glass-card p-6 text-center">
                    <div className="text-3xl font-bold text-green-400">
                      {timer}
                    </div>
                    <div className="text-sm text-slate-400">Game Duration</div>
                  </div>
                  <div className="glass-card p-6 text-center">
                    <div className="text-3xl font-bold text-red-400">
                      {stats.totalStrikes}
                    </div>
                    <div className="text-sm text-slate-400">Total Strikes</div>
                  </div>
                  <div className="glass-card p-6 text-center">
                    <div className="text-3xl font-bold text-purple-400">
                      {stats.maxPoints}
                    </div>
                    <div className="text-sm text-slate-400">Highest Points</div>
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <Link to={ROUTES.HOME} className="btn-primary py-3 px-8">
                    <span className="mr-2">🏠</span> NEW GAME
                  </Link>
                  <button
                    className="btn-accent py-3 px-8"
                    onClick={() => window.print()}
                  >
                    <span className="mr-2">📄</span> EXPORT RESULTS
                  </button>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </main>

        <Footer />
      </div>
    );
  }

  return null;
};

export default HostPage;
