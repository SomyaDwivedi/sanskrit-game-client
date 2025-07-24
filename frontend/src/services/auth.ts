import axios from "axios";
import { LoginCredentials, LoginResponse } from "../types/auth";

const API = axios.create({
  baseURL: "http://localhost:5001/api/auth",
  headers: {
    "Content-Type": "application/json",
  },
});
export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await API.post("/login", credentials); // ✅ CORRECT
  return response.data;
};
export default API;