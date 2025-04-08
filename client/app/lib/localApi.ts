// api.ts
import axios, { AxiosInstance, AxiosResponse } from "axios";
import { getEnvVal } from "./utils";

const getApiClient = (baseUrl?: string) => {
  if (!baseUrl) {
    baseUrl = getEnvVal(import.meta.env.VITE_API_URL, window?.location.origin);
  } else {
    baseUrl = getEnvVal(import.meta.env.VITE_API_URL, baseUrl);
  }

  console.log(baseUrl);

  return axios.create({
    baseURL: baseUrl + "/api/v1",
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

// Function to handle Readarr er book search
const readarrSearch = async (token: string, query: string) => {
  try {
    const apiClient: AxiosInstance = getApiClient();
    const response: AxiosResponse<LocalSearchResponse> = await apiClient.post(
      "/search/readarr",
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

export const localApi = {
  createNewIssue,
  createNewRequest,
  deleteIssue,
  deleteRequest,
  getIssues,
  getRecentBooks,
  getRequests,
  getServerConfig,
  getServerSettings,
  googleSearch,
  openlibSearch,
  hardcoverSearch,
  readarrSearch,
  updateIssue,
  updateRequest,
  updateServerConfig,
};
