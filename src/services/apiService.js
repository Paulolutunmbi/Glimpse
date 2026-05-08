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
    resendVerification: async (payload) => {
        const response = await api.post('/api/auth/resend-verification', payload);
        return response.data;
    },
    login: async (userData) => {
        const response = await api.post('/api/auth/login', userData);
        return response.data;
    },
    forgotPassword: async (payload) => {
        const response = await api.post('/api/auth/forgot-password', payload);
        return response.data;
    },
    resetPassword: async (payload) => {
        const response = await api.post('/api/auth/reset-password', payload);
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('token');
    }
};

export const postService = {
    getAllPosts: async (params = {}) => {
        const response = await api.get('/api/posts', { params });
        return response.data;
    },
    getTopics: async () => {
        const response = await api.get('/api/posts/topics');
        return response.data;
    },
    createPost: async (payload) => {
        const response = await api.post('/api/posts', payload);
        return response.data;
    },
    toggleLike: async (postId) => {
        const response = await api.put(`/api/posts/${postId}/like`);
        return response.data;
    },
    toggleSave: async (postId) => {
        const response = await api.put(`/api/posts/${postId}/save`);
        return response.data;
    },
};

export const commentService = {
    getByPost: async (postId) => {
        const response = await api.get(`/api/comments/${postId}`);
        return response.data;
    },
    create: async (payload) => {
        const response = await api.post('/api/comments', payload);
        return response.data;
    },
    update: async (commentId, payload) => {
        const response = await api.put(`/api/comments/${commentId}`, payload);
        return response.data;
    },
    remove: async (commentId) => {
        const response = await api.delete(`/api/comments/${commentId}`);
        return response.data;
    },
};

export const userService = {
    getMe: async () => {
        const response = await api.get('/api/user/me');
        return response.data;
    },
    getProfileById: async (userId) => {
        const response = await api.get(`/api/user/profile/${userId}`);
        return response.data;
    },
    updateProfile: async (payload) => {
        if (payload instanceof FormData) {
            const response = await api.patch('/api/user/update-profile', payload);
            return response.data;
        }

        const formData = new FormData();
        Object.entries(payload || {}).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
                return;
            }
            if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });

        const response = await api.patch('/api/user/update-profile', formData);
        return response.data;
    },
    setupProfile: async (payload) => {
        const formData = payload instanceof FormData ? payload : new FormData();

        if (!(payload instanceof FormData)) {
            Object.entries(payload || {}).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    formData.append(key, JSON.stringify(value));
                    return;
                }
                if (value !== undefined && value !== null) {
                    formData.append(key, value);
                }
            });
        }

        const response = await api.patch('/api/user/setup-profile', formData);
        return response.data;
    },
    uploadAvatar: async (payload) => {
        if (payload instanceof FormData) {
            const response = await api.post('/api/user/upload-avatar', payload);
            return response.data;
        }

        if (payload?.file) {
            const formData = new FormData();
            formData.append('profilePicture', payload.file);
            const response = await api.post('/api/user/upload-avatar', formData);
            return response.data;
        }

        const response = await api.post('/api/user/upload-avatar', payload);
        return response.data;
    },
    updatePreferences: async (payload) => {
        const response = await api.post('/api/user/preferences', payload);
        return response.data;
    },
    toggleFollow: async (userId) => {
        const response = await api.patch(`/api/user/follow/${userId}`);
        return response.data;
    },
    getSuggestedCreators: async () => {
        const response = await api.get('/api/user/suggested-creators');
        return response.data;
    },
    sendPasswordResetEmail: async () => {
        const response = await api.post('/api/user/reset-password');
        return response.data;
    },
};
