import { io } from "socket.io-client";

const RENDER_URL = "https://glimpse-backend-tin1.onrender.com";
const URL = import.meta.env.VITE_API_URL || RENDER_URL;

export const socket = io(URL, {
	path: "/socket.io",
	transports: ["websocket", "polling"],
	reconnection: true,
	reconnectionAttempts: 5,
	autoConnect: false,
	auth: { token: localStorage.getItem("token") },
});

export const setSocketAuth = (token) => {
	socket.auth = { token };
	if (token) {
		if (!socket.connected) socket.connect();
	} else {
		try {
			socket.disconnect();
		} catch (e) {
			// ignore
		}
	}
};
