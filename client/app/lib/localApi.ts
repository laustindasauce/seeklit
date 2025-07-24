// api.ts
import axios, { AxiosInstance, AxiosResponse } from "axios";

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
  });
};

// Function to handle Google book search
const googleSearch = async (token: string, query: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<LocalSearchResponse> = await apiClient.post(
      "/search/google",
      { query },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// Function to handle OpenLibrary book search
const openlibSearch = async (token: string, query: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<LocalSearchResponse> = await apiClient.post(
      "/search/openlib",
      { query },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// Function to handle Hardcover book search
const hardcoverSearch = async (token: string, query: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<LocalSearchResponse> = await apiClient.post(
      "/search/hardcover",
      { query },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
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
    console.error("Search error:", error);
    throw error;
  }
};

// Function to retrieve server config
const getServerConfig = async (token: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<ServerConfig> = await apiClient.get(
      "/settings/config",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// Function to update the server config
const updateServerConfig = async (token: string, conf: ServerConfigUpdate) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<ServerConfig> = await apiClient.patch(
      `/settings/config`,
      conf,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// Function to submit a request
const createNewRequest = async (token: string, req: NewBookRequest) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<BookRequest> = await apiClient.post(
      "/requests/",
      req,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// Function to get requests
const getRequests = async (baseUrl: string, token: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient(baseUrl);
    const response: AxiosResponse<BookRequest[]> = await apiClient.get(
      "/requests/",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// Function to update a request
const updateRequest = async (
  token: string,
  reqId: number,
  req: EditBookRequest
) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<BookRequest> = await apiClient.patch(
      `/requests/${reqId}`,
      req,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// Function to delete a request
const deleteRequest = async (token: string, reqId: number) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<LocalServerSettings> = await apiClient.delete(
      `/requests/${reqId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// Function to submit an issue
const createNewIssue = async (token: string, req: NewIssue) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<Issue> = await apiClient.post(
      "/issues/",
      req,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// Function to get issues
const getIssues = async (baseUrl: string, token: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient(baseUrl);
    const response: AxiosResponse<Issue[]> = await apiClient.get("/issues/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// Function to update an issue
const updateIssue = async (token: string, reqId: number, req: EditIssue) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<Issue> = await apiClient.patch(
      `/issues/${reqId}`,
      req,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// Function to delete an issue
const deleteIssue = async (token: string, reqId: number) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<LocalServerSettings> = await apiClient.delete(
      `/issues/${reqId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// Function to retrieve books recently added
const getRecentBooks = async (baseUrl: string, token: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient(baseUrl);
    const response: AxiosResponse<LocalSearchResponse> = await apiClient.get(
      "/search/personalized",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// Function to get user preferences
const getUserPreferences = async (token: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<UserPreferences> = await apiClient.get(
      "/user/preferences",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Get user preferences error:", error);
    throw error;
  }
};

// Function to update user preferences
const updateUserPreferences = async (
  token: string,
  preferences: Partial<UserPreferences>
) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<UserPreferences> = await apiClient.put(
      "/user/preferences",
      preferences,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Update user preferences error:", error);
    throw error;
  }
};

// Function to send email verification
const sendEmailVerification = async (token: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<{ message: string }> = await apiClient.post(
      "/user/preferences/verify-email",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Send email verification error:", error);
    throw error;
  }
};

// Function to verify email with code
const verifyEmail = async (token: string, code: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<{ message: string }> = await apiClient.get(
      `/user/preferences/verify-email?code=${code}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Verify email error:", error);
    throw error;
  }
};

// Function to get authentication info
const getAuthInfo = async () => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<AuthInfo> = await apiClient.get("/auth/info");
    return response.data;
  } catch (error) {
    console.error("Get auth info error:", error);
    throw error;
  }
};

// Function to get user info from token (works with both auth methods)
const getUserInfo = async (token: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<UserInfoResponse> = await apiClient.get(
      "/auth/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Validate the response
    if (!response.data || !response.data.user) {
      throw new Error("Invalid user info response");
    }

    // Ensure the user object has the correct structure
    const user = response.data.user;

    // Ensure accessToken is available (might be named token in OIDC responses)
    if (!user.accessToken && user.token) {
      user.accessToken = user.token;
    }

    return response.data;
  } catch (error) {
    console.error("Get user info error:", error);
    throw error;
  }
};

// Function to initiate OIDC login
const initiateOIDCLogin = async () => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    // This will redirect to the OIDC provider
    window.location.href = `${apiClient.defaults.baseURL}/auth/login`;
  } catch (error) {
    console.error("OIDC login error:", error);
    throw error;
  }
};

// Function to handle OIDC logout
const oidcLogout = async () => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response = await apiClient.post("/auth/logout");
    return response.data;
  } catch (error) {
    console.error("OIDC logout error:", error);
    throw error;
  }
};

// Function to get users (admin/root only)
const getUsers = async (token: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<UsersResponse> = await apiClient.get(
      "/users",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Get users error:", error);
    throw error;
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
