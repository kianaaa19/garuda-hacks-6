const express = require('express');
const router = express.Router();
const RecommendationEngine = require('../models/RecommendationEngine');
const { authenticateToken } = require('../middleware/auth');

// Initialize recommendation engine
let recommendationEngine;

// Middleware to initialize recommendation engine
const initializeRecommendationEngine = (db, jwtSecret) => {
  recommendationEngine = new RecommendationEngine(db);
  
  // Apply authentication middleware to all routes
  router.use(authenticateToken(jwtSecret));
};

// Validation middleware
const validateRecommendationRequest = (req, res, next) => {
  const { limit, algorithm } = req.query;
  
  if (limit && (isNaN(parseInt(limit)) || parseInt(limit) < 1 || parseInt(limit) > 50)) {
    return res.status(400).json({
      error: 'Limit must be between 1 and 50',
      code: 'INVALID_LIMIT'
    });
  }
  
  if (algorithm && !['content', 'collaborative', 'hybrid'].includes(algorithm)) {
    return res.status(400).json({
      error: 'Algorithm must be one of: content, collaborative, hybrid',
      code: 'INVALID_ALGORITHM'
    });
  }
  
  next();
};

const validateRatingRequest = (req, res, next) => {
  const { auPairId, rating } = req.body;
  
  if (!auPairId || isNaN(parseInt(auPairId))) {
    return res.status(400).json({
      error: 'Valid au pair ID is required',
      code: 'INVALID_AUPAIR_ID'
    });
  }
  
  if (!rating || isNaN(parseInt(rating)) || parseInt(rating) < 1 || parseInt(rating) > 5) {
    return res.status(400).json({
      error: 'Rating must be between 1 and 5',
      code: 'INVALID_RATING'
    });
  }
  
  next();
};

/**
 * @route   GET /api/recommendations
 * @desc    Get personalized au pair recommendations for the authenticated parent
 * @access  Private (Parent only)
 * @query   {number} limit - Number of recommendations (default: 10, max: 50)
 * @query   {string} algorithm - Algorithm type: content, collaborative, hybrid (default: hybrid)
 */
