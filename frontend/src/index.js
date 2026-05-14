import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import axios from "axios";
import { GoogleOAuthProvider } from '@react-oauth/google';

// Add a request interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If 401 Unauthorized, clear token and redirect to login
      localStorage.removeItem("token");
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || "PLACEHOLDER_CLIENT_ID"}>
    <App />
  </GoogleOAuthProvider>
);
