import { io } from "socket.io-client";
import { API_BASE_URL } from "./config/api";

export const socket = io(API_BASE_URL, {
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
