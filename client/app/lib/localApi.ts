// api.ts
import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";

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

const getApiClient = (baseUrl?: string) => {
  if (!baseUrl) {
    if (typeof window !== "undefined") {
      // Client-side: use current origin
      baseUrl = window.location.origin;
    } else {
      // Server-side (SSR): use environment variable for internal Docker communication
      baseUrl = process.env.SEEKLIT_SERVER_URL || "http://localhost:8416";
    }
  }

  // Ensure baseUrl ends with a slash if it's not empty
  if (baseUrl && !baseUrl.endsWith("/")) {
    baseUrl += "/";
  }

  return axios.create({
    baseURL: baseUrl + "api/v1",
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true, // This ensures cookies are sent with requests
  });
};

// Function to handle Google book search
const googleSearch = async (query: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<LocalSearchResponse> = await apiClient.post(
      "/search/google",
      { query }
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Google search error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to handle OpenLibrary book search
const openlibSearch = async (query: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<LocalSearchResponse> = await apiClient.post(
      "/search/openlib",
      { query }
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("OpenLibrary search error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to handle Hardcover book search
const hardcoverSearch = async (query: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<LocalSearchResponse> = await apiClient.post(
      "/search/hardcover",
      { query }
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Hardcover search error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to retrieve server settings
const getServerSettings = async () => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<LocalServerSettings> = await apiClient.get(
      "/settings"
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Get server settings error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to retrieve server config
const getServerConfig = async () => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<ServerConfig> = await apiClient.get(
      "/settings/config"
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Get server config error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to update the server config
const updateServerConfig = async (conf: ServerConfigUpdate) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<ServerConfig> = await apiClient.patch(
      `/settings/config`,
      conf
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Update server config error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to submit a request
const createNewRequest = async (req: NewBookRequest) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<BookRequest> = await apiClient.post(
      "/requests/",
      req
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Create request error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to get requests
const getRequests = async (baseUrl?: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient(baseUrl);
    const response: AxiosResponse<BookRequest[]> = await apiClient.get(
      "/requests/"
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Get requests error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to update a request
const updateRequest = async (reqId: number, req: EditBookRequest) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<BookRequest> = await apiClient.patch(
      `/requests/${reqId}`,
      req
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Update request error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to delete a request
const deleteRequest = async (reqId: number) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<LocalServerSettings> = await apiClient.delete(
      `/requests/${reqId}`
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Delete request error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to submit an issue
const createNewIssue = async (req: NewIssue) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<Issue> = await apiClient.post(
      "/issues/",
      req
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Create issue error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to get issues
const getIssues = async (baseUrl?: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient(baseUrl);
    const response: AxiosResponse<Issue[]> = await apiClient.get("/issues/");
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Get issues error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to update an issue
const updateIssue = async (reqId: number, req: EditIssue) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<Issue> = await apiClient.patch(
      `/issues/${reqId}`,
      req
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Update issue error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to delete an issue
const deleteIssue = async (reqId: number) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<LocalServerSettings> = await apiClient.delete(
      `/issues/${reqId}`
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Delete issue error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to retrieve books recently added
const getRecentBooks = async (baseUrl?: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient(baseUrl);
    const response: AxiosResponse<LocalSearchResponse> = await apiClient.get(
      "/search/personalized"
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Get recent books error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to get user preferences
const getUserPreferences = async () => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<UserPreferences> = await apiClient.get(
      "/user/preferences"
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Get user preferences error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to update user preferences
const updateUserPreferences = async (preferences: Partial<UserPreferences>) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<UserPreferences> = await apiClient.put(
      "/user/preferences",
      preferences
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Update user preferences error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to send email verification
const sendEmailVerification = async () => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<{ message: string }> = await apiClient.post(
      "/user/preferences/verify-email",
      {}
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Send email verification error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to verify email with code
const verifyEmail = async (code: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<{ message: string }> = await apiClient.get(
      `/user/preferences/verify-email?code=${code}`
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Verify email error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to get authentication info
const getAuthInfo = async () => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<AuthInfo> = await apiClient.get("/auth/info");
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Get auth info error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to get user info from session cookie
const getUserInfo = async () => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<UserInfoResponse> = await apiClient.get(
      "/auth/tokens" // Changed from /auth/userinfo to /auth/tokens
    );

    // Validate the response
    if (!response.data || !response.data.user) {
      throw new Error("Invalid user info response");
    }

    // Ensure the user object has the correct structure
    const user = response.data.user;

    // Ensure accessToken is available (might be named token in responses)
    if (!user.accessToken && user.token) {
      user.accessToken = user.token;
    }

    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Get user info error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to initiate OIDC login
const initiateOIDCLogin = async () => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    // This will redirect to the OIDC provider
    window.location.href = `${apiClient.defaults.baseURL}/auth/login`;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("OIDC login error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to handle OIDC logout
const oidcLogout = async () => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response = await apiClient.post("/auth/logout");
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("OIDC logout error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Function to get users (admin/root only)
const getUsers = async () => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<UsersResponse> = await apiClient.get(
      "/users"
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Get users error:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const localApi = {
  createNewIssue,
  createNewRequest,
  deleteIssue,
  deleteRequest,
  getAuthInfo,
  getIssues,
  getRecentBooks,
  getRequests,
  getServerConfig,
  getServerSettings,
  getUserInfo,
  getUserPreferences,
  getUsers,
  googleSearch,
  hardcoverSearch,
  initiateOIDCLogin,
  oidcLogout,
  openlibSearch,
  sendEmailVerification,
  updateIssue,
  updateRequest,
  updateServerConfig,
  updateUserPreferences,
  verifyEmail,
};
