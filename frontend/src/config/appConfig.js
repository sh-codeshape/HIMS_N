const isTrue = (value) => String(value ?? "false").toLowerCase() === "true";

export const APP_CONFIG = {
  mockMode: false,
};

export const isMockMode = () => false;
