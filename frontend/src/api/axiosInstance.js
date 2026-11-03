import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
const USE_COOKIE_AUTH = import.meta.env.VITE_USE_COOKIE_AUTH === "true";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  // withCredentials must be true ONLY if your backend uses httpOnly cookies
  // for the auth session. If you use a Bearer token (most common), keep this
  // false — turning it on with a wildcard "*" CORS origin on the backend is
  // the #1 cause of CORS errors in production/Render deployments.
  withCredentials: USE_COOKIE_AUTH,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---- Request interceptor: attach token ----
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("hims_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---- Response interceptor: normalize errors ----
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // If the caller requested to handle or fallback quietly, don't show the error toast
      if (!error.config?.skipErrorToast) {
        toast.error(
          "Backend server is offline or CORS issue. Running in Frontend Demo Mode.",
          { id: "backend-offline-notice", duration: 3000 },
        );
      }
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // Allow callers to suppress the default axios toast if they handle it themselves
    if (error.config?.skipErrorToast) {
      return Promise.reject(error);
    }

    const serverMessage =
      data?.error?.message ||
      data?.message ||
      (typeof data === "string" ? data : null);

    if (status === 401) {
      if (!error.config.url.includes('/auth/login')) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("hims_token");
        localStorage.removeItem("hims_user");
        window.location.href = "/login";
      }
    } else if (status === 403) {
      toast.error(serverMessage || "You don't have permission to do that.");
    } else if (status === 404) {
      toast.error(serverMessage || "Requested resource not found.");
    } else if (status === 409) {
      toast.error(
        serverMessage || "A patient with this name and phone number already exists.",
        { id: "conflict-error", duration: 5000, icon: "⚠️" }
      );
    } else if (status >= 500) {
      toast.error(serverMessage || "Server error. Please try again shortly.");
    } else {
      toast.error(serverMessage || "Something went wrong.");
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