router.get('/', validateRecommendationRequest, async (req, res) => {
  try {
    const parentId = req.userId;
    const { limit = 10, algorithm = 'hybrid' } = req.query;
    
    // Check if user is a parent
    if (req.userRole !== 'parent') {
      return res.status(403).json({
        error: 'Access denied. Only parents can get recommendations.',
        code: 'PARENT_ACCESS_REQUIRED'
      });
    }
    
    const recommendations = await recommendationEngine.getRecommendations(parentId, {
      limit: parseInt(limit),
      algorithm
    });
    
    // Log recommendation request for analytics
    await logRecommendationRequest(parentId, algorithm, recommendations.length);
    
    res.json({
      success: true,
      data: {
        recommendations,
        algorithm_used: algorithm,
        total_found: recommendations.length,
        parent_id: parentId
      },
      message: `Found ${recommendations.length} recommendations using ${algorithm} algorithm`
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      error: 'Failed to get recommendations',
      code: 'RECOMMENDATION_FAILED',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/similar/:auPairId
 * @desc    Get similar au pairs for a given au pair (for browsing similar profiles)
 * @access  Private
 * @param   {number} auPairId - Au pair ID to find similar profiles for
 * @query   {number} limit - Number of similar au pairs to return (default: 5, max: 20)
 */
router.get('/similar/:auPairId', async (req, res) => {
  try {
    const { auPairId } = req.params;
    const { limit = 5 } = req.query;
    
    if (isNaN(parseInt(auPairId))) {
      return res.status(400).json({
        error: 'Valid au pair ID is required',
        code: 'INVALID_AUPAIR_ID'
      });
    }
    
    if (limit && (isNaN(parseInt(limit)) || parseInt(limit) < 1 || parseInt(limit) > 20)) {
      return res.status(400).json({
        error: 'Limit must be between 1 and 20',
        code: 'INVALID_LIMIT'
      });
    }
    
    const similarAuPairs = await recommendationEngine.getSimilarAuPairs(
      parseInt(auPairId), 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: {
        similar_aupairs: similarAuPairs,
        reference_aupair_id: parseInt(auPairId),
        total_found: similarAuPairs.length
      }
    });
  } catch (error) {
    console.error('Error getting similar au pairs:', error);
    res.status(500).json({
      error: 'Failed to get similar au pairs',
      code: 'SIMILAR_AUPAIRS_FAILED',
      details: error.message
    });
  }
});

/**
 * @route   POST /api/recommendations/rate
 * @desc    Rate an au pair and update the recommendation model
 * @access  Private (Parent only)
 * @body    {number} auPairId - Au pair ID to rate
 * @body    {number} rating - Rating from 1 to 5
 */
router.post('/rate', validateRatingRequest, async (req, res) => {
  try {
    const parentId = req.userId;
    const { auPairId, rating } = req.body;
    
    // Check if user is a parent
    if (req.userRole !== 'parent') {
      return res.status(403).json({
        error: 'Access denied. Only parents can rate au pairs.',
        code: 'PARENT_ACCESS_REQUIRED'
      });
    }
    
    const result = await recommendationEngine.updateModel(
      parentId, 
      parseInt(auPairId), 
      parseInt(rating)
    );
    
    res.json({
      success: true,
      data: result,
      message: 'Rating submitted successfully and model updated'
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({
      error: 'Failed to submit rating',
      code: 'RATING_FAILED',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/custom
 * @desc    Get recommendations based on custom criteria (for exploring different preferences)
 * @access  Private (Parent only)
 * @query   {string} skills - Comma-separated list of required skills
 * @query   {string} location - Preferred location/province
 * @query   {string} gender - Preferred gender (Laki-laki, Perempuan, or empty for no preference)
 * @query   {number} min_rating - Minimum rating (1-5)
 * @query   {number} max_age - Maximum age
 * @query   {number} min_experience - Minimum experience years
 * @query   {number} limit - Number of recommendations (default: 10)
 */
router.get('/custom', async (req, res) => {
  try {
    const { 
      skills, 
      location, 
      gender, 
      min_rating, 
      max_age, 
      min_experience, 
      limit = 10 
    } = req.query;
    
    // Check if user is a parent
    if (req.userRole !== 'parent') {
      return res.status(403).json({
        error: 'Access denied. Only parents can get recommendations.',
        code: 'PARENT_ACCESS_REQUIRED'
      });
    }
    
    // Parse and validate custom requirements
    const customRequirements = {};
    
    if (skills) {
      customRequirements.skills = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    
    if (location) {
      customRequirements.location = location.trim();
    }
    
    if (gender && ['Laki-laki', 'Perempuan'].includes(gender)) {
      customRequirements.gender = gender;
    }
    
    if (min_rating) {
      const minRating = parseFloat(min_rating);
      if (!isNaN(minRating) && minRating >= 1 && minRating <= 5) {
        customRequirements.min_rating = minRating;
      }
    }
    
    if (max_age) {
      const maxAge = parseInt(max_age);
      if (!isNaN(maxAge) && maxAge >= 16 && maxAge <= 50) {
        customRequirements.max_age = maxAge;
      }
    }
    
    if (min_experience) {
      const minExp = parseInt(min_experience);
      if (!isNaN(minExp) && minExp >= 0 && minExp <= 10) {
        customRequirements.min_experience = minExp;
      }
    }
    
    // Get available au pairs and filter based on custom requirements
    const auPairs = await recommendationEngine.getAvailableAuPairs();
    let filteredAuPairs = auPairs;
    
    // Apply filters
    if (customRequirements.min_rating) {
      filteredAuPairs = filteredAuPairs.filter(ap => 
        (ap.rating_avg || 0) >= customRequirements.min_rating
      );
    }
    
    if (customRequirements.max_age) {
      filteredAuPairs = filteredAuPairs.filter(ap => 
        ap.usia <= customRequirements.max_age
      );
    }
    
    if (customRequirements.min_experience) {
      filteredAuPairs = filteredAuPairs.filter(ap => 
        (ap.pengalaman_tahun || 0) >= customRequirements.min_experience
      );
    }
    
    // Use content-based recommendation with custom requirements
    const parent = { 
      preferensi_keahlian: customRequirements.skills ? customRequirements.skills.join(' ') : '',
      preferensi_gender_aupair: customRequirements.gender || 'Tidak-Ada-Preferensi',
      provinsi: customRequirements.location || ''
    };
    
    const recommendations = await recommendationEngine.getContentBasedRecommendations(
      parent, 
      filteredAuPairs, 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: {
        recommendations,
        custom_requirements: customRequirements,
        total_found: recommendations.length,
        filters_applied: Object.keys(customRequirements).length
      },
      message: `Found ${recommendations.length} au pairs matching custom criteria`
    });
  } catch (error) {
    console.error('Error getting custom recommendations:', error);
    res.status(500).json({
      error: 'Failed to get custom recommendations',
      code: 'CUSTOM_RECOMMENDATION_FAILED',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/stats
 * @desc    Get recommendation system statistics and analytics
 * @access  Private (Admin or for analytics)
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await recommendationEngine.getRecommendationStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting recommendation stats:', error);
    res.status(500).json({
      error: 'Failed to get recommendation statistics',
      code: 'STATS_FAILED',
      details: error.message
    });
  }
});

/**
 * @route   POST /api/recommendations/feedback
 * @desc    Submit feedback on recommendation quality
 * @access  Private (Parent only)
 * @body    {array} recommendation_ids - Array of au pair IDs that were recommended
 * @body    {string} feedback_type - Type: helpful, not_helpful, irrelevant
 * @body    {string} comments - Optional feedback comments
 */
router.post('/feedback', async (req, res) => {
  try {
    const parentId = req.userId;
    const { recommendation_ids, feedback_type, comments } = req.body;
    
    // Check if user is a parent
    if (req.userRole !== 'parent') {
      return res.status(403).json({
        error: 'Access denied. Only parents can provide feedback.',
        code: 'PARENT_ACCESS_REQUIRED'
      });
    }
    
    // Validate input
    if (!Array.isArray(recommendation_ids) || recommendation_ids.length === 0) {
      return res.status(400).json({
        error: 'Recommendation IDs array is required',
        code: 'INVALID_RECOMMENDATION_IDS'
      });
    }
    
    if (!['helpful', 'not_helpful', 'irrelevant'].includes(feedback_type)) {
      return res.status(400).json({
        error: 'Feedback type must be: helpful, not_helpful, or irrelevant',
        code: 'INVALID_FEEDBACK_TYPE'
      });
    }
    
    // Store feedback for future model improvements
    const feedback = await storeFeedback(parentId, recommendation_ids, feedback_type, comments);
    
    res.json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      error: 'Failed to submit feedback',
      code: 'FEEDBACK_FAILED',
      details: error.message
    });
  }
});

// Helper functions
async function logRecommendationRequest(parentId, algorithm, count) {
  try {
    const db = recommendationEngine.db;
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO recommendation_logs (parent_id, algorithm, recommendation_count, created_at) 
         VALUES (?, ?, ?, ?)`,
        [parentId, algorithm, count, new Date().toISOString()],
        function(err) {
          if (err) {
            console.error('Error logging recommendation request:', err);
            // Don't reject - logging shouldn't break the main functionality
            resolve(null);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error in logRecommendationRequest:', error);
  }
}

async function storeFeedback(parentId, recommendationIds, feedbackType, comments) {
  try {
    const db = recommendationEngine.db;
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO recommendation_feedback (parent_id, recommendation_ids, feedback_type, comments, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [parentId, JSON.stringify(recommendationIds), feedbackType, comments || '', new Date().toISOString()],
        function(err) {
          if (err) reject(err);
          else resolve({
            id: this.lastID,
            parent_id: parentId,
            feedback_type: feedbackType,
            recommendation_count: recommendationIds.length
          });
        }
      );
    });
  } catch (error) {
    console.error('Error storing feedback:', error);
    throw error;
  }
}

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error('Recommendation route error:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Function to create and configure the recommendation router
const createRecommendationRouter = (db, jwtSecret) => {
  // Initialize the recommendation engine
  initializeRecommendationEngine(db, jwtSecret);
  
  return router;
};

// Export the router creation function and direct router access
module.exports = {
  router, // Direct router access (requires manual initialization)
  createRecommendationRouter, // Preferred way - creates configured router
  initializeRecommendationEngine // Initialization function
};