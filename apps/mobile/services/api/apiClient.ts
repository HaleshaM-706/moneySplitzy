import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000',
  timeout: 15000,
});

export const bareClient = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000',
  timeout: 15000,
});
