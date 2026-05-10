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
    getAllPosts: async () => {
        const response = await api.get('/api/posts');
        return response.data;
    },
    getFeed: async ({ type = 'latest', cursor, limit = 10 } = {}) => {
        const response = await api.get('/api/posts/feed', {
            params: { type, cursor, limit },
        });
        return response.data;
    },
    createPost: async (payload, options = {}) => {
        if (payload instanceof FormData) {
            const response = await api.post('/api/posts', payload, {
                onUploadProgress: options.onProgress,
            });
            return response.data;
        }

        if (payload?.files || payload?.media) {
            const formData = new FormData();
            const files = payload.files || payload.media || [];
            files.forEach((file) => formData.append('media', file));
            if (payload.caption) formData.append('caption', payload.caption);
            if (payload.title) formData.append('title', payload.title);
            if (payload.visibility) formData.append('visibility', payload.visibility);
            if (payload.tags) formData.append('tags', JSON.stringify(payload.tags));
            if (payload.hashtags) formData.append('hashtags', JSON.stringify(payload.hashtags));
            if (payload.mentions) formData.append('mentions', JSON.stringify(payload.mentions));
            const response = await api.post('/api/posts', formData, {
                onUploadProgress: options.onProgress,
            });
            return response.data;
        }

        const response = await api.post('/api/posts', payload);
        return response.data;
    },
    toggleLike: async (postId) => {
        const response = await api.put(`/api/posts/${postId}/like`);
        return response.data;
    },
    trackView: async (postId) => {
        const response = await api.post(`/api/posts/${postId}/view`);
        return response.data;
    },
    sharePost: async (postId) => {
        const response = await api.post(`/api/posts/${postId}/share`);
        return response.data;
    },
    deletePost: async (postId) => {
        const response = await api.delete(`/api/posts/${postId}`);
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
    getProfile: async (userId) => {
        const response = await api.get(`/api/user/profile/${userId}`);
        return response.data;
    },
    getProfileStats: async (userId) => {
        const response = await api.get(`/api/user/profile/${userId}/stats`);
        return response.data;
    },
    getSavedMoments: async ({ cursor, limit = 10 } = {}) => {
        const response = await api.get('/api/user/saved', {
            params: { cursor, limit },
        });
        return response.data;
    },
    updateProfile: async (payload) => {
        const response = await api.patch('/api/user/update', payload);
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
    uploadCoverImage: async (payload) => {
        if (payload instanceof FormData) {
            const response = await api.post('/api/user/upload-cover-image', payload);
            return response.data;
        }

        if (payload?.file) {
            const formData = new FormData();
            formData.append('coverImage', payload.file);
            const response = await api.post('/api/user/upload-cover-image', formData);
            return response.data;
        }

        const response = await api.post('/api/user/upload-cover-image', payload);
        return response.data;
    },
    updatePreferences: async (payload) => {
        const response = await api.post('/api/user/preferences', payload);
        return response.data;
    },
    followUser: async (userId) => {
        const response = await api.post(`/api/user/follow/${userId}`);
        return response.data;
    },
    unfollowUser: async (userId) => {
        const response = await api.post(`/api/user/unfollow/${userId}`);
        return response.data;
    },
    savePost: async (postId) => {
        const response = await api.post(`/api/user/saved/${postId}`);
        return response.data;
    },
    unsavePost: async (postId) => {
        const response = await api.delete(`/api/user/saved/${postId}`);
        return response.data;
    },
    toggleFollow: async (userId, isFollowing) => {
        const endpoint = isFollowing ? 'unfollow' : 'follow';
        const response = await api.post(`/api/user/${endpoint}/${userId}`);
        return response.data;
    },
    sendPasswordResetEmail: async () => {
        const response = await api.post('/api/user/reset-password');
        return response.data;
    },
};

export const settingsService = {
    getSettings: async () => {
        const response = await api.get('/api/user/settings');
        return response.data;
    },
    updateSettings: async (payload) => {
        const response = await api.patch('/api/user/settings', payload);
        return response.data;
    },
    updatePrivacy: async (payload) => {
        const response = await api.patch('/api/user/settings/privacy', payload);
        return response.data;
    },
    updateNotifications: async (payload) => {
        const response = await api.patch('/api/user/settings/notifications', payload);
        return response.data;
    },
    updateAppearance: async (payload) => {
        const response = await api.patch('/api/user/settings/appearance', payload);
        return response.data;
    },
    logoutOtherSessions: async (payload) => {
        const response = await api.post('/api/user/settings/logout-others', payload);
        return response.data;
    },
    blockUser: async (payload) => {
        const response = await api.post('/api/user/settings/block', payload);
        return response.data;
    },
    unblockUser: async (payload) => {
        const response = await api.post('/api/user/settings/unblock', payload);
        return response.data;
    },
    muteUser: async (payload) => {
        const response = await api.post('/api/user/settings/mute', payload);
        return response.data;
    },
    unmuteUser: async (payload) => {
        const response = await api.post('/api/user/settings/unmute', payload);
        return response.data;
    },
};

export const discoveryService = {
    getDiscovery: async () => {
        const response = await api.get('/api/discovery');
        return response.data;
    },
};
