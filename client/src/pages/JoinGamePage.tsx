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
import PlayerStatus from "../components/game/PlayerStatus";
import BuzzerButton from "../components/game/BuzzerButton";
import AnswerInput from "../components/game/AnswerInput";
import Button from "../components/common/Button";

// Import hooks and services
import { useSocket } from "../hooks/useSocket";
import gameApi from "../services/gameApi";

// Import types and constants
import { Game, Player } from "../types";
import { ROUTES } from "../utils/constants";

const JoinGamePage: React.FC = () => {
  const [gameCode, setGameCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [game, setGame] = useState<Game | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [answer, setAnswer] = useState("");
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [buzzCooldown, setBuzzCooldown] = useState(false);
  const [buzzFeedback, setBuzzFeedback] = useState("");

  const {
    connect,
    playerJoinGame,
    joinTeam,
    buzzIn,
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
        console.log("Updating local player with teamId:", data.teamId);
        setPlayer({
          ...player,
          teamId: data.teamId,
        });
      }
    },
    onGameStarted: (data: any) => {
      console.log("Game started event received:", data);

      const updatedPlayer = data.game.players.find(
        (p: Player) => player && p.id === player.id
      );

      if (updatedPlayer && player) {
        console.log("Updating player state on game start:", updatedPlayer);
        setPlayer({
          ...player,
          teamId: updatedPlayer.teamId || player.teamId,
        });
      }

      setGame(data.game);
      setHasBuzzed(false);
      setBuzzFeedback("");
    },
    onPlayerBuzzed: (data: any) => {
      console.log("Player buzzed event received:", data);
      if (data.game) {
        setGame(data.game);
      }

      // Update local buzz state
      if (player && data.playerId === player.id) {
        setHasBuzzed(true);
      } else if (player && data.teamId === player.teamId) {
        setHasBuzzed(true);
      }
    },
    onBuzzerCleared: (data: any) => {
      console.log("Buzzer cleared event received:", data);
      if (data.game) {
        setGame(data.game);
      }
      setAnswer("");
      setHasBuzzed(false);
      setBuzzFeedback("");
    },
    onAnswerRevealed: (data: any) => {
      console.log("Answer revealed event received:", data);
      if (data.game) {
        setGame(data.game);
      }
      setAnswer("");
    },
    onWrongAnswer: (data: any) => {
      console.log("Wrong answer event received:", data);
      if (data.game) {
        setGame(data.game);
      }
      setAnswer("");
    },
    onTeamSwitched: (data: any) => {
      console.log("Team switched event received:", data);
      if (data.game) {
        setGame(data.game);
      }

      setAnswer("");
      setHasBuzzed(false);
      setBuzzFeedback("");
    },
    onNextQuestion: (data: any) => {
      console.log("Next question event received:", data);

      if (data.game) {
        setGame((prevGame) => {
          if (!prevGame) return null;
          return {
            ...data.game,
            currentQuestionIndex: data.game.currentQuestionIndex,
            currentRound: data.game.currentRound,
            questions: data.game.questions,
          };
        });
      }

      setAnswer("");
      setHasBuzzed(false);
      setBuzzFeedback("");
    },
    onGameOver: (data: any) => {
      console.log("Game over event received:", data);
      if (data.game) {
        setGame(data.game);
      }
      setAnswer("");
      setHasBuzzed(false);
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
      setAnswer("");
    },
    onBuzzTooLate: (data: any) => {
      console.log("Buzz too late:", data);
      setBuzzFeedback(
        `Too late! ${data.firstBuzzer} (${data.firstTeam}) buzzed first!`
      );
      setTimeout(() => setBuzzFeedback(""), 3000);
    },
    onBuzzRejected: (data: any) => {
      console.log("Buzz rejected:", data);
      setBuzzCooldown(false);
      setBuzzFeedback(data.message || "Buzz rejected");
      setTimeout(() => setBuzzFeedback(""), 3000);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.code, player?.id]);

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

  const handleBuzzIn = () => {
    if (player && game && !hasBuzzed && !buzzCooldown) {
      console.log("Buzzing in for team!");
      setBuzzCooldown(true);

      // Buzz in first
      buzzIn(game.code, player.id);

      // Set cooldown to prevent rapid buzzing
      setTimeout(() => setBuzzCooldown(false), 1000);
    }
  };

  const handleSubmitAnswer = () => {
    if (player && game && answer.trim()) {
      console.log("Submitting answer:", answer.trim());
      submitAnswer(game.code, player.id, answer.trim());
      setAnswer("");
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

  // Active game - show landscape player interface
  if (game && game.status === "active") {
    const myTeam = game.teams.find((team) => team.id === player.teamId);

    // Determine input state for this specific player
    const myTeamHasBuzzed = game.currentBuzzer?.teamId === player.teamId;
    const opponentTeamHasBuzzed =
      game.currentBuzzer?.teamId && game.currentBuzzer.teamId !== player.teamId;
    const noBuzzer = !game.currentBuzzer;

    // Player can input if their team has buzzed and input is enabled
    const canSubmitAnswer =
      myTeamHasBuzzed &&
      game.gameState?.inputEnabled &&
      game.gameState?.activeTeamId === player.teamId;

    // Player can buzz if no one has buzzed yet
    const canBuzz = noBuzzer && !hasBuzzed && player.teamId;

    return (
      <PageLayout gameCode={game.code} variant="game">
        {/* Left Side - Game Board */}
        <GameBoard game={game} variant="player" />

        {/* Right Side - Player Controls */}
        <div className="w-80 flex-shrink-0 flex flex-col">
          {/* Player Status */}
          <PlayerStatus
            playerName={player.name}
            team={myTeam || null}
            isActiveTeam={player.teamId === game.gameState?.activeTeamId}
          />

          {/* Buzzer Status */}
          {game.currentBuzzer && (
            <div className="glass-card p-4 mb-4">
              <div
                className={`text-center p-3 rounded border-2 ${
                  myTeamHasBuzzed
                    ? "border-green-500/50 bg-green-500/10"
                    : "border-orange-500/50 bg-orange-500/10"
                }`}
              >
                <h3 className="font-semibold mb-1">
                  🔔 {game.currentBuzzer.teamName} Buzzed!
                </h3>
                <p className="text-sm text-slate-400">
                  {game.currentBuzzer.playerName}
                </p>
              </div>
            </div>
          )}

          {/* Player Controls */}
          {player.teamId ? (
            <div className="flex-1 flex flex-col">
              {/* Buzz Button - Only show when no one has buzzed */}
              {noBuzzer && (
                <div className="mb-4">
                  <BuzzerButton
                    onBuzz={handleBuzzIn}
                    disabled={!canBuzz}
                    teamName={myTeam?.name}
                    loading={buzzCooldown}
                  />
                  {buzzFeedback && (
                    <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded">
                      <p className="text-red-300 text-xs">{buzzFeedback}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Answer Input - Only show after buzzing */}
              {(myTeamHasBuzzed || opponentTeamHasBuzzed) && (
                <AnswerInput
                  answer={answer}
                  onAnswerChange={setAnswer}
                  onSubmit={handleSubmitAnswer}
                  canSubmit={canSubmitAnswer}
                  isMyTeam={myTeamHasBuzzed}
                  teamName={myTeam?.name}
                  strikes={myTeam?.strikes}
                />
              )}

              {/* Team Scores - Bottom section */}
              <PlayerList
                players={game.players}
                teams={game.teams}
                currentPlayerId={player.id}
                variant="game"
              />
            </div>
          ) : (
            // Player not on a team
            <div className="glass-card p-4 border-2 border-red-400/50 bg-red-400/10">
              <p className="text-red-300 font-medium text-center text-sm">
                You didn't select a team before the game started. Please wait
                for the next game.
              </p>
            </div>
          )}
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
