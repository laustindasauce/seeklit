// api.ts
import axios, { AxiosInstance, AxiosResponse } from "axios";
import { getEnvVal } from "./utils";

const getApiClient = (baseUrl?: string) => {
  // In production (Docker), use relative URLs to go through nginx proxy
  // In development, use the provided baseUrl or fallback to localhost
  const apiBaseUrl =
    process.env.NODE_ENV === "production"
      ? "/api"
      : baseUrl || getEnvVal(process.env.VITE_API_URL, "http://localhost:8416");

  return axios.create({
    baseURL: apiBaseUrl,
    timeout: 5000,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

// Function to handle login
const login = async (baseUrl: string, username: string, password: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient(baseUrl);
    const response: AxiosResponse<LoginResponse> = await apiClient.post(
      "/login",
      {
        username,
        password,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Function to handle logout
const logout = async (baseUrl: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient(baseUrl);
    const response = await apiClient.post("/logout");
    return response.data;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

// Function to get user information
const getUser = async (baseUrl: string, token: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient(baseUrl);
    const response: AxiosResponse<User> = await apiClient.get(`/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Get user error:", error);
    throw error;
  }
};

const getUsers = async (baseUrl: string, token: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient(baseUrl);
    const response: AxiosResponse<UsersResponse> = await apiClient.get(
      `/users`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Get user error:", error);
    throw error;
  }
};

export const api = { login, logout, getUser, getUsers };
