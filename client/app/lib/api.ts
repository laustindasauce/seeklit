// api.ts
import axios, { AxiosInstance, AxiosResponse } from "axios";
import { getEnvVal } from "./utils";

const getApiClient = (baseUrl: string) => {
  baseUrl = getEnvVal(process.env.SEEKLIT_ABS_URL, baseUrl);
  return axios.create({
    baseURL: baseUrl,
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
    const response: AxiosResponse<User> = await apiClient.get(`/api/me`, {
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
    const response: AxiosResponse<User[]> = await apiClient.get(`/api/users`, {
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

export const api = { login, logout, getUser, getUsers };
