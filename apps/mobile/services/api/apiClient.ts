import axios from 'axios';

const apiBaseUrl = process.env.API_URL;

if (!apiBaseUrl) {
  throw new Error('API_URL is required. Set it in apps/mobile/.env.');
}

export const API_BASE_URL = apiBaseUrl;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export const bareClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});
