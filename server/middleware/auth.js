const jwt = require('jsonwebtoken');

// Main authentication middleware
const authenticateToken = (JWT_SECRET) => {
  return (req, res, next) => {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.userRole = decoded.role || 'user'; // Default role is 'user'
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token.',
          code: 'INVALID_TOKEN'
        });
      } else {
        return res.status(500).json({ 
          error: 'Token verification failed.',
          code: 'VERIFICATION_FAILED'
        });
      }
    }
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = (JWT_SECRET) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.userId = null;
      req.userRole = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.userRole = decoded.role || 'user';
      next();
    } catch (error) {
      // If token is invalid, continue without authentication
      req.userId = null;
      req.userRole = null;
      next();
    }
  };
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userId) {
      return res.status(401).json({ 
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Rate limiting middleware (simple implementation)
const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => { // 15 minutes
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const userRequests = requests.get(key);
    
    if (now > userRequests.resetTime) {
      // Reset window
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        resetTime: userRequests.resetTime
      });
    }

    userRequests.count++;
    next();
  };
};

// Validate user ownership (for updating profiles, etc.)
const validateOwnership = (resourceIdParam = 'id') => {
  return (req, res, next) => {
    const resourceId = req.params[resourceIdParam];
    
    // Convert to number for comparison if needed
    const userId = parseInt(req.userId);
    const targetId = parseInt(resourceId);

    if (userId !== targetId) {
      return res.status(403).json({
        error: 'You can only access your own resources.',
        code: 'OWNERSHIP_REQUIRED'
      });
    }

    next();
  };
};

// Input validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed.',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        })),
        code: 'VALIDATION_ERROR'
      });
    }

    next();
  };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Only set HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

// Generate JWT token
const generateToken = (payload, JWT_SECRET, options = {}) => {
  const defaultOptions = {
    expiresIn: '7d',
    issuer: 'aupairly-api',
    audience: 'aupairly-users'
  };

  return jwt.sign(payload, JWT_SECRET, { ...defaultOptions, ...options });
};

// Verify and decode token without middleware
const verifyToken = (token, JWT_SECRET) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

// Error handler for auth-related errors
const authErrorHandler = (error, req, res, next) => {
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Invalid token.',
      code: 'INVALID_TOKEN'
    });
  }

  if (error.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'Invalid CSRF token.',
      code: 'INVALID_CSRF'
    });
  }

  next(error);
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authorize,
  rateLimiter,
  validateOwnership,
  validateInput,
  securityHeaders,
  generateToken,
  verifyToken,
  authErrorHandler
};