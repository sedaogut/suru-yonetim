// src/api.js
import axios from "axios";

const FALLBACK = "http://127.0.0.1:8000/api";
const BASE = import.meta.env?.VITE_API_URL || FALLBACK;

export const apiClient = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

console.log("API baseURL:", BASE);
