import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Import components
import PageLayout from "../components/layout/PageLayout";
import AnimatedCard from "../components/common/AnimatedCard";
import JoinGameForm from "../components/forms/JoinGameForm";
import TeamSelection from "../components/forms/TeamSelection";
import GameBoard from "../components/game/GameBoard";
import GameResults from "../components/game/GameResults";
import PlayerList from "../components/game/PlayerList";
import TeamPanel from "../components/game/TeamPanel";
import Button from "../components/common/Button";
import TurnIndicator from "../components/game/TurnIndicator";
import RoundSummaryComponent from "../components/game/RoundSummaryComponent";

// Import hooks and services
import { useSocket } from "../hooks/useSocket";
import gameApi from "../services/gameApi";

// Import types and constants
import { Game, Player, RoundSummary } from "../types";
import { ROUTES } from "../utils/constants";

const JoinGamePage: React.FC = () => {
  const [gameCode, setGameCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [game, setGame] = useState<Game | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [answer, setAnswer] = useState("");
  const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null);
  const [gameMessage, setGameMessage] = useState("");

  const {
    connect,
    playerJoinGame,
    joinTeam,
    submitAnswer,
    requestPlayersList,
  } = useSocket({
    onPlayerJoined: (data: any) => {
      console.log("Player joined event received:", data);

      if (game) {
        setGame((prevGame) => {
          if (!prevGame) return null;

          const playerExists = prevGame.players.some(
            (p) => p.id === data.player.id
          );
          if (playerExists) {
            return {
              ...prevGame,
              players: prevGame.players.map((p) =>
                p.id === data.player.id ? { ...p, ...data.player } : p
              ),
            };
          }

          return {
            ...prevGame,
            players: [...prevGame.players, data.player],
          };
        });
      }
    },
    onTeamUpdated: (data: any) => {
      console.log("Team updated event received:", data);
      setGame(data.game);

      if (player && data.playerId === player.id) {
        setPlayer({
          ...player,
          teamId: data.teamId,
        });
      }
    },
    onGameStarted: (data: any) => {
      console.log("Turn-based game started:", data);

      const updatedPlayer = data.game.players.find(
        (p: Player) => player && p.id === player.id
      );

      if (updatedPlayer && player) {
        setPlayer({
          ...player,
          teamId: updatedPlayer.teamId || player.teamId,
        });
      }

      setGame(data.game);
      setGameMessage(
        `Game started! ${
          data.activeTeam === "team1" ? "Team 1" : "Team 2"
        } goes first.`
      );
    },
    onAnswerCorrect: (data: any) => {
      console.log("Answer correct event received:", data);
      setGame(data.game);
      setAnswer("");
      setGameMessage(
        `✅ ${data.playerName} answered correctly! +${data.pointsAwarded} points`
      );
    },
    onAnswerIncorrect: (data: any) => {
      console.log("Answer incorrect event received:", data);
      setGame(data.game);
      setAnswer("");
      setGameMessage(
        `❌ ${data.playerName} answered incorrectly. Strike ${data.strikes}/3`
      );
    },
    onTurnChanged: (data: any) => {
      console.log("Turn changed event received:", data);
      setGame(data.game);
      setGameMessage(`It's now ${data.teamName}'s turn!`);
    },
    onNextQuestion: (data: any) => {
      console.log("Next question event received:", data);
      setGame(data.game);
      setAnswer("");
      if (data.sameTeam) {
        setGameMessage("Same team continues with their next question.");
      } else {
        setGameMessage("Moving to next question.");
      }
    },
    onRoundComplete: (data: any) => {
      console.log("Round complete event received:", data);
      setGame(data.game);
      setRoundSummary(data.roundSummary);
      setGameMessage(`Round ${data.roundSummary.round} completed!`);
    },
    onRoundStarted: (data: any) => {
      console.log("Round started event received:", data);
      setGame(data.game);
      setRoundSummary(null);
      setGameMessage(
        `Round ${data.round} started! ${
          data.activeTeam === "team1" ? "Team 1" : "Team 2"
        } goes first.`
      );
    },
    onGameOver: (data: any) => {
      console.log("Game over event received:", data);
      setGame(data.game);
      setAnswer("");
      setGameMessage("Game finished!");
    },
    onPlayersListReceived: (data: any) => {
      console.log("Players list received:", data);
      if (game) {
        const updatedPlayer = data.players.find(
          (p: Player) => player && p.id === player.id
        );
        if (updatedPlayer && player) {
          setPlayer({
            ...player,
            teamId: updatedPlayer.teamId || player.teamId,
          });
        }

        setGame((prevGame) => {
          if (!prevGame) return null;
          return {
            ...prevGame,
            players: data.players,
          };
        });
      }
    },
    onAnswerRejected: (data: any) => {
      console.log("Answer rejected:", data);
      setError(data.message || "Answer rejected");
      setTimeout(() => setError(""), 3000);
    },
  });

  // Periodically request updated player list from server
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (game && player) {
      requestPlayersList(game.code);

      interval = setInterval(() => {
        requestPlayersList(game.code);
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [game?.code, player?.id, requestPlayersList]);

  const joinGame = async () => {
    if (!gameCode.trim() || !playerName.trim()) {
      setError("Please enter both game code and your name");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await gameApi.joinGame({
        gameCode: gameCode.toUpperCase(),
        playerName: playerName.trim(),
      });

      const { playerId, game: gameData } = response;
      setPlayer({
        id: playerId,
        name: playerName.trim(),
        gameCode: gameCode.toUpperCase(),
        connected: true,
        teamId: undefined,
      });
      setGame(gameData);

      connect();
      playerJoinGame(gameCode.toUpperCase(), playerId);
    } catch (error: any) {
      console.error("Error joining game:", error);
      setError(error.response?.data?.error || "Failed to join game");
    }
    setIsLoading(false);
  };

  const handleJoinTeam = (teamId: string) => {
    if (player && game) {
      console.log("Joining team:", teamId);

      setPlayer({
        ...player,
        teamId: teamId,
      });

      joinTeam(game.code, player.id, teamId);
    }
  };

  const handleSubmitAnswer = () => {
    if (player && game && answer.trim()) {
      console.log("Submitting answer:", answer.trim());
      submitAnswer(game.code, player.id, answer.trim());
      setError(""); // Clear any previous errors
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && answer.trim()) {
      handleSubmitAnswer();
    }
  };

  // Initial render - show join form
  if (!player) {
    return (
      <PageLayout>
        <JoinGameForm
          gameCode={gameCode}
          playerName={playerName}
          onGameCodeChange={setGameCode}
          onPlayerNameChange={setPlayerName}
          onJoinGame={joinGame}
          isLoading={isLoading}
          error={error}
        />
      </PageLayout>
    );
  }

  // Waiting for game to start
  if (game && game.status === "waiting") {
    return (
      <PageLayout gameCode={game.code}>
        <AnimatedCard>
          <div className="max-w-4xl mx-auto">
            <TeamSelection
              teams={game.teams}
              selectedTeamId={player.teamId}
              onSelectTeam={handleJoinTeam}
              playerName={player.name}
            />

            {game.players.length > 0 && (
              <PlayerList
                players={game.players}
                teams={game.teams}
                currentPlayerId={player.id}
                variant="waiting"
              />
            )}
          </div>
        </AnimatedCard>
      </PageLayout>
    );
  }

  // Round Summary Screen for Players
  if (game && game.status === "round-summary" && roundSummary) {
    return (
      <PageLayout gameCode={game.code} variant="game">
        <div className="p-4">
          <RoundSummaryComponent
            roundSummary={roundSummary}
            teams={game.teams}
            isHost={false}
            isGameFinished={game.currentRound >= 3}
          />
        </div>
      </PageLayout>
    );
  }

  // Active game - TURN-BASED LAYOUT
  if (game && game.status === "active") {
    const myTeam = game.teams.find((team) => team.id === player.teamId);
    const isMyTurn = myTeam && myTeam.active;
    const canAnswer = isMyTurn && player.teamId;

    return (
      <PageLayout gameCode={game.code} variant="game">
        {/* Left Team Panel */}
        <div className="w-48 flex-shrink-0">
          <TeamPanel
            team={game.teams[0]}
            teamIndex={0}
            isActive={game.teams[0]?.active}
            showMembers={false}
            playerName={
              player.teamId === game.teams[0].id ? player.name : undefined
            }
            isPlayerTeam={player.teamId === game.teams[0].id}
          />
        </div>

        {/* Center Game Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Turn Indicator */}
          <TurnIndicator
            currentTeam={game.gameState.currentTurn}
            teams={game.teams}
            currentQuestion={game.questions[game.currentQuestionIndex]}
            questionsAnswered={game.gameState.questionsAnswered}
            round={game.currentRound}
            variant="compact"
          />

          {/* Game Board */}
          <GameBoard game={game} variant="player" />

          {/* Answer Input Area - COMPLETELY FIXED INPUT STYLING */}
          <div className="glass-card p-4 mt-2">
            {player.teamId ? (
              <div>
                {/* Game Status Message */}
                {gameMessage && (
                  <div className="mb-3 p-2 bg-blue-500/20 border border-blue-500/50 rounded">
                    <p className="text-blue-300 text-sm text-center">
                      {gameMessage}
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-3 p-2 bg-red-500/20 border border-red-500/50 rounded">
                    <p className="text-red-300 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Answer Input */}
                <div className="text-center">
                  {isMyTurn ? (
                    <div className="max-w-md mx-auto">
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-green-300 mb-2">
                          🎯 Your team's turn!
                        </h3>
                        <p className="text-sm text-green-200">
                          Question{" "}
                          {(game.gameState.questionsAnswered[
                            game.gameState.currentTurn!
                          ] || 0) + 1}{" "}
                          of 3 • Round {game.currentRound}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {/* COMPLETELY FIXED: Highly visible input with dark background */}
                        <input
                          type="text"
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your answer here..."
                          disabled={!canAnswer}
                          autoFocus={true}
                          className="w-full px-4 py-3 text-lg font-semibold border-2 border-green-400 rounded-lg focus:outline-none focus:border-green-300 focus:ring-2 focus:ring-green-300/50 transition-all"
                          style={{
                            backgroundColor: "#1f2937", // Dark gray background
                            color: "#ffffff", // White text
                            border: "2px solid #10b981", // Green border
                          }}
                        />

                        <button
                          onClick={handleSubmitAnswer}
                          disabled={!answer.trim() || !canAnswer}
                          className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all ${
                            canAnswer && answer.trim()
                              ? "bg-green-600 hover:bg-green-700 text-white shadow-lg"
                              : "bg-gray-500 text-gray-300 cursor-not-allowed"
                          }`}
                        >
                          Submit Answer
                        </button>
                      </div>

                      <p className="text-xs text-green-200 mt-2">
                        Strike {myTeam?.strikes || 0}/3 • Enter your answer
                        above
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-600/20 rounded-lg">
                      <p className="text-gray-300 font-medium mb-2">
                        ⏳{" "}
                        {game.teams.find((t) => t.active)?.name || "Other team"}{" "}
                        is answering...
                      </p>
                      <p className="text-sm text-gray-400">
                        {myTeam
                          ? `${myTeam.name} will answer after the other team completes their 3 questions`
                          : "Wait for your turn"}
                      </p>

                      {/* Progress indicator for current team */}
                      {game.gameState.currentTurn && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-400 mb-1">
                            {game.teams.find((t) => t.active)?.name} Progress
                          </div>
                          <div className="flex justify-center space-x-1">
                            {[1, 2, 3].map((qNum) => (
                              <div
                                key={qNum}
                                className={`w-3 h-3 rounded-full ${
                                  qNum <=
                                  (game.gameState.questionsAnswered[
                                    game.gameState.currentTurn!
                                  ] || 0)
                                    ? "bg-green-500"
                                    : qNum ===
                                      (game.gameState.questionsAnswered[
                                        game.gameState.currentTurn!
                                      ] || 0) +
                                        1
                                    ? "bg-yellow-500 animate-pulse"
                                    : "bg-slate-600"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 border-2 border-red-400/50 bg-red-400/10 rounded text-center">
                <p className="text-red-300 font-medium text-sm">
                  You didn't select a team before the game started. Please wait
                  for the next game.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Team Panel */}
        <div className="w-48 flex-shrink-0">
          <TeamPanel
            team={game.teams[1]}
            teamIndex={1}
            isActive={game.teams[1]?.active}
            showMembers={false}
            playerName={
              player.teamId === game.teams[1].id ? player.name : undefined
            }
            isPlayerTeam={player.teamId === game.teams[1].id}
          />
        </div>
      </PageLayout>
    );
  }

  // Game finished - show results
  if (game && game.status === "finished") {
    return (
      <PageLayout gameCode={game.code}>
        <GameResults teams={game.teams} />
      </PageLayout>
    );
  }

  // Fallback for any unexpected game state
  return (
    <PageLayout gameCode={game?.code}>
      <AnimatedCard>
        <div className="glass-card p-8 text-center">
          <p className="text-xl font-bold mb-4">Unexpected Game State</p>
          <p className="text-slate-400 mb-4">
            The game is in an unexpected state. Please refresh the page or
            return to home.
          </p>
          <Link to={ROUTES.HOME}>
            <Button variant="primary">Back to Home</Button>
          </Link>
        </div>
      </AnimatedCard>
    </PageLayout>
  );
};

export default JoinGamePage;
