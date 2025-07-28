// api.ts
import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { getEnvVal } from "./utils";

// Helper function to extract useful error information
const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    // If we have a response, extract the error message
    if (axiosError.response?.data) {
      const data = axiosError.response.data as any;
      if (data.message) return data.message;
      if (data.error) return data.error;
      if (typeof data === "string") return data;
    }

    // If no response data, use status text or generic message
    if (axiosError.response?.statusText) {
      return `${axiosError.response.status}: ${axiosError.response.statusText}`;
    }

    // Network or other axios errors
    if (axiosError.message) return axiosError.message;
  }

  // Fallback for non-axios errors
  return error instanceof Error ? error.message : "Unknown error occurred";
};

const getApiClient = (baseUrl: string) => {
  // Use environment variable if available, otherwise use provided baseUrl
  baseUrl = getEnvVal(process.env.SEEKLIT_ABS_URL, baseUrl);

  // Ensure baseUrl ends with a slash if it's not empty
  if (baseUrl && !baseUrl.endsWith("/")) {
    baseUrl += "/";
  }

  return axios.create({
    baseURL: baseUrl,
    timeout: 10000, // Increased timeout for better reliability
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

    // Ensure we have a valid user object with an access token
    if (
      !response.data ||
      !response.data.user ||
      !response.data.user.accessToken
    ) {
      throw new Error("Invalid response from authentication server");
    }

    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Login error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to handle logout
const logout = async (baseUrl: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient(baseUrl);
    const response = await apiClient.post("/logout");
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Logout error:", errorMessage);
    throw new Error(errorMessage);
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
    const errorMessage = getErrorMessage(error);
    console.error("Get user error:", errorMessage);
    throw new Error(errorMessage);
  }
};

const getUsers = async (baseUrl: string, token: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient(baseUrl);
    const response: AxiosResponse<UsersResponse> = await apiClient.get(
      `/api/users`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Unable to get users:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const api = { login, logout, getUser, getUsers };
