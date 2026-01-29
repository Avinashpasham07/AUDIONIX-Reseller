import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_URL = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
const FILE_BASE_URL = API_URL.replace('/api/', '');
const SOCKET_URL = FILE_BASE_URL.endsWith('/') ? FILE_BASE_URL.slice(0, -1) : FILE_BASE_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export { API_URL, FILE_BASE_URL, SOCKET_URL };
export default api;
