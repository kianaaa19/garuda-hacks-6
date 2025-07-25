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

    try {
      let result;
      if (isRegistering) {
        result = await register(formData);
      } else {
        result = await login({
          email: formData.email,
          password: formData.password
        });
      }

      if (!result.success) {
        setLocalError(result.error);
      }
    } catch (err) {
      setLocalError('An unexpected error occurred');
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setLocalError('');
    clearError();
    // Reset form but keep email if switching from login to register
    const emailToKeep = formData.email;
    setFormData({
      email: emailToKeep,
      password: '',
      name: '',
      phone: '',
      child_age: '',
      preferred_gender: 'any',
      preferred_age_range: '18-25',
      address: ''
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>aupairly</h1>
          <p>Connecting single parents with trained au pairs</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Error Display */}
          {(error || localError) && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <span>{error || localError}</span>
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="Enter your email"
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
                  placeholder="Enter your full name"
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
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Your Child's Age</label>
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
                <div className="form-help">
                  This helps us find the best au pair match for your child
                </div>
              </div>

              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Gender Preference</label>
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
                  rows="3"
                  placeholder="Enter your address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              {/* Single Parent Verification Notice */}
              <div className="alert alert-info">
                <span>ℹ️</span>
                <div>
                  <strong>Verification Required:</strong>
                  <p className="m-0 mt-xs">After registration, you'll need to provide documents proving single parent status (divorce certificate or death certificate) during the contract signing process.</p>
                </div>
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
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                {isRegistering ? 'Creating Account...' : 'Signing In...'}
              </>
            ) : (
              isRegistering ? 'Create Account' : 'Sign In'
            )}
          </button>

          {/* Toggle Mode */}
          <div className="text-center mt-lg">
            <p className="text-secondary">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggleMode();
                }}
                className="ml-xs"
                style={{ marginLeft: '0.25rem' }}
              >
                {isRegistering ? 'Sign In' : 'Register Now'}
              </a>
            </p>
          </div>

          {/* Features Info */}
          {!isRegistering && (
            <div className="mt-lg">
              <div className="text-center text-secondary text-sm">
                <p className="font-medium mb-sm">Why Choose Aupairly?</p>
                <div className="flex flex-col gap-xs">
                  <div className="flex items-center gap-sm">
                    <span>✓</span>
                    <span>Trained & verified au pairs from affiliated orphanages</span>
                  </div>
                  <div className="flex items-center gap-sm">
                    <span>✓</span>
                    <span>Background checks and skill assessments</span>
                  </div>
                  <div className="flex items-center gap-sm">
                    <span>✓</span>
                    <span>Ongoing monitoring and support</span>
                  </div>
                  <div className="flex items-center gap-sm">
                    <span>✓</span>
                    <span>Flexible arrangements for single parents</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Login;