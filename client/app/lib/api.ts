// api.ts
import axios, { AxiosInstance, AxiosResponse } from "axios";
import { getEnvVal } from "./utils";

const getApiClient = (baseUrl?: string) => {
  // Always use relative URLs since nginx handles routing in both dev and prod
  return axios.create({
    baseURL: "/api",
    timeout: 5000,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

// Function to handle login
const login = async (username: string, password: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
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
const logout = async () => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response = await apiClient.post("/logout");
    return response.data;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

// Function to get user information
const getUser = async (token: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
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

const getUsers = async (token: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
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
