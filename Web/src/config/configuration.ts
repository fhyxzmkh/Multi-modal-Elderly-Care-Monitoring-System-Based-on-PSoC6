import axios from "axios";

const BASE_URL = "http://123.60.80.170:9988/api";

export const axios_login_instance = axios.create({
  baseURL: BASE_URL,
});

axios_login_instance.interceptors.request.use(
  function (config) {
    // 在发送请求之前做些什么
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
  },
);
