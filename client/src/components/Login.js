import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { login, register, error, isLoading, clearError } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    child_age: '',
    preferred_gender: 'any',
    preferred_age_range: '18-25',
    address: ''
  });
  const [localError, setLocalError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (localError) setLocalError('');
    if (error) clearError();
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setLocalError('Email and password are required');
      return false;
    }

    if (isRegistering) {
      if (!formData.name) {
        setLocalError('Name is required');
        return false;
      }
      if (!formData.child_age) {
        setLocalError('Child age is required');
        return false;
      }
      if (formData.child_age < 1 || formData.child_age > 18) {
        setLocalError('Child age must be between 1-18 years');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isRegistering) {
      await register(formData);
    } else {
      await login(formData.email, formData.password);
    }
  };

  const switchMode = () => {
    setIsRegistering(!isRegistering);
    setLocalError('');
    clearError();
  };

  const displayError = localError || error;

  return (
    <div className="login-container">
      <div className="login-content">
        {/* Header */}
        <div className="login-header">
          <div className="brand-logo">
            <span className="logo-icon">👶</span>
            <span className="logo-text">aupairly</span>
          </div>
          <h1>{isRegistering ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="login-subtitle">
            {isRegistering 
              ? 'Join our community and find trusted childcare' 
              : 'Sign in to find your perfect au pair'
            }
          </p>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {displayError && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span>{displayError}</span>
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Registration Fields */}
          {isRegistering && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  placeholder="Your phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Child's Age</label>
                <input
                  type="number"
                  name="child_age"
                  className="form-input"
                  placeholder="Age in years"
                  min="1"
                  max="18"
                  value={formData.child_age}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Preferred Gender</label>
                  <select
                    name="preferred_gender"
                    className="form-select"
                    value={formData.preferred_gender}
                    onChange={handleInputChange}
                  >
                    <option value="any">Any</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Age Range</label>
                  <select
                    name="preferred_age_range"
                    className="form-select"
                    value={formData.preferred_age_range}
                    onChange={handleInputChange}
                  >
                    <option value="16-20">16-20 years</option>
                    <option value="18-22">18-22 years</option>
                    <option value="20-25">20-25 years</option>
                    <option value="18-25">18-25 years</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  name="address"
                  className="form-textarea"
                  placeholder="Your address"
                  rows="2"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary btn-full btn-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner"></span>
                {isRegistering ? 'Creating Account...' : 'Signing In...'}
              </span>
            ) : (
              isRegistering ? 'Create Account' : 'Sign In'
            )}
          </button>

          {/* Switch Mode */}
          <div className="form-footer">
            <p>
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                className="link-button"
                onClick={switchMode}
                disabled={isLoading}
              >
                {isRegistering ? 'Sign In' : 'Create Account'}
              </button>
            </p>
          </div>
        </form>

        {/* Info Section */}
        {isRegistering && (
          <div className="info-section">
            <div className="info-card">
              <div className="info-icon">📋</div>
              <div className="info-content">
                <h3>Verification Process</h3>
                <p>After registration, our team will verify your identity and family status to ensure safety for all parties.</p>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="login-features">
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <span>Secure & Verified</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">👥</span>
            <span>Trusted Community</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💝</span>
            <span>Supporting Orphanages</span>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="login-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>
    </div>
  );
}

export default Login;