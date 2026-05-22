import axios from "axios";

const LOCAL_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const FALLBACK_API_URL =
    import.meta.env.VITE_API_FALLBACK_URL || "https://glimpse-backend-tin1.onrender.com";
const API_BASE_CACHE_KEY = "glimpse:apiBaseUrl";
const API_BASE_TTL_MS = 5 * 60 * 1000;
const HEALTH_PATH = "/api/health";

const readCachedBaseUrl = () => {
    try {
        const raw = localStorage.getItem(API_BASE_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.baseUrl || !parsed?.expiresAt) return null;
        if (Date.now() > parsed.expiresAt) return null;
        return parsed.baseUrl;
    } catch {
        return null;
    }
};

const writeCachedBaseUrl = (baseUrl) => {
    try {
        localStorage.setItem(
            API_BASE_CACHE_KEY,
            JSON.stringify({ baseUrl, expiresAt: Date.now() + API_BASE_TTL_MS })
        );
    } catch {
        // Ignore storage errors; fallback detection still works per request.
    }
};

const probeApi = async (baseUrl, timeoutMs = 1200) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(`${baseUrl}${HEALTH_PATH}`, {
            method: "GET",
            signal: controller.signal,
        });
        return response.ok;
    } catch {
        return false;
    } finally {
        clearTimeout(timeoutId);
    }
};

let baseUrlPromise;
const resolveApiBaseUrl = async () => {
    const cached = readCachedBaseUrl();
    if (cached) return cached;

    const localOk = await probeApi(LOCAL_API_URL);
    const resolved = localOk ? LOCAL_API_URL : FALLBACK_API_URL;
    writeCachedBaseUrl(resolved);
    return resolved;
};

const getApiBaseUrl = () => {
    if (!baseUrlPromise) {
        baseUrlPromise = resolveApiBaseUrl();
    }
    return baseUrlPromise;
};

const API = axios.create({
    baseURL: FALLBACK_API_URL,
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

API.interceptors.request.use(async (req) => {
    const token = localStorage.getItem("token");
    const baseUrl = await getApiBaseUrl();
    req.baseURL = baseUrl;
    API.defaults.baseURL = baseUrl;

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

        if (!error?.response && API.defaults.baseURL === LOCAL_API_URL) {
            writeCachedBaseUrl(FALLBACK_API_URL);
            API.defaults.baseURL = FALLBACK_API_URL;
        }
        
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
