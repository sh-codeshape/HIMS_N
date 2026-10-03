import axiosInstance from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";
import { createMockJwt, MOCK_USERS } from "../../mock/mockData";
import { isMockMode } from "../../config/appConfig";

const unwrapData = (response) => response?.data?.data ?? response?.data ?? null;

const authService = {
  login: async ({ role, username, password }) => {
    // If user is running frontend standalone without backend, or if backend fails with CORS/Network error
    try {
      const res = await axiosInstance.post(
        ENDPOINTS.AUTH.LOGIN,
        { role, username, password },
        { skipErrorToast: true },
      );
      return unwrapData(res);
    } catch (err) {
      if (!isMockMode()) {
        throw err;
      }

      console.warn(
        "Backend API unreachable or CORS error — falling back to Frontend Demo Mode:",
        err.message,
      );

      // Graceful fallback to rich mock auth
      const baseUser = MOCK_USERS[role] || {
        id: `usr_${Date.now()}`,
        name: username ? username.split("@")[0] : "Authorized User",
        email: username || `${role}@kgnandahospital.com`,
        role: role || "admin",
        department: "Hospital Administration",
        employeeId: `EMP-${(role || "USR").toUpperCase()}-101`,
      };

      const user = {
        ...baseUser,
        role: role || baseUser.role,
        name: username
          ? username.includes("@")
            ? baseUser.name
            : username
          : baseUser.name,
        email: username || baseUser.email,
      };

      const token = createMockJwt({
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
      });

      return {
        token,
        user,
        isMockMode: true,
      };
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post(ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // client-side logout proceeds
    }
  },

  me: async () => {
    try {
      const res = await axiosInstance.get(ENDPOINTS.AUTH.ME);
      return unwrapData(res);
    } catch {
      const rawUser = localStorage.getItem("hims_user");
      return rawUser ? JSON.parse(rawUser) : null;
    }
  },
};

export default authService;
