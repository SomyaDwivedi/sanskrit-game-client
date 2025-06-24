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
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(undefined);
  const [answer, setAnswer] = useState("");
  const [canBuzz, setCanBuzz] = useState(false);
  const [hasBuzzed, setHasBuzzed] = useState(false);

  const { soundEnabled, toggleSound, playSound } = useAudio();

  useEffect(() => {
    if (game && game.status === "active") {
      // Enable buzzer when game is active and no one has buzzed yet
      setCanBuzz(!game.currentBuzzer && !hasBuzzed);
    }
  }, [game, hasBuzzed]);

  const { connect, playerJoinGame, joinTeam, buzzIn, submitAnswer, requestPlayersList } = useSocket(
    {
      onPlayerJoined: (data) => {
        console.log("Player joined event received:", data);
        playSound("buzz");
        
        // Update the game state with the new player list
        if (game) {
          setGame(prevGame => {
            if (!prevGame) return null;
            
            // Check if player already exists to avoid duplicates
            const playerExists = prevGame.players.some(p => p.id === data.player.id);
            if (playerExists) {
              return {
                ...prevGame,
                players: prevGame.players.map(p => 
                  p.id === data.player.id ? {...p, ...data.player} : p
                )
              };
            }
            
            return {
              ...prevGame,
              players: [...prevGame.players, data.player]
            };
          });
        }
      },
      onTeamUpdated: (data) => {
        console.log("Team updated event received:", data);
        if (game) {
          setGame(data.game);
          
          // Update local player state if this is the current player
          if (player && data.playerId === player.id) {
            console.log("Updating local player with teamId:", data.teamId);
            setPlayer({
              ...player,
              teamId: data.teamId
            });
          }
        }
      },
      onGameStarted: (data) => {
        console.log("Game started event received:", data);
        playSound("correct");
        
        // Find this player in the updated game players list to get their latest state
        const updatedPlayer = data.game.players.find((p: Player) => player && p.id === player.id);
        
        // Update player state with the latest info from server (especially teamId)
        if (updatedPlayer && player) {
          console.log("Updating player state on game start:", updatedPlayer);
          setPlayer({
            ...player,
            teamId: updatedPlayer.teamId || player.teamId
          });
        }
        
        setGame(data.game);
        setHasBuzzed(false);
        setCanBuzz(true);
      },
      onPlayerBuzzed: (data) => {
        console.log("Player buzzed event received:", data);
        if (game) {
          setGame(data.game);
        }
        
        // Play different sounds based on who buzzed
        if (player && data.playerId === player.id) {
          playSound("buzz");
        } else {
          playSound("otherBuzz");
        }
      },
      onBuzzerCleared: (data) => {
        console.log("Buzzer cleared event received:", data);
        if (game) {
          setGame(data.game);
        }
        setHasBuzzed(false);
        setCanBuzz(true);
      },
      onAnswerRevealed: (data) => {
        console.log("Answer revealed event received:", data);
        if (game) {
          setGame(data.game);
        }
        setHasBuzzed(false);
        
        // Play sounds based on who revealed the answer
        if (player && data.playerName === player.name) {
          playSound("correct");
        } else {
          playSound("otherCorrect");
        }
      },
      onNextQuestion: (data) => {
        console.log("Next question event received:", data);
        if (game) {
          setGame(data.game);
        }
        setHasBuzzed(false);
        setCanBuzz(true);
        playSound("nextQuestion");
      },
      onGameOver: (data) => {
        console.log("Game over event received:", data);
        if (game) {
          setGame(data.game);
        }
        playSound("applause");
      },
onPlayersListReceived: (data) => {
  console.log("Players list received:", data);
  if (game) {
    // Update player information from server
    const updatedPlayer = data.players.find((p: Player) => player && p.id === player.id);
    if (updatedPlayer && player) {
      setPlayer({
        ...player,
        teamId: updatedPlayer.teamId || player.teamId
      });
    }
    
    setGame(prevGame => {
      if (!prevGame) return null;
      return {
        ...prevGame,
        players: data.players
      };
    });
  }
}
    }
  );

  // Periodically request updated player list from server
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (game && player) {
      // Initial request
      requestPlayersList(game.code);
      
      interval = setInterval(() => {
        requestPlayersList(game.code);
      }, 3000); // Every 3 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [game?.code, player]);

  const joinGame = async () => {
    if (!gameCode.trim() || !playerName.trim()) {
      setError("Please enter both game code and your name");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(`${GAME_CONFIG.SOCKET_URL}/api/join-game`, {
        gameCode: gameCode.toUpperCase(),
        playerName: playerName.trim(),
      });

      const { playerId, game: gameData } = response.data;
      setPlayer({
        id: playerId,
        name: playerName.trim(),
        gameCode: gameCode.toUpperCase(),
        connected: true,
        teamId: undefined,
      });
      setGame(gameData);

      // Connect to socket and join game room
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
      setSelectedTeam(teamId);
      
      // Immediately update local player state
      setPlayer({
        ...player,
        teamId: teamId
      });
      
      // Send team join to server
      joinTeam(game.code, player.id, teamId);
      playSound("buzz");
    }
  };

  const handleBuzzIn = () => {
    if (player && game && canBuzz) {
      console.log("Buzzing in with player:", player);
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
                          {game.teams.find((t) => t.id === player.teamId)?.name || "a team"}!
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
                              {game.teams.find(t => t.id === gamePlayer.teamId)?.name}
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

  // Active game - show buzzer interface
  if (game && game.status === "active") {
    const isMyTurn = game.currentBuzzer?.playerId === player.id;
    const currentQuestion = game.questions[game.currentQuestionIndex];

    // Debug player state
    console.log("Active game player state:", player);

    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        <Header
          gameCode={game.code}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <AnimatedCard>
              <div className="glass-card p-8">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold mb-2">
                    Round {game.currentRound}
                  </h2>
                  <p className="text-slate-400">
                    Question {game.currentQuestionIndex + 1} of{" "}
                    {game.questions.length}
                  </p>
                </div>

                <div className="mb-8">
                  <div className="bg-slate-800/50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">
                      {currentQuestion.question}
                    </h3>

                    {/* Remove hint references since it's not in the Question type */}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {game.teams.map((team) => (
                    <div
                      key={team.id}
                      className={`glass-card p-4 ${
                        team.active
                          ? "border-green-500/50 bg-green-500/10"
                          : ""
                      } ${
                        team.id === player.teamId
                          ? "border-yellow-400/50"
                          : ""
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">{team.name}</h4>
                        <div className="text-xl font-bold">{team.score}</div>
                      </div>
                      <div className="flex items-center mt-2">
                        <div className="text-red-500">
                          {Array(team.strikes)
                            .fill("X")
                            .map((_, i) => (
                              <span key={i} className="mr-1">
                                ✗
                              </span>
                            ))}
                        </div>
                        <div className="ml-auto">
                          {team.id === player.teamId && (
                            <span className="text-yellow-400 text-sm">
                              Your Team
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Buzzer Section */}
                {!game.currentBuzzer ? (
                  <div className="text-center">
                    {player.teamId ? (
                      <button
                        onClick={handleBuzzIn}
                        disabled={!canBuzz}
                        className={`buzzer-button ${
                          canBuzz ? "active" : "disabled"
                        }`}
                      >
                        {canBuzz ? "TAP TO BUZZ!" : "Buzzer locked"}
                      </button>
                    ) : (
                      <div className="glass-card p-6 border-2 border-red-400/50 bg-red-400/10">
                        <p className="text-red-300 font-medium">
                          You didn't select a team before the game started. 
                          Please wait for the next game and select a team promptly.
                        </p>
                      </div>
                    )}
                  </div>
                ) : isMyTurn ? (
                  <div className="glass-card p-6 border-2 border-yellow-400/50 bg-yellow-400/10 animate-pulse">
                    <h3 className="text-xl font-semibold text-center mb-4">
                      Your turn to answer!
                    </h3>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        className="input-field flex-1"
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSubmitAnswer()
                        }
                      />
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={!answer.trim()}
                        className="btn-primary py-2 px-4"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-6 text-center">
                    <p className="text-xl mb-2">
                      {game.currentBuzzer.playerName} is answering...
                    </p>
                    <p className="text-slate-400">
                      From team:{" "}
                      <span className="text-blue-400">
                        {game.currentBuzzer.teamName}
                      </span>
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
              The game is in an unexpected state. Please refresh the page or return to home.
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