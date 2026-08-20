export const baseApiURL = () => {
  // If explicitly set via environment variable to a remote URL, use it
  if (process.env.REACT_APP_APILINK && !process.env.REACT_APP_APILINK.includes("localhost")) {
    return process.env.REACT_APP_APILINK;
  }

  // When running in a deployed browser environment (e.g. Render), auto-target the deployed Render backend
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://ecap-erp.onrender.com/api";
  }

  // Fallback for local development
  return process.env.REACT_APP_APILINK || "http://localhost:5001/api";
};
