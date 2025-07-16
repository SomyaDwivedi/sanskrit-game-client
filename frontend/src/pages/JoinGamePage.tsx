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

      // Auto-assign to team with fewer members
      const team1Count = gameData.players.filter(
        (p: Player) => p.teamId === gameData.teams[0].id
      ).length;

      const team2Count = gameData.players.filter(
        (p: Player) => p.teamId === gameData.teams[1].id
      ).length;

      const autoTeamId =
        team1Count <= team2Count ? gameData.teams[0].id : gameData.teams[1].id;

      setPlayer({
        id: playerId,
        name: playerName.trim(),
        gameCode: gameCode.toUpperCase(),
        connected: true,
        teamId: autoTeamId, // Auto-assign team
      });
      setGame(gameData);

      connect();
      playerJoinGame(gameCode.toUpperCase(), playerId);

      // Auto-join the team
      setTimeout(() => {
        joinTeam(gameCode.toUpperCase(), playerId, autoTeamId);
      }, 500);
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

    // Calculate questions answered for each team in current round
    const team1QuestionsAnswered = game.gameState.questionsAnswered.team1 || 0;
    const team2QuestionsAnswered = game.gameState.questionsAnswered.team2 || 0;

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
            currentRound={game.currentRound}
            roundScore={game.teams[0].currentRoundScore}
            questionsAnswered={team1QuestionsAnswered}
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
                        <h3 className="text-lg font-semibold text-green-300 mb-2 animate-pulse">
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
                        <div className="relative">
                          <input
                            type="text"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your answer here..."
                            disabled={!canAnswer}
                            autoFocus={true}
                            className="w-full px-4 py-3 text-lg font-semibold rounded-lg 
                     bg-white text-gray-900 
                     border-2 border-green-400 
                     focus:outline-none focus:border-green-300 
                     focus:ring-4 focus:ring-green-300/30 
                     transition-all shadow-md
                     placeholder-gray-500"
                          />
                          {answer.length > 0 && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                              {answer.length} chars
                            </span>
                          )}
                        </div>

                        <button
                          onClick={handleSubmitAnswer}
                          disabled={!answer.trim() || !canAnswer}
                          className={`w-full py-3 px-6 rounded-lg font-bold text-lg 
                     transition-all transform shadow-lg
                     ${
                       canAnswer && answer.trim()
                         ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white hover:scale-105 active:scale-95"
                         : "bg-gray-500 text-gray-300 cursor-not-allowed opacity-60"
                     }`}
                        >
                          {answer.trim()
                            ? "Submit Answer"
                            : "Type an answer..."}
                        </button>
                      </div>

                      <div className="mt-3 flex justify-center items-center gap-4">
                        <div className="text-xs text-green-200">
                          Strikes: {myTeam?.strikes || 0}/3
                        </div>
                        <div className="text-xs text-gray-400">
                          Press Enter to submit
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-700/30 rounded-lg backdrop-blur">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-white"></div>
                        <p className="text-gray-300 font-medium">
                          {game.teams.find((t) => t.active)?.name ||
                            "Other team"}{" "}
                          is answering...
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        Question{" "}
                        {(game.gameState.questionsAnswered[
                          game.gameState.currentTurn!
                        ] || 0) + 1}{" "}
                        of 3 • Round {game.currentRound}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Your team: {myTeam?.name} • Score: {myTeam?.score || 0}
                      </div>
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
            currentRound={game.currentRound}
            roundScore={game.teams[1].currentRoundScore}
            questionsAnswered={team2QuestionsAnswered}
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