// src/services/api.js
import axios from "axios";
import { API_URL } from "../config/config";

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
