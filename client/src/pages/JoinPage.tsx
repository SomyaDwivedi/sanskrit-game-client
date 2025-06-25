import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AnimatedCard from "../components/AnimatedCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAudio } from "../hooks/useAudio";
import { useSocket } from "../hooks/useSocket";
import { Game, Player, Question } from "../types";
import { ROUTES, GAME_CONFIG } from "../utils/constants";

const JoinPage: React.FC = () => {
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

  const { soundEnabled, toggleSound, playSound } = useAudio();

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
      playSound("buzz");

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
      playSound("correct");

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
      setHasBuzzed(false); // Reset buzz state for new game
      setBuzzFeedback(""); // Clear any feedback
    },
    onPlayerBuzzed: (data: any) => {
      console.log("Player buzzed event received:", data);
      if (data.game) {
        setGame(data.game);
      }

      // Update local buzz state
      if (player && data.playerId === player.id) {
        setHasBuzzed(true);
        playSound("buzz");
      } else if (player && data.teamId === player.teamId) {
        setHasBuzzed(true);
        playSound("teamBuzz");
      } else {
        playSound("otherBuzz");
      }
    },
    onBuzzerCleared: (data: any) => {
      console.log("Buzzer cleared event received:", data);
      if (data.game) {
        setGame(data.game);
      }
      setAnswer("");
      setHasBuzzed(false); // Reset buzz state
      setBuzzFeedback(""); // Clear feedback

      if (data.reason === "correct-answer-continue") {
        playSound("correct");
      }
    },
    onAnswerRevealed: (data: any) => {
      console.log("Answer revealed event received:", data);
      if (data.game) {
        setGame(data.game);
      }
      setAnswer("");

      if (player && data.playerName === player.name) {
        playSound("correct");
      } else if (
        player &&
        game &&
        data.teamName === game.teams.find((t) => t.id === player.teamId)?.name
      ) {
        playSound("teamCorrect");
      } else {
        playSound("otherCorrect");
      }
    },
    onWrongAnswer: (data: any) => {
      console.log("Wrong answer event received:", data);
      if (data.game) {
        setGame(data.game);
      }

      if (player && data.playerName === player.name) {
        playSound("wrong");
      } else if (
        player &&
        game &&
        data.teamName === game.teams.find((t) => t.id === player.teamId)?.name
      ) {
        playSound("teamWrong");
      } else {
        playSound("otherWrong");
      }

      setAnswer("");
    },
    onTeamSwitched: (data: any) => {
      console.log("Team switched event received:", data);
      if (data.game) {
        setGame(data.game);
      }

      if (data.activeTeamId === player?.teamId) {
        playSound("secondChance");
      } else {
        playSound("otherBuzz");
      }

      setAnswer("");
      setHasBuzzed(false); // Reset buzz state on team switch
      setBuzzFeedback(""); // Clear feedback
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
      setHasBuzzed(false); // Reset buzz state for new question
      setBuzzFeedback(""); // Clear feedback
      playSound("nextQuestion");
    },
    onGameOver: (data: any) => {
      console.log("Game over event received:", data);
      if (data.game) {
        setGame(data.game);
      }
      playSound("applause");
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
      playSound("error");
      setAnswer("");
    },
    onBuzzTooLate: (data: any) => {
      console.log("Buzz too late:", data);
      playSound("error");
      setBuzzFeedback(
        `Too late! ${data.firstBuzzer} (${data.firstTeam}) buzzed first!`
      );
      setTimeout(() => setBuzzFeedback(""), 3000);
    },
    onBuzzRejected: (data: any) => {
      console.log("Buzz rejected:", data);
      playSound("error");
      setBuzzCooldown(false); // Reset cooldown if buzz was rejected
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
      const response = await axios.post(
        `${GAME_CONFIG.SOCKET_URL}/api/join-game`,
        {
          gameCode: gameCode.toUpperCase(),
          playerName: playerName.trim(),
        }
      );

      const { playerId, game: gameData } = response.data;
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

      playSound("buzz");
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
      playSound("buzz");
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
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header soundEnabled={soundEnabled} onToggleSound={toggleSound} />

        <main className="flex-1 container mx-auto px-4 py-8">
          <AnimatedCard>
            <div className="max-w-md mx-auto">
              <div className="glass-card p-8 text-center">
                <div className="flex flex-col items-center mb-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4 flex items-center justify-center text-white text-4xl">
                    🎮
                  </div>
                  <p className="text-lg text-slate-300 mb-4">
                    Ready to join the competition?
                  </p>
                  <p className="text-slate-400">
                    Enter the game code and your name to get started
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-300">
                    {error}
                  </div>
                )}

                <div className="space-y-4 mb-8">
                  <div>
                    <label
                      htmlFor="gameCode"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Game Code
                    </label>
                    <input
                      id="gameCode"
                      type="text"
                      value={gameCode}
                      onChange={(e) =>
                        setGameCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter 6-digit code"
                      className="input-field text-center text-2xl font-mono tracking-wider"
                      maxLength={6}
                      disabled={isLoading}
                      onKeyPress={(e) => e.key === "Enter" && joinGame()}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="playerName"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Your Name
                    </label>
                    <input
                      id="playerName"
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter your name"
                      className="input-field"
                      disabled={isLoading}
                      onKeyPress={(e) => e.key === "Enter" && joinGame()}
                    />
                  </div>
                </div>

                <button
                  onClick={joinGame}
                  disabled={isLoading || !gameCode.trim() || !playerName.trim()}
                  className="btn-success py-4 px-12 text-xl mb-6"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-3">Joining...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl mr-3">🚀</span>
                      JOIN GAME
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

  // Waiting for game to start
  if (game && game.status === "waiting") {
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header
          gameCode={game.code}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />

        <main className="flex-1 container mx-auto px-4 py-8">
          <AnimatedCard>
            <div className="max-w-4xl mx-auto">
              <div className="glass-card p-8 text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">
                  Welcome {player.name}!
                </h2>
                <p className="text-slate-400 mb-6">
                  You've joined game{" "}
                  <span className="font-mono text-blue-400">{game.code}</span>
                </p>

                <div className="mb-6">
                  {!player.teamId ? (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">
                        Choose your team:
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {game.teams.map((team) => (
                          <AnimatedCard key={team.id}>
                            <button
                              onClick={() => handleJoinTeam(team.id)}
                              className={`w-full p-6 rounded-lg text-left transition-all ${
                                team.id === player.teamId
                                  ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-2 border-blue-500/50"
                                  : "bg-slate-800/50 hover:bg-slate-700/50"
                              }`}
                            >
                              <h4 className="text-lg font-semibold">
                                {team.name}
                              </h4>
                              <p className="text-slate-400">
                                Members: {team.members.join(", ")}
                              </p>
                            </button>
                          </AnimatedCard>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                        <p className="text-green-300 font-medium">
                          You've joined{" "}
                          {game.teams.find((t) => t.id === player.teamId)
                            ?.name || "a team"}
                          !
                        </p>
                      </div>
                      <p className="text-slate-400">
                        Waiting for the host to start the game...
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {game.players.length > 0 && (
                <AnimatedCard delay={200}>
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Connected Players ({game.players.length})
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {game.players.map((gamePlayer, index) => (
                        <div
                          key={gamePlayer.id}
                          className={`glass-card p-3 text-center ${
                            gamePlayer.id === player.id
                              ? "border-yellow-400/50 bg-yellow-400/10"
                              : ""
                          }`}
                        >
                          <span className="text-green-400 mr-2">●</span>
                          {gamePlayer.name}
                          {gamePlayer.id === player.id && (
                            <span className="text-yellow-400 ml-1">👤</span>
                          )}
                          {gamePlayer.teamId && (
                            <div className="text-xs mt-1 text-blue-300">
                              {
                                game.teams.find(
                                  (t) => t.id === gamePlayer.teamId
                                )?.name
                              }
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </AnimatedCard>
              )}
            </div>
          </AnimatedCard>
        </main>

        <Footer />
      </div>
    );
  }

  // Active game - show landscape player interface
  if (game && game.status === "active") {
    const currentQuestion = game.questions[game.currentQuestionIndex];
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
      <div className="h-screen flex flex-col gradient-bg overflow-hidden">
        <Header
          gameCode={game.code}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />

        <main className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Left Side - Game Board */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Question Header */}
            <div className="glass-card p-3 mb-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">
                  Round {game.currentRound} • {currentQuestion.category}
                </h2>
                <div className="text-sm text-slate-400">
                  Question {game.currentQuestionIndex + 1} of{" "}
                  {game.questions.length}
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="glass-card p-6 mb-4">
              <h2 className="text-xl font-semibold text-center mb-2">
                {currentQuestion.question}
              </h2>
              
            </div>

            {/* Answers Grid */}
            <div className="flex-1 grid grid-cols-2 gap-3 overflow-auto">
              {currentQuestion.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`glass-card p-3 transition-all ${
                    answer.revealed
                      ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400"
                      : "border-slate-500/50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">
                      {answer.revealed ? (
                        <span className="animate-reveal">
                          {index + 1}. {answer.text}
                        </span>
                      ) : (
                        `${index + 1}. ${"_".repeat(10)}`
                      )}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-bold ${
                        answer.revealed
                          ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black"
                          : "bg-slate-700"
                      }`}
                    >
                      {answer.revealed
                        ? answer.points * game.currentRound
                        : "?"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Player Controls */}
          <div className="w-80 flex-shrink-0 flex flex-col">
            {/* Player Status */}
            <div className="glass-card p-4 mb-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">{player.name}</h3>
                <div className="text-sm text-slate-400 mb-3">
                  {myTeam?.name} • Score: {myTeam?.score || 0}
                </div>
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3].map((strike) => (
                    <div
                      key={strike}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                        strike <= (myTeam?.strikes || 0)
                          ? "bg-red-500 border-red-500 text-white"
                          : "border-slate-500 text-slate-500"
                      }`}
                    >
                      {strike <= (myTeam?.strikes || 0) ? "✗" : ""}
                    </div>
                  ))}
                </div>
                <span
                  className={`px-3 py-1 rounded text-sm ${
                    player.teamId === game.gameState?.activeTeamId
                      ? "bg-green-600 text-white"
                      : "bg-slate-600 text-slate-300"
                  }`}
                >
                  {player.teamId === game.gameState?.activeTeamId
                    ? "Your Turn"
                    : "Waiting"}
                </span>
              </div>
            </div>

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
                  <div className="glass-card p-4 mb-4 text-center">
                    <h3 className="text-lg font-semibold mb-3 text-blue-300">
                      🚀 Ready to answer?
                    </h3>
                    <button
                      onClick={handleBuzzIn}
                      disabled={buzzCooldown}
                      className={`w-full text-xl font-bold py-6 px-8 rounded-xl transition-all transform ${
                        !buzzCooldown
                          ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105 shadow-lg shadow-red-500/25 active:scale-95 cursor-pointer"
                          : "bg-gray-600 cursor-not-allowed opacity-50"
                      }`}
                    >
                      {buzzCooldown ? (
                        "🔄 BUZZING..."
                      ) : (
                        <>
                          🔔 BUZZ IN!
                          <div className="text-sm font-normal mt-1">
                            For {myTeam?.name}
                          </div>
                        </>
                      )}
                    </button>
                    <p className="text-xs text-blue-200 mt-2">
                      First to buzz gets control!
                    </p>
                    {buzzFeedback && (
                      <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded">
                        <p className="text-red-300 text-xs">{buzzFeedback}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Answer Input - Only show after buzzing */}
                {(myTeamHasBuzzed || opponentTeamHasBuzzed) && (
                  <div className="glass-card p-4 flex-1">
                    <div className="text-center mb-4">
                      {myTeamHasBuzzed ? (
                        <h3 className="text-lg font-semibold text-green-300 mb-2">
                          🎯 Your team has control!
                        </h3>
                      ) : (
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">
                          ⏳ Other team is answering...
                        </h3>
                      )}
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder={
                          myTeamHasBuzzed
                            ? "Enter your answer..."
                            : "Wait for your turn..."
                        }
                        className={`input-field w-full ${
                          canSubmitAnswer
                            ? "border-green-400 bg-green-50/5"
                            : "border-slate-400 bg-slate-50/5 opacity-60"
                        }`}
                        disabled={!canSubmitAnswer}
                        onKeyPress={(e) => {
                          if (
                            e.key === "Enter" &&
                            canSubmitAnswer &&
                            answer.trim()
                          ) {
                            handleSubmitAnswer();
                          }
                        }}
                        autoFocus={!!canSubmitAnswer}
                      />

                      {myTeamHasBuzzed && (
                        <button
                          onClick={handleSubmitAnswer}
                          disabled={!answer.trim() || !canSubmitAnswer}
                          className={`w-full py-3 px-4 font-semibold rounded-lg transition-all ${
                            canSubmitAnswer && answer.trim()
                              ? "bg-green-600 hover:bg-green-500 text-white"
                              : "bg-gray-600 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          Submit Answer
                        </button>
                      )}
                    </div>

                    <div className="mt-3 text-center">
                      {myTeamHasBuzzed ? (
                        <p className="text-xs text-green-200">
                          Strike {myTeam?.strikes || 0}/3 • Enter your answer
                          above
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">
                          Wait for the other team to finish
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Team Scores - Bottom section */}
                <div className="glass-card p-3 mt-4">
                  <h4 className="text-sm font-semibold text-center mb-3 text-slate-300">
                    Team Scores
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {game.teams.map((team) => (
                      <div
                        key={team.id}
                        className={`p-2 rounded text-center text-sm ${
                          team.id === game.gameState?.activeTeamId
                            ? "bg-green-600/20 border border-green-400/30"
                            : team.id === player.teamId
                            ? "bg-yellow-600/20 border border-yellow-400/30"
                            : "bg-slate-600/20"
                        }`}
                      >
                        <div className="font-semibold">{team.name}</div>
                        <div className="text-lg font-bold">{team.score}</div>
                        <div className="text-xs opacity-75">
                          Strikes: {team.strikes}/3
                          {team.id === player.teamId && " (You)"}
                          {team.id === game.gameState?.activeTeamId &&
                            " • Active"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
        </main>
      </div>
    );
  }

  // Game finished - show results
  if (game && game.status === "finished") {
    const winner = game.teams.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );

    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header
          gameCode={game.code}
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
                      <div
                        key={team.id}
                        className={`glass-card p-6 ${
                          index === 0
                            ? "border-yellow-400/50 bg-yellow-400/10"
                            : ""
                        }`}
                      >
                        <h3 className="text-xl font-semibold mb-2">
                          {team.name}
                        </h3>
                        <p className="text-2xl font-bold mb-1">{team.score}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {team.members.map((member, i) => (
                            <span
                              key={i}
                              className="text-sm bg-slate-700 px-2 py-1 rounded"
                            >
                              {member}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>

                <Link to={ROUTES.HOME} className="btn-primary py-2 px-6">
                  Back to Home
                </Link>
              </div>
            </div>
          </AnimatedCard>
        </main>

        <Footer />
      </div>
    );
  }

  // Fallback for any unexpected game state
  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <Header
        gameCode={game?.code}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <AnimatedCard>
          <div className="glass-card p-8 text-center">
            <p className="text-xl font-bold mb-4">Unexpected Game State</p>
            <p className="text-slate-400 mb-4">
              The game is in an unexpected state. Please refresh the page or
              return to home.
            </p>
            <Link to={ROUTES.HOME} className="btn-primary py-2 px-6">
              Back to Home
            </Link>
          </div>
        </AnimatedCard>
      </main>
      <Footer />
    </div>
  );
};

export default JoinPage;
