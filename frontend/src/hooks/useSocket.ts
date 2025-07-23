import { useState, useEffect, useCallback, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { GAME_CONFIG } from "../utils/constants";

interface SocketCallbacks {
  onPlayerJoined?: (data: any) => void;
  onTeamUpdated?: (data: any) => void;
  onHostJoined?: (data: any) => void;
  onGameStarted?: (data: any) => void;
  onPlayerBuzzed?: (data: any) => void;
  onBuzzTooLate?: (data: any) => void;
  onBuzzRejected?: (data: any) => void;
  onAnswerRevealed?: (data: any) => void;
  onNextQuestion?: (data: any) => void;
  onGameOver?: (data: any) => void;
  onBuzzerCleared?: (data: any) => void;
  onWrongAnswer?: (data: any) => void;
  onTeamSwitched?: (data: any) => void;
  onPlayersListReceived?: (data: any) => void;
  onAnswerRejected?: (data: any) => void;
  onAnswerCorrect?: (data: any) => void;
  // UPDATED: Single attempt events
  onAnswerIncorrect?: (data: any) => void;
  onTurnChanged?: (data: any) => void;
  onRoundComplete?: (data: any) => void;
  onRoundStarted?: (data: any) => void;
  onQuestionForced?: (data: any) => void;
  onGameReset?: (data: any) => void;
  // NEW: Card revelation events
  onRemainingCardsRevealed?: (data: any) => void;
}

export const useSocket = (callbacks: SocketCallbacks = {}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socket) {
      console.log("Socket already connected");
      return socket;
    }

    console.log("Connecting to socket...");
    const newSocket = io(GAME_CONFIG.SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
    newSocket.on("buzzer-pressed", (data) => {
      const { teamName, playerName } = data;
      console.log(`${teamName} buzzed first! ${playerName}, answer now!`);
      if (callbacks.onPlayerBuzzed) {
        callbacks.onPlayerBuzzed(data);
      }
    });
    
    newSocket.on("buzz-too-late", () => {
      console.error("Too late! Another team already buzzed.");
    });
    
    // Register all callback handlers
    if (callbacks.onPlayerJoined) {
      newSocket.on("player-joined", callbacks.onPlayerJoined);
    }

    if (callbacks.onTeamUpdated) {
      newSocket.on("team-updated", callbacks.onTeamUpdated);
    }

    if (callbacks.onHostJoined) {
      newSocket.on("host-joined", callbacks.onHostJoined);
    }

    if (callbacks.onGameStarted) {
      newSocket.on("game-started", callbacks.onGameStarted);
    }

    // Buzzer events handled above via "buzzer-pressed"

    if (callbacks.onBuzzTooLate) {
      newSocket.on("buzz-too-late", callbacks.onBuzzTooLate);
    }

    if (callbacks.onBuzzRejected) {
      newSocket.on("buzz-rejected", callbacks.onBuzzRejected);
    }

    if (callbacks.onAnswerRevealed) {
      newSocket.on("answer-revealed", callbacks.onAnswerRevealed);
    }

    if (callbacks.onNextQuestion) {
      newSocket.on("next-question", callbacks.onNextQuestion);
    }

    if (callbacks.onGameOver) {
      newSocket.on("game-over", callbacks.onGameOver);
    }

    if (callbacks.onBuzzerCleared) {
      newSocket.on("buzzer-cleared", callbacks.onBuzzerCleared);
    }

    if (callbacks.onWrongAnswer) {
      newSocket.on("wrong-answer", callbacks.onWrongAnswer);
    }

    if (callbacks.onTeamSwitched) {
      newSocket.on("team-switched", callbacks.onTeamSwitched);
    }

    if (callbacks.onPlayersListReceived) {
      newSocket.on("players-list", callbacks.onPlayersListReceived);
    }

    if (callbacks.onAnswerRejected) {
      newSocket.on("answer-rejected", callbacks.onAnswerRejected);
    }

    if (callbacks.onAnswerCorrect) {
      newSocket.on("answer-correct", callbacks.onAnswerCorrect);
    }

    // UPDATED: Single attempt events
    if (callbacks.onAnswerIncorrect) {
      newSocket.on("answer-incorrect", callbacks.onAnswerIncorrect);
    }

    if (callbacks.onTurnChanged) {
      newSocket.on("turn-changed", callbacks.onTurnChanged);
    }

    if (callbacks.onRoundComplete) {
      newSocket.on("round-complete", callbacks.onRoundComplete);
    }

    if (callbacks.onRoundStarted) {
      newSocket.on("round-started", callbacks.onRoundStarted);
    }

    if (callbacks.onQuestionForced) {
      newSocket.on("question-forced", callbacks.onQuestionForced);
    }

    if (callbacks.onGameReset) {
      newSocket.on("game-reset", callbacks.onGameReset);
    }

    // NEW: Card revelation events
    if (callbacks.onRemainingCardsRevealed) {
      newSocket.on("remaining-cards-revealed", callbacks.onRemainingCardsRevealed);
    }

    socketRef.current = newSocket;
    setSocket(newSocket);
    return newSocket;
  }, [socket, callbacks]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  // Host actions
  const hostJoinGame = (gameCode: string, teams: any[]) => {
    if (socketRef.current) {
      console.log("Host joining game:", gameCode);
      socketRef.current.emit("host-join", { gameCode, teams });
    } else {
      console.error("Cannot join as host: socket not connected");
    }
  };

  const startGame = (gameCode: string) => {
    if (socketRef.current) {
      console.log("Starting game:", gameCode);
      socketRef.current.emit("start-game", { gameCode });
    }
  };
  const buzzIn = (code: string, playerId: string) => {
    if (!socketRef.current) {
      console.error("❌ Cannot buzz in: socket is not connected.");
      return;
    }
  
    socketRef.current.emit("player-buzz", {
      gameCode: code,
      playerId,
    });
  };
  const continueToNextRound = (gameCode: string) => {
    if (socketRef.current) {
      socketRef.current.emit("continue-to-next-round", { gameCode });
    }
  };

  const forceNextQuestion = (gameCode: string) => {
    if (socketRef.current) {
      socketRef.current.emit("force-next-question", { gameCode });
    }
  };

  const forceRoundSummary = (gameCode: string) => {
    if (socketRef.current) {
      socketRef.current.emit("force-round-summary", { gameCode });
    }
  };

  const resetGame = (gameCode: string) => {
    if (socketRef.current) {
      socketRef.current.emit("reset-game", { gameCode });
    }
  };

  // Player actions
  const playerJoinGame = (gameCode: string, playerId: string) => {
    if (socketRef.current) {
      console.log("Player joining game:", gameCode, "playerId:", playerId);
      socketRef.current.emit("player-join", { gameCode, playerId });
    } else {
      console.error("Cannot join game: socket not connected");
    }
  };

  const submitAnswer = (gameCode: string, playerId: string, answer: string) => {
    if (socketRef.current) {
      console.log("📝 Submitting single attempt answer:", { gameCode, playerId, answer });
      socketRef.current.emit("submit-answer", { gameCode, playerId, answer });
    } else {
      console.error("Cannot submit answer: socket not connected");
    }
  };

  const joinTeam = (gameCode: string, playerId: string, teamId: string) => {
    if (socketRef.current) {
      console.log("Joining team:", teamId, "in game:", gameCode);
      socketRef.current.emit("join-team", { gameCode, playerId, teamId });
    }
  };

  const requestPlayersList = (gameCode: string) => {
    if (socketRef.current) {
      socketRef.current.emit("get-players", { gameCode });
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    // Host actions
    hostJoinGame,
    startGame,
    continueToNextRound,
    forceNextQuestion,
    forceRoundSummary,
    resetGame,
    buzzIn,
    requestPlayersList,
    // Player actions
    playerJoinGame,
    submitAnswer,
    joinTeam,
  };
};