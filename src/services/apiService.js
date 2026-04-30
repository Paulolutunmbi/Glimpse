import api from '../api/axios';

export const authService = {
    register: async (userData) => {
        const response = await api.post('/api/auth/register', userData);
        return response.data;
    },
    verify: async (payload) => {
        const response = await api.post('/api/auth/verify', payload);
        return response.data;
    },
    login: async (userData) => {
        const response = await api.post('/api/auth/login', userData);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('token');
    }
};

export const postService = {
    getAllPosts: async () => {
        const response = await api.get('/api/posts');
        return response.data;
    }
};
