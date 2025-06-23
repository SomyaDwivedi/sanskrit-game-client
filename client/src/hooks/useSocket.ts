import { useState, useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { GAME_CONFIG } from "../utils/constants";
import { Game, Team, Player, Answer } from "../types";

interface BuzzerData {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  timestamp: number;
  game: Game;
}

interface AnswerData {
  teamName: string;
  playerName: string;
  pointsAwarded?: number;
  strikes?: number;
  game: Game;
}

interface GameEventData {
  game: Game;
  message?: string;
  winner?: Team;
}

interface UseSocketProps {
  onGameUpdate?: (game: Game) => void;
  onPlayerBuzzed?: (data: BuzzerData) => void;
  onAnswerCorrect?: (data: AnswerData) => void;
  onAnswerIncorrect?: (data: AnswerData) => void;
  onAnswerTimeout?: (data: AnswerData) => void;
  onGameStarted?: (data: GameEventData) => void;
  onNextQuestion?: (data: GameEventData) => void;
  onGameOver?: (data: GameEventData) => void;
  onPlayerJoined?: (data: { player: Player; totalPlayers: number }) => void;
  onTeamSwitched?: (data: { game: Game; activeTeamId: string; activeTeamName: string }) => void;
  onAnswerRevealed?: (data: { game: Game; answer: Answer; playerName: string; byHost?: boolean }) => void;
  onBuzzerCleared?: (data: GameEventData) => void;
}

export const useSocket = (callbacks: UseSocketProps = {}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef(callbacks);

  // Update callbacks ref when callbacks change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const connect = () => {
    if (!socket) {
      const newSocket = io(GAME_CONFIG.SOCKET_URL);
      setSocket(newSocket);

      newSocket.on("connect", () => {
        setIsConnected(true);
        console.log("🔌 Connected to server");
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
        console.log("🔌 Disconnected from server");
      });

      // Game event listeners
      newSocket.on("game-started", (data) => {
        callbacksRef.current.onGameStarted?.(data);
      });

      newSocket.on("player-joined", (data) => {
        callbacksRef.current.onPlayerJoined?.(data);
      });

      newSocket.on("player-buzzed", (data) => {
        callbacksRef.current.onPlayerBuzzed?.(data);
      });

      newSocket.on("answer-correct", (data) => {
        callbacksRef.current.onAnswerCorrect?.(data);
      });

      newSocket.on("answer-incorrect", (data) => {
        callbacksRef.current.onAnswerIncorrect?.(data);
      });

      newSocket.on("wrong-answer", (data) => {
        callbacksRef.current.onAnswerIncorrect?.(data);
      });

      newSocket.on("answer-timeout", (data) => {
        callbacksRef.current.onAnswerTimeout?.(data);
      });

      newSocket.on("team-switched", (data) => {
        callbacksRef.current.onTeamSwitched?.(data);
      });

      newSocket.on("answer-revealed", (data) => {
        callbacksRef.current.onAnswerRevealed?.(data);
      });

      newSocket.on("next-question", (data) => {
        callbacksRef.current.onNextQuestion?.(data);
      });

      newSocket.on("game-over", (data) => {
        callbacksRef.current.onGameOver?.(data);
      });

      newSocket.on("buzzer-cleared", (data) => {
        callbacksRef.current.onBuzzerCleared?.(data);
      });

      return newSocket;
    }
    return socket;
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  // Host actions
  const hostJoinGame = (gameCode: string, teams: any[]) => {
    if (socket) {
      socket.emit("host-join", { gameCode, teams });
    }
  };

  const startGame = (gameCode: string) => {
    if (socket) {
      socket.emit("start-game", { gameCode });
    }
  };

  const revealAnswer = (gameCode: string, answerIndex: number) => {
    if (socket) {
      socket.emit("reveal-answer", { gameCode, answerIndex });
    }
  };

  const nextQuestion = (gameCode: string) => {
    if (socket) {
      socket.emit("next-question", { gameCode });
    }
  };

  const clearBuzzer = (gameCode: string) => {
    if (socket) {
      socket.emit("clear-buzzer", { gameCode });
    }
  };

  // Player actions
  const playerJoinGame = (gameCode: string, playerId: string) => {
    if (socket) {
      socket.emit("player-join", { gameCode, playerId });
    }
  };

  const buzzIn = (gameCode: string, playerId: string) => {
    if (socket) {
      socket.emit("buzz-in", { gameCode, playerId });
    }
  };

  const submitAnswer = (gameCode: string, playerId: string, answer: string) => {
    if (socket) {
      socket.emit("submit-answer", { gameCode, playerId, answer });
    }
  };

  const joinTeam = (gameCode: string, playerId: string, teamId: string) => {
    if (socket) {
      socket.emit("join-team", { gameCode, playerId, teamId });
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    // Host actions
    hostJoinGame,
    startGame,
    revealAnswer,
    nextQuestion,
    clearBuzzer,
    // Player actions
    playerJoinGame,
    buzzIn,
    submitAnswer,
    joinTeam,
  };
};