import axiosInstance from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";

const unwrapData = (response) => response?.data?.data ?? response?.data ?? null;

const authService = {
  login: async ({ role, username, password }) => {
    const res = await axiosInstance.post(
      ENDPOINTS.AUTH.LOGIN,
      { role, username, password },
      { skipErrorToast: true },
    );
    return unwrapData(res);
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
