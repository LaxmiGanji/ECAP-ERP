export const baseApiURL = () => {
  // Directly using the backend1 URL to ensure it works even if Render env vars are finicky
  return process.env.REACT_APP_APILINK || "http://localhost:5001/api";
};
