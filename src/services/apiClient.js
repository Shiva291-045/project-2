import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error adding auth token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
