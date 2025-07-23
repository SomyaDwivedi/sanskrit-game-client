import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import io, { Socket } from "socket.io-client";

// Import components
import PageLayout from "../components/layout/PageLayout";
import AnimatedCard from "../components/common/AnimatedCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import TeamPanel from "../components/game/TeamPanel";
import GameBoard from "../components/game/GameBoard";
import GameResults from "../components/game/GameResults";
import PlayerList from "../components/game/PlayerList";
import GameCreationForm from "../components/forms/GameCreationForm";
import Button from "../components/common/Button";
import TurnIndicator from "../components/game/TurnIndicator";
import RoundSummaryComponent from "../components/game/RoundSummaryComponent";

// Import hooks and services
import { useTimer } from "../hooks/useTimer";
import gameApi from "../services/gameApi";

// Import types and utils
import { Game, Team, RoundSummary, RoundData } from "../types";
import { getCurrentQuestion, getGameWinner } from "../utils/gameHelper";
import { ROUTES } from "../utils/constants";

const HostGamePage: React.FC = () => {
  const [gameCode, setGameCode] = useState<string>("");
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [controlMessage, setControlMessage] = useState<string>("");
  const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Hooks
  const { timer } = useTimer(game?.status === "active");

  // Extract question data for teams
  const getTeamQuestionData = (teamKey: "team1" | "team2"): RoundData => {
    if (!game?.gameState?.questionData?.[teamKey]) {
      return {
        round1: [
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 }
        ],
        round2: [
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 }
        ],
        round3: [
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 },
          { firstAttemptCorrect: null, pointsEarned: 0 }
        ]
      };
    }
    return game.gameState.questionData[teamKey];
  };

  // Socket setup for turn-based system with single attempt + question data
  const setupSocket = React.useCallback((gameCode: string) => {
    console.log("🔌 Setting up socket connection for single-attempt game with question tracking...");

    // Clean up existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io("http://localhost:5001", {
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5001,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected successfully:", socket.id);

      // Join as host immediately after connection
      console.log("👑 Joining as host...");
      const defaultTeams = [
        { name: "Team Red", members: ["", "", "", "", ""] },
        { name: "Team Blue", members: ["", "", "", "", ""] },
      ];

      socket.emit("host-join", { gameCode, teams: defaultTeams });
    });

    socket.on("host-joined", (gameData) => {
      console.log("🎯 Host joined successfully! Game data:", gameData);
      setGame(gameData);
      setControlMessage("Waiting for players to join...");

      // Request current players list
      socket.emit("get-players", { gameCode });
    });

    socket.on("game-started", (data) => {
      console.log("🚀 Single-attempt game started with question tracking!");
      setGame(data.game);
      setControlMessage(
        `Game started! ${
          data.activeTeam === "team1" ? "Team 1" : "Team 2"
        } goes first. Each question allows only 1 attempt.`
      );
    });

    socket.on("player-joined", (data) => {
      console.log("👤 Player joined event received:", data);

      if (data.player) {
        setGame((prev) => {
          if (!prev) return null;

          const playerExists = prev.players.some(
            (p) => p.id === data.player.id
          );
          if (playerExists) {
            return {
              ...prev,
              players: prev.players.map((p) =>
                p.id === data.player.id ? { ...p, ...data.player } : p
              ),
            };
          }

          return {
            ...prev,
            players: [...prev.players, data.player],
          };
        });
      }
    });

    socket.on("answer-correct", (data) => {
      console.log("✅ Correct answer with question tracking:", data);
      setGame(data.game);
      setControlMessage(
        `✅ ${data.playerName} answered correctly! +${data.pointsAwarded} points for ${data.teamName}.`
      );
    });

    socket.on("answer-incorrect", (data) => {
      console.log("❌ Incorrect answer with question tracking:", data);
      setGame(data.game);
      setControlMessage(
        `❌ ${data.playerName} answered incorrectly. ${data.message}`
      );
    });

    socket.on("remaining-cards-revealed", (data) => {
      console.log("👁️ Remaining cards revealed:", data);
      setGame(data.game);
      setControlMessage("All remaining cards revealed!");
    });

    socket.on("turn-changed", (data) => {
      console.log("↔️ Turn changed:", data);
      setGame(data.game);
      setControlMessage(`Turn switched to ${data.teamName}!`);
    });

    socket.on("next-question", (data) => {
      console.log("➡️ Next question:", data);
      setGame(data.game);
      if (data.sameTeam) {
        setControlMessage(`Same team continues with their next question.`);
      } else {
        setControlMessage(`Moving to next question.`);
      }
    });

      socket.on("round-complete", (data) => {
        console.log("🏁 Round completed:", data);

        // Update game state if provided
        if (data.game) {
          setGame(data.game);
        }

        if (data.roundSummary) {
          setRoundSummary(data.roundSummary);
          if (data.roundSummary.round === 0) {
            setControlMessage(
              `${data.roundSummary.tossUpWinner?.teamName || "A team"} won the toss-up!`
            );
          } else {
            setControlMessage(
              `Round ${data.roundSummary.round} completed! ${
                data.isGameFinished ? "Game finished!" : "Ready for next round."
              }`
            );
          }
        } else if (typeof data.round !== "undefined") {
          // Fallback when summary is missing
          setControlMessage(
            `Round ${data.round} completed! ${
              data.isGameFinished ? "Game finished!" : "Ready for next round."
            }`
          );
        }
      });

    socket.on("round-started", (data) => {
      console.log("🆕 New round started:", data);
      setGame(data.game);
      setRoundSummary(null);
      setControlMessage(
        `Round ${data.round} started! ${
          data.activeTeam === "team1" ? "Team 1" : "Team 2"
        } goes first. Each question allows only 1 attempt.`
      );
    });

    socket.on("game-over", (data) => {
      console.log("🏆 Game over:", data);
      setGame(data.game);
      setControlMessage("Game finished! Check out the final results.");
    });

    socket.on("players-list", (data: any) => {
      console.log("📋 Received players list:", data);
      if (data.players && data.players.length > 0) {
        setGame((prevGame) => {
          if (!prevGame) return null;
          return {
            ...prevGame,
            players: data.players,
          };
        });
      }
    });

    socket.on("team-updated", (data: any) => {
      console.log("🔄 Team updated:", data);
      setGame(data.game);
    });

    socket.on("answers-revealed", (data) => {
      console.log("👁️ All answers revealed:", data);
      setGame(data.game);
      setControlMessage("All answers have been revealed!");
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      setControlMessage("Connection error. Please try again.");
    });

    socket.on("error", (error) => {
      console.error("❌ Socket error:", error);
      setControlMessage(`Socket error: ${error.message || error}`);
    });

    return socket;
  }, []);

  const createGame = async () => {
    console.log("🎮 Creating new single-attempt game with question tracking...");
    setIsLoading(true);
    setControlMessage("");

    try {
      const testResponse = await gameApi.testConnection();
      console.log("✅ Server connection successful:", testResponse);

      const response = await gameApi.createGame();
      console.log("✅ Game creation response:", response);

      const { gameCode: newGameCode } = response;
      setGameCode(newGameCode);
      setControlMessage(`Game created successfully! Code: ${newGameCode}. Each question allows only 1 attempt.`);

      setupSocket(newGameCode);
    } catch (error: unknown) {
      console.error("❌ Error creating game:", error);

      if (error instanceof Error) {
        if (
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("ERR_NETWORK")
        ) {
          setControlMessage(
            "Cannot connect to server. Make sure the server is running on http://localhost:5001"
          );
        } else {
          setControlMessage(`Error: ${error.message}`);
        }
      } else {
        setControlMessage("An unexpected error occurred. Please try again.");
      }
    }
    setIsLoading(false);
  };

  const handleStartGame = () => {
    console.log("🎮 Starting single-attempt game with question tracking...");

    if (gameCode && socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("start-game", { gameCode });
    } else {
      console.error("❌ Cannot start game - missing requirements");
      setControlMessage("Cannot start game. Please check your connection.");
    }
  };

  const handleContinueToNextRound = () => {
    if (gameCode && socketRef.current) {
      socketRef.current.emit("continue-to-next-round", { gameCode });
    }
  };

  const handleForceNextQuestion = () => {
    if (gameCode && socketRef.current) {
      socketRef.current.emit("force-next-question", { gameCode });
    }
  };

  const handleRevealAllAnswers = () => {
    if (socketRef.current && gameCode && game && game.status === "active") {
      socketRef.current.emit("reveal-all-answers", { gameCode });
      setControlMessage("Revealing all answers for this question...");
    }
  };

  const handleResetGame = () => {
    if (gameCode && socketRef.current) {
      socketRef.current.emit("reset-game", { gameCode });
    }
  };

  // Request updated player list periodically when in waiting state
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (game && game.status === "waiting" && socketRef.current) {
      socketRef.current.emit("get-players", { gameCode });

      interval = setInterval(() => {
        if (socketRef.current?.connected) {
          socketRef.current.emit("get-players", { gameCode });
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [game?.status, gameCode]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const currentQuestion = game ? getCurrentQuestion(game) : null;

  // Not created yet - show creation form
  if (!gameCode) {
    return (
      <PageLayout>
        <GameCreationForm onCreateGame={createGame} isLoading={isLoading} />
        {controlMessage && (
          <div className="mt-4 text-center">
            <div className="text-blue-400">{controlMessage}</div>
          </div>
        )}
      </PageLayout>
    );
  }

  // Game created but waiting for players
  if (game && game.status === "waiting") {
    return (
      <PageLayout gameCode={gameCode}>
        <AnimatedCard>
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-8 text-center">
              <h2 className="text-3xl font-bold mb-6">Game Setup</h2>

              <div className="mb-8">
                <p className="text-lg text-slate-300 mb-2">
                  Share this code with contestants:
                </p>
                <div className="text-5xl font-mono font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                  {gameCode}
                </div>
                <p className="text-sm text-slate-400 mt-4">
                  ⭐ Each question allows only 1 attempt!
                </p>
              </div>

              <Button
                onClick={handleStartGame}
                variant="success"
                size="xl"
                disabled={game.players.length < 2}
                icon={<span className="text-2xl">🎮</span>}
                className="mb-6"
              >
                BEGIN SINGLE-ATTEMPT COMPETITION
              </Button>

              {game.players && game.players.length > 0 && (
                <PlayerList
                  players={game.players}
                  teams={game.teams}
                  variant="waiting"
                />
              )}
            </div>
          </div>
        </AnimatedCard>
      </PageLayout>
    );
  }

  // If we have a gameCode but no game, show a loading state
  if (gameCode && !game) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-full">
          <div className="glass-card p-8 text-center">
            <LoadingSpinner />
            <p className="mt-4 text-slate-400">Setting up single-attempt game with question tracking...</p>
            <p className="text-sm text-slate-500 mt-2">Game Code: {gameCode}</p>
            {controlMessage && (
              <p className="text-sm text-blue-400 mt-2">{controlMessage}</p>
            )}
          </div>
        </div>
      </PageLayout>
    );
  }

  // Round Summary Screen
  if (game?.status === "round-summary" && roundSummary) {
    return (
      <PageLayout gameCode={gameCode} timer={timer} variant="game">
        <div className="p-4">
          <RoundSummaryComponent
            roundSummary={roundSummary}
            teams={game.teams}
            isHost={true}
            isGameFinished={game.currentRound >= 3}
            onContinueToNextRound={handleContinueToNextRound}
            onBackToHome={() => (window.location.href = ROUTES.HOME)}
          />
        </div>
      </PageLayout>
    );
  }

  // Active Game - SINGLE-ATTEMPT LAYOUT WITH CLEAN CONTROLS
  if (game?.status === "active" && currentQuestion) {
    // Calculate questions answered for each team in current round
    const team1QuestionsAnswered = game.gameState.questionsAnswered.team1 || 0;
    const team2QuestionsAnswered = game.gameState.questionsAnswered.team2 || 0;

    return (
      <PageLayout gameCode={gameCode} timer={timer} variant="game">
        {/* Left Team Panel with Question Data */}
        <div className="w-48 flex-shrink-0">
          <TeamPanel
            team={game.teams[0]}
            teamIndex={0}
            isActive={game.teams[0]?.active}
            showMembers={true}
            currentRound={game.currentRound}
            roundScore={game.teams[0].currentRoundScore}
            questionsAnswered={team1QuestionsAnswered}
            questionData={getTeamQuestionData("team1")}
          />
        </div>

        {/* Center Game Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Turn Indicator */}
          <TurnIndicator
            currentTeam={game.gameState.currentTurn}
            teams={game.teams}
            currentQuestion={currentQuestion}
            questionsAnswered={game.gameState.questionsAnswered}
            round={game.currentRound}
            variant="compact"
          />

          {/* Game Board */}
          <GameBoard
            game={game}
            variant="host"
            isHost={true}
            controlMessage={controlMessage}
          />

          {/* Host Controls - CLEAN VERSION */}
          <div className="glass-card p-3 mt-2">
            <div className="text-center mb-2">
              <div className="text-sm text-slate-400 mb-2">Host Controls</div>
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                onClick={handleRevealAllAnswers}
                variant="primary"
                size="sm"
                className="text-xs py-1 px-3"
              >
                👁️ Reveal All
              </Button>
              <Button
                onClick={handleForceNextQuestion}
                variant="secondary"
                size="sm"
                className="text-xs py-1 px-3"
              >
                ⏭️ Force Next
              </Button>
              <Button
                onClick={handleResetGame}
                variant="secondary"
                size="sm"
                className="text-xs py-1 px-3"
              >
                🔄 Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Right Team Panel with Question Data */}
        <div className="w-48 flex-shrink-0">
          <TeamPanel
            team={game.teams[1]}
            teamIndex={1}
            isActive={game.teams[1]?.active}
            showMembers={true}
            currentRound={game.currentRound}
            roundScore={game.teams[1].currentRoundScore}
            questionsAnswered={team2QuestionsAnswered}
            questionData={getTeamQuestionData("team2")}
          />
        </div>
      </PageLayout>
    );
  }

  // Results Screen
  if (game?.status === "finished") {
    return (
      <PageLayout gameCode={gameCode} timer={timer}>
        <GameResults
          teams={game.teams}
          onCreateNewGame={createGame}
          showCreateNewGame={true}
        />
      </PageLayout>
    );
  }

  // Fallback for any unexpected game state
  return (
    <PageLayout gameCode={gameCode}>
      <AnimatedCard>
        <div className="glass-card p-8 text-center">
          <p className="text-xl font-bold mb-4">Unexpected Game State</p>
          <p className="text-slate-400 mb-4">
            The game is in an unexpected state. Please refresh the page or
            create a new game.
          </p>
          <Link to={ROUTES.HOME}>
            <Button variant="primary">Back to Home</Button>
          </Link>
        </div>
      </AnimatedCard>
    </PageLayout>
  );
};

export default HostGamePage;