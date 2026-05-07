import axios from "axios";

const getToken = () => localStorage.getItem("accessToken");

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

export default api;
