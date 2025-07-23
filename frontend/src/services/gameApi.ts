import axios from "axios";
import { GAME_CONFIG } from "../utils/constants";

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: GAME_CONFIG.SOCKET_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface CreateGameResponse {
  gameCode: string;
}

export interface JoinGameResponse {
  playerId: string;
  game: any; // Game type from types
}

export interface JoinGameRequest {
  gameCode: string;
  playerName: string;
}

export const gameApi = {
  // Test server connection
  async testConnection(): Promise<any> {
    const response = await apiClient.get("/");
    return response.data;
  },

  // Create a new game
  async createGame(): Promise<CreateGameResponse> {
    const response = await apiClient.post("/api/create-game");
    return response.data;
  },

  // Join an existing game
  async joinGame(request: JoinGameRequest): Promise<JoinGameResponse> {
    const response = await apiClient.post("/api/join-game", request);
    return response.data;
  },
};

export default gameApi;
