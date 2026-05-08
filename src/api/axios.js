import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

const authEvents = new EventTarget();
const AUTH_LOGOUT_EVENT = "auth:logout";

export const onAuthLogout = (handler) => {
    const listener = () => handler();
    authEvents.addEventListener(AUTH_LOGOUT_EVENT, listener);
    return () => authEvents.removeEventListener(AUTH_LOGOUT_EVENT, listener);
};

API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");

    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }

    return req;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            localStorage.removeItem("token");
            authEvents.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
        }
        return Promise.reject(error);
    }
);

export default API;
