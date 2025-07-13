import { BACKEND_URL } from "@/constant/Global";

/**
 * Makes an authenticated API request
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("accessToken");
  
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include", // Include cookies
  };

  const response = await fetch(`${BACKEND_URL}${endpoint}`, config);
  return response;
};

/**
 * Makes an authenticated API request and returns JSON data
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Fetch options
 * @returns {Promise<object>}
 */
export const apiRequestJson = async (endpoint, options = {}) => {
  const response = await apiRequest(endpoint, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};
