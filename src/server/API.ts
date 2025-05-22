// src/services/api.js
import axios from "axios";

export const API_URL = "http://localhost:3000/";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  validateStatus(status) {
    return status >= 200 && status < 300; // default
  },
});

export default api;
