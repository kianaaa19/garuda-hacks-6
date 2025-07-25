import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  VERIFY_START: 'VERIFY_START',
  VERIFY_SUCCESS: 'VERIFY_SUCCESS',
  VERIFY_FAILURE: 'VERIFY_FAILURE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false
};

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.VERIFY_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isInitialized: true
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
    case AUTH_ACTIONS.VERIFY_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        isInitialized: true
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isInitialized: true
      };

    case AUTH_ACTIONS.VERIFY_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isInitialized: true
      };

    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        error: null
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.VERIFY_START });
      
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.VERIFY_FAILURE, payload: 'No token found' });
        return;
      }

      // Verify token with backend
      const response = await apiService.auth.verifyToken();
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.VERIFY_SUCCESS,
          payload: {
            user: response.user,
            token: token
          }
        });
      } else {
        localStorage.removeItem('token');
        dispatch({ type: AUTH_ACTIONS.VERIFY_FAILURE, payload: 'Invalid token' });
      }
    } catch (error) {
      localStorage.removeItem('token');
      dispatch({ type: AUTH_ACTIONS.VERIFY_FAILURE, payload: 'Token verification failed' });
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await apiService.auth.login({ email, password });
      
      if (response.success) {
        localStorage.setItem('token', response.token);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.user,
            token: response.token
          }
        });
        return { success: true };
      } else {
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: response.message });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: message });
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });
      
      const response = await apiService.auth.register(userData);
      
      if (response.success) {
        localStorage.setItem('token', response.token);
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: {
            user: response.user,
            token: response.token
          }
        });
        return { success: true };
      } else {
        dispatch({ type: AUTH_ACTIONS.REGISTER_FAILURE, payload: response.message });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.REGISTER_FAILURE, payload: message });
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await apiService.users.updateProfile(profileData);
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_PROFILE,
          payload: response.user
        });
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      return { success: false, message };
    }
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const getDisplayName = () => {
    return state.user?.name || 'User';
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    getDisplayName
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;