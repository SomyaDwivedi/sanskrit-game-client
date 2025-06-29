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

    if (callbacks.onPlayerBuzzed) {
      newSocket.on("player-buzzed", callbacks.onPlayerBuzzed);
    }

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

  const revealAnswer = (gameCode: string, answerIndex: number) => {
    if (socketRef.current) {
      socketRef.current.emit("reveal-answer", { gameCode, answerIndex });
    }
  };

  const nextQuestion = (gameCode: string) => {
    if (socketRef.current) {
      socketRef.current.emit("next-question", { gameCode });
    }
  };

  const clearBuzzer = (gameCode: string) => {
    if (socketRef.current) {
      socketRef.current.emit("clear-buzzer", { gameCode });
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

  const buzzIn = (gameCode: string, playerId: string) => {
    if (socketRef.current) {
      console.log("🔔 Attempting to buzz in:", { gameCode, playerId });
      socketRef.current.emit("buzz-in", { gameCode, playerId });
    } else {
      console.error("Cannot buzz in: socket not connected");
    }
  };

  const submitAnswer = (gameCode: string, playerId: string, answer: string) => {
    if (socketRef.current) {
      console.log("📝 Submitting answer:", { gameCode, playerId, answer });
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
    revealAnswer,
    nextQuestion,
    clearBuzzer,
    requestPlayersList,
    // Player actions
    playerJoinGame,
    buzzIn,
    submitAnswer,
    joinTeam,
  };
};