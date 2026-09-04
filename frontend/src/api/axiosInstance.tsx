import axios from "axios";
import axiosRetry from "axios-retry";

const AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // if you're using cookies
});

// Configure automatic retry behavior
axiosRetry(AxiosInstance, {
  retries: 3, // Retry up to 3 times on failure
  retryCondition: (error) => {
    // Retry specifically on 429 (Rate Limit) or network/5xx server errors
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429
    );
  },
  retryDelay: (retryCount, error) => {
    // 1. Check if the server specified a 'Retry-After' header (in seconds)
    const retryAfter = error.response?.headers["retry-after"];
    if (retryAfter) {
      return parseInt(retryAfter, 10) * 1000;
    }

    // 2. Otherwise use exponential backoff delay (1s, 2s, 4s...)
    return axiosRetry.exponentialDelay(retryCount);
  },
});

// Optional: Response Interceptor for user feedback or logging
AxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      console.warn("Rate limit reached. Request was retried or rejected.");
    }
    return Promise.reject(error);
  }
);

export default AxiosInstance;