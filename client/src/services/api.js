import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// API service object
const apiService = {
  // Authentication endpoints
  auth: {
    login: async (credentials) => {
      try {
        const response = await api.post('/auth/login', credentials);
        return response;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },

    register: async (userData) => {
      try {
        const response = await api.post('/auth/register', userData);
        return response;
      } catch (error) {
        console.error('Register error:', error);
        throw error;
      }
    },

    verifyToken: async () => {
      try {
        const response = await api.get('/auth/me');
        return response;
      } catch (error) {
        console.error('Token verification error:', error);
        throw error;
      }
    },

    logout: async () => {
      try {
        await api.post('/auth/logout');
        localStorage.removeItem('token');
      } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('token');
      }
    }
  },

  // User endpoints
  users: {
    getProfile: async () => {
      try {
        const response = await api.get('/users/profile');
        return response;
      } catch (error) {
        console.error('Get profile error:', error);
        throw error;
      }
    },

    updateProfile: async (profileData) => {
      try {
        const response = await api.put('/users/profile', profileData);
        return response;
      } catch (error) {
        console.error('Update profile error:', error);
        throw error;
      }
    },

    getMeetings: async () => {
      try {
        const response = await api.get('/users/meetings');
        return response;
      } catch (error) {
        console.error('Get meetings error:', error);
        throw error;
      }
    },

    scheduleMeeting: async (meetingData) => {
      try {
        const response = await api.post('/users/meetings', meetingData);
        return response;
      } catch (error) {
        console.error('Schedule meeting error:', error);
        throw error;
      }
    }
  },

  // Au pair endpoints
  pairners: {
    getAll: async (params = {}) => {
      try {
        const response = await api.get('/pairners', { params });
        return response;
      } catch (error) {
        console.error('Get pairners error:', error);
        return { pairners: [] };
      }
    },

    getById: async (id) => {
      try {
        const response = await api.get(`/pairners/${id}`);
        return response;
      } catch (error) {
        console.error('Get pairner error:', error);
        throw error;
      }
    },

    getRecommended: async () => {
      try {
        const response = await api.get('/pairners/recommended');
        return response;
      } catch (error) {
        console.error('Get recommended pairners error:', error);
        return { pairners: [] };
      }
    },

    search: async (searchParams) => {
      try {
        const response = await api.get('/pairners/search', { params: searchParams });
        return response;
      } catch (error) {
        console.error('Search pairners error:', error);
        return { pairners: [] };
      }
    }
  },

  // Chat endpoints
  chat: {
    getConversations: async () => {
      try {
        const response = await api.get('/chat/conversations');
        return response;
      } catch (error) {
        console.error('Get conversations error:', error);
        return { conversations: [] };
      }
    },

    getMessages: async (pairnerId) => {
      try {
        const response = await api.get(`/chat/${pairnerId}`);
        return response;
      } catch (error) {
        console.error('Get messages error:', error);
        return { messages: [] };
      }
    },

    sendMessage: async (pairnerId, message) => {
      try {
        const response = await api.post(`/chat/${pairnerId}`, { message });
        return response;
      } catch (error) {
        console.error('Send message error:', error);
        throw error;
      }
    },

    getStats: async () => {
      try {
        const response = await api.get('/chat/stats');
        return response;
      } catch (error) {
        console.error('Get chat stats error:', error);
        return { stats: { total_conversations: 0 } };
      }
    }
  },

  // Health check
  health: {
    check: async () => {
      try {
        const response = await api.get('/health');
        return response;
      } catch (error) {
        console.error('Health check error:', error);
        throw error;
      }
    }
  }
};

export default apiService;