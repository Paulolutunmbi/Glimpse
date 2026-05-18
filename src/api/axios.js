import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://glimpse-backend-tin1.onrender.com",
});

const authEvents = new EventTarget();
const AUTH_LOGOUT_EVENT = "auth:logout";
const ADMIN_ACCESS_EVENT = "admin:unauthorized";

export const onAdminAccessAttempt = (handler) => {
    const listener = (event) => handler(event.detail);
    authEvents.addEventListener(ADMIN_ACCESS_EVENT, listener);
    return () => authEvents.removeEventListener(ADMIN_ACCESS_EVENT, listener);
};

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
        const status = error?.response?.status;
        const code = error?.response?.data?.code;
        
        if (status === 401 || (status === 403 && code === 'BANNED')) {
            localStorage.removeItem("token");
            authEvents.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
        }

        if (status === 403 && code === 'ADMIN_UNAUTHORIZED') {
            const detail = {
                message: "Unauthorized access detected.",
                attemptsRemaining: error?.response?.data?.attemptsRemaining,
            };
            authEvents.dispatchEvent(new CustomEvent(ADMIN_ACCESS_EVENT, { detail }));
        }
        
        return Promise.reject(error);
    }
);

export default API;
