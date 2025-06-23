import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AnimatedCard from "../components/AnimatedCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAudio } from "../hooks/useAudio";
import { useSocket } from "../hooks/useSocket";
import { Game, Player } from "../types";
import { ROUTES, GAME_CONFIG } from "../utils/constants";

const JoinPage: React.FC = () => {
  const [gameCode, setGameCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [game, setGame] = useState<Game | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const { soundEnabled, toggleSound, playSound } = useAudio();

 const { connect, playerJoinGame, joinTeam, buzzIn, submitAnswer } = useSocket(
  {
    onPlayerJoined: (data) => {
      playSound("buzz");
      console.log("Player joined:", data);
    },
    onGameStarted: (data) => {
      console.log("Game started event received:", data);
      setGame(data.game);
      // Reset buzzer state when game starts
      setCanBuzz(true);
      setHasBuzzed(false);
      playSound("correct");
    },
      onPlayerBuzzed: (data) => {
        setGame(data.game);
        playSound("buzz");
      },
      onAnswerRevealed: (data) => {
        setGame(data.game);
        playSound("correct");
      },
      onNextQuestion: (data) => {
        setGame(data.game);
        playSound("nextQuestion");
      },
      onGameOver: (data) => {
        setGame(data.game);
        playSound("applause");
      },
    }
  );

  const [answer, setAnswer] = useState("");
  const [canBuzz, setCanBuzz] = useState(false);
  const [hasBuzzed, setHasBuzzed] = useState(false);

  useEffect(() => {
    if (game && game.status === "active") {
      // Enable buzzer when game is active and no one has buzzed yet
      setCanBuzz(!game.currentBuzzer && !hasBuzzed);
    }
  }, [game, hasBuzzed]);

  const joinGame = async () => {
    if (!gameCode.trim() || !playerName.trim()) {
      setError("Please enter both game code and your name");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/join-game", {
        gameCode: gameCode.toUpperCase(),
        playerName: playerName.trim(),
      });

      const { playerId, game: gameData } = response.data;
      setPlayer({
        id: playerId,
        name: playerName.trim(),
        gameCode: gameCode.toUpperCase(),
        connected: true,
      });
      setGame(gameData);

      // Connect to socket and join game room
      const socket = connect();
      if (socket) {
        playerJoinGame(gameCode.toUpperCase(), playerId);
      }

      playSound("buzz");
    } catch (error: any) {
      console.error("Error joining game:", error);
      setError(error.response?.data?.error || "Failed to join game");
    }
    setIsLoading(false);
  };

  const handleJoinTeam = (teamId: string) => {
    if (player && game) {
      setSelectedTeam(teamId);
      joinTeam(game.code, player.id, teamId);
      playSound("buzz");
    }
  };

  const handleBuzzIn = () => {
    if (player && game && canBuzz) {
      setHasBuzzed(true);
      setCanBuzz(false);
      buzzIn(game.code, player.id);
    }
  };

  const handleSubmitAnswer = () => {
    if (player && game && answer.trim()) {
      submitAnswer(game.code, player.id, answer.trim());
      setAnswer("");
    }
  };

  const currentQuestion = game?.questions[game.currentQuestionIndex || 0];

  // Not joined yet - show join form
  if (!game || !player) {
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header soundEnabled={soundEnabled} onToggleSound={toggleSound} />

        <main className="flex-1 container mx-auto px-4 py-8">
          <AnimatedCard>
            <div className="max-w-2xl mx-auto">
              <div className="glass-card p-8 text-center">
                <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Join a Game
                </h2>

                <div className="flex flex-col items-center mb-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-blue-500 mb-4 flex items-center justify-center text-white text-4xl">
                    🎯
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
  if (game.status === "waiting") {
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

                {!selectedTeam ? (
                  <div>
                    <h3 className="text-xl font-semibold mb-6">
                      Choose Your Team
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {game.teams.map((team, index) => (
                        <AnimatedCard key={team.id} delay={index * 100}>
                          <button
                            onClick={() => handleJoinTeam(team.id)}
                            className={`glass-card p-6 w-full hover-lift transition-all ${
                              index === 0
                                ? "border-orange-400/50"
                                : "border-blue-400/50"
                            }`}
                          >
                            <h4
                              className={`text-2xl font-bold mb-4 ${
                                index === 0
                                  ? "text-orange-400"
                                  : "text-blue-400"
                              }`}
                            >
                              {team.name}
                            </h4>
                            <div className="text-sm text-slate-400 mb-4">
                              Score: {team.score} • Strikes: {team.strikes}
                            </div>
                            {team.members.length > 0 && (
                              <div className="text-sm">
                                <div className="text-slate-400 mb-2">
                                  Members:
                                </div>
                                {team.members.map((member, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-center gap-1"
                                  >
                                    {idx === 0 && (
                                      <span className="text-yellow-400">
                                        👑
                                      </span>
                                    )}
                                    {member}
                                  </div>
                                ))}
                              </div>
                            )}
                          </button>
                        </AnimatedCard>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
                      <p className="text-green-300">
                        You've joined{" "}
                        {game.teams.find((t) => t.id === selectedTeam)?.name}!
                      </p>
                    </div>
                    <p className="text-slate-400">
                      Waiting for the host to start the game...
                    </p>
                  </div>
                )}
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

  // Active game - show buzzer interface
if (game.status === "active") {
  const isMyTurn = game.currentBuzzer?.playerId === player.id;
  const currentQuestion = game.questions[game.currentQuestionIndex];
  
  // Add fallback if no question is available
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header
          gameCode={game.code}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />

        <main className="flex-1 container mx-auto px-4 py-8">
          <AnimatedCard>
            <div className="glass-card p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Game Loading...</h2>
              <p className="text-slate-400">Please wait while the host prepares the next question.</p>
              <LoadingSpinner />
            </div>
          </AnimatedCard>
        </main>

        <Footer />
      </div>
    );
  }

    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header
          gameCode={game.code}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Question Display */}
            <AnimatedCard>
              <div className="glass-card p-8 mb-6 text-center">
                <h3 className="text-lg font-bold mb-2">
                  Round {game.currentRound} • {currentQuestion.category}
                </h3>
                <h2 className="text-2xl font-semibold mb-4">
                  {currentQuestion.question}
                </h2>
                <p className="text-slate-400">Survey Says...</p>
              </div>
            </AnimatedCard>

            {/* Answers Grid */}
            <AnimatedCard delay={100}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {currentQuestion.answers.map((answer, index) => (
                  <div
                    key={index}
                    className={`glass-card p-4 ${
                      answer.revealed
                        ? "bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-400"
                        : "border-slate-600"
                    }`}
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
                        {answer.revealed ? answer.points : "?"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedCard>

            {/* Teams Display */}
            <AnimatedCard delay={200}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {game.teams.map((team, index) => (
                  <div
                    key={team.id}
                    className={`glass-card p-6 ${
                      team.active
                        ? "ring-2 ring-blue-400 animate-pulse-slow"
                        : ""
                    } ${selectedTeam === team.id ? "bg-blue-500/10" : ""}`}
                  >
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2">{team.name}</h3>
                      <div
                        className={`text-4xl font-bold mb-4 ${
                          index === 0 ? "text-orange-400" : "text-blue-400"
                        }`}
                      >
                        {team.score}
                      </div>
                      <div className="text-sm text-slate-400 mb-4">Points</div>

                      {/* Strikes */}
                      <div className="flex justify-center gap-2 mb-4">
                        {[1, 2, 3].map((strike) => (
                          <div
                            key={strike}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                              strike <= team.strikes
                                ? "bg-red-500 border-red-500 text-white"
                                : "border-slate-600"
                            }`}
                          >
                            {strike <= team.strikes ? "✗" : ""}
                          </div>
                        ))}
                      </div>

                      {selectedTeam === team.id && (
                        <div className="text-yellow-400 text-sm">Your Team</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedCard>

            {/* Buzzer and Answer Interface */}
            <AnimatedCard delay={300}>
              <div className="glass-card p-6">
                {!isMyTurn ? (
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-4">
                      {game.currentBuzzer
                        ? `${game.currentBuzzer.playerName} is answering...`
                        : "Get ready to buzz in!"}
                    </h3>

                    <button
                      onClick={handleBuzzIn}
                      disabled={!canBuzz}
                      className={`buzzer-button text-4xl font-bold ${
                        canBuzz
                          ? "bg-gradient-to-r from-red-500 to-red-600 hover:scale-105 cursor-pointer"
                          : "bg-slate-600 cursor-not-allowed opacity-50"
                      }`}
                    >
                      🔔 BUZZ IN!
                    </button>

                    {hasBuzzed && !game.currentBuzzer && (
                      <p className="text-yellow-400 mt-4">
                        You've already buzzed in this round!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-4 text-green-400">
                      🎯 Your turn to answer!
                    </h3>

                    <div className="max-w-md mx-auto">
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        className="input-field mb-4"
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSubmitAnswer()
                        }
                        autoFocus
                      />

                      <button
                        onClick={handleSubmitAnswer}
                        disabled={!answer.trim()}
                        className="btn-success w-full py-3"
                      >
                        Submit Answer
                      </button>
                    </div>

                    <p className="text-slate-400 text-sm mt-4">
                      You have 30 seconds to answer!
                    </p>
                  </div>
                )}
              </div>
            </AnimatedCard>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Game finished - show results
  if (game.status === "finished") {
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
                  <h2 className="text-5xl font-bold mb-4">🏆 GAME OVER 🏆</h2>
                  <p className="text-3xl font-bold">{winner.name} Wins!</p>
                  <p className="text-xl mt-2">Final Score: {winner.score}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {game.teams
                    .sort((a, b) => b.score - a.score)
                    .map((team, index) => (
                      <AnimatedCard key={team.id} delay={index * 200}>
                        <div
                          className={`glass-card p-8 ${
                            index === 0 ? "ring-2 ring-yellow-400" : ""
                          } ${
                            selectedTeam === team.id ? "bg-blue-500/10" : ""
                          }`}
                        >
                          <div className="text-6xl mb-4">
                            {index === 0 ? "🥇" : "🥈"}
                          </div>
                          <h3 className="text-2xl font-bold mb-4">
                            {team.name}
                          </h3>
                          <div
                            className={`text-4xl font-bold mb-2 ${
                              index === 0 ? "text-yellow-400" : "text-slate-400"
                            }`}
                          >
                            {team.score} Points
                          </div>
                          {selectedTeam === team.id && (
                            <div className="text-blue-400 font-semibold mt-2">
                              Your Team
                            </div>
                          )}
                        </div>
                      </AnimatedCard>
                    ))}
                </div>

                <div className="flex gap-4 justify-center">
                  <Link to={ROUTES.HOME} className="btn-primary py-3 px-8">
                    <span className="mr-2">🏠</span> PLAY AGAIN
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

  return null;
};

export default JoinPage;
