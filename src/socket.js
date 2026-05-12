import { io } from "socket.io-client";

const URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getToken = () => localStorage.getItem('token');

export const socket = io(URL, {
	transports: ["websocket", "polling"],
	reconnection: true,
	reconnectionAttempts: 5,
	auth: { token: getToken() },
});

export const updateSocketAuth = (token) => {
	socket.auth = { token };
	if (token) {
		if (!socket.connected) {
			socket.connect();
		}
	} else if (socket.connected) {
		socket.disconnect();
	}
};
