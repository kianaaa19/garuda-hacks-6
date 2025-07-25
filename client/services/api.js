const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('aupairly_token');
  }

  // Set auth token
  setAuthToken(token) {
    localStorage.setItem('aupairly_token', token);
  }

  // Remove auth token
  removeAuthToken() {
    localStorage.removeItem('aupairly_token');
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  auth = {
    register: async (userData) => {
      const response = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      if (response.token) {
        this.setAuthToken(response.token);
      }
      return response;
    },

    login: async (credentials) => {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (response.token) {
        this.setAuthToken(response.token);
      }
      return response;
    },

    verify: async () => {
      return await this.request('/auth/verify');
    },

    logout: () => {
      this.removeAuthToken();
    }
  };

  // User endpoints
  users = {
    getProfile: async () => {
      return await this.request('/users/profile');
    },

    updateProfile: async (profileData) => {
      return await this.request('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
    },

    getMeetings: async () => {
      return await this.request('/users/meetings');
    },

    scheduleMeeting: async (meetingData) => {
      return await this.request('/users/meetings', {
        method: 'POST',
        body: JSON.stringify(meetingData),
      });
    },

    updateMeetingStatus: async (meetingId, status) => {
      return await this.request(`/users/meetings/${meetingId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    }
  };

  // Pairners endpoints
  pairners = {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams(filters);
      return await this.request(`/pairners?${params}`);
    },

    getRecommended: async () => {
      return await this.request('/pairners/recommended');
    },

    getById: async (id) => {
      return await this.request(`/pairners/${id}`);
    },

    getAvailability: async (id) => {
      return await this.request(`/pairners/${id}/availability`);
    },

    search: async (query) => {
      return await this.request(`/pairners/search/${encodeURIComponent(query)}`);
    },

    rate: async (id, rating, review) => {
      return await this.request(`/pairners/${id}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating, review }),
      });
    }
  };

  // Chat endpoints
  chat = {
    getConversations: async () => {
      return await this.request('/chat/conversations');
    },

    getMessages: async (pairnerId, page = 1) => {
      return await this.request(`/chat/messages/${pairnerId}?page=${page}`);
    },

    sendMessage: async (pairnerId, message) => {
      return await this.request('/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ pairner_id: pairnerId, message }),
      });
    },

    deleteConversation: async (pairnerId) => {
      return await this.request(`/chat/conversations/${pairnerId}`, {
        method: 'DELETE',
      });
    },

    getStats: async () => {
      return await this.request('/chat/stats');
    },

    search: async (query, pairnerId = null) => {
      const params = new URLSearchParams({ query });
      if (pairnerId) params.append('pairner_id', pairnerId);
      return await this.request(`/chat/search?${params}`);
    }
  };

  // Utility methods
  utils = {
    healthCheck: async () => {
      return await this.request('/health');
    }
  };
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;

// Export individual services for convenience
export const { auth, users, pairners, chat, utils } = apiService;