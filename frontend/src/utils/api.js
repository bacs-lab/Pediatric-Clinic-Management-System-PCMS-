export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const apiUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const getToken = () => localStorage.getItem("token");

export const authHeaders = (headers = {}) => ({
  ...headers,
  Authorization: `Bearer ${getToken()}`,
});
