import { io } from "socket.io-client";

const URL = import.meta.env.VITE_API_URL || "https://glimpse-backend-tin1.onrender.com";

export const socket = io(URL, {
	transports: ["websocket", "polling"],
	reconnection: true,
	reconnectionAttempts: 5,
	path: "/socket.io",
	autoConnect: false,
	auth: { token: localStorage.getItem("token") },
});

export const setSocketAuth = (token) => {
	socket.auth = { token };
	if (token) {
		if (!socket.connected) socket.connect();
	} else {
		socket.disconnect();
	}
};
