const isTrue = (value) => String(value ?? "false").toLowerCase() === "true";

export const APP_CONFIG = {
  mockMode: isTrue(import.meta.env.VITE_APP_MOCK_MODE),
};

export const isMockMode = () => APP_CONFIG.mockMode;
