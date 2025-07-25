# Au Pair Recommendation System - Usage Guide

## Overview

The Au Pair Recommendation System provides intelligent matching between parents and au pairs using both machine learning algorithms and rule-based approaches. The system offers three types of recommendation algorithms:

1. **Content-Based Filtering** - Matches based on skills, location, and preferences
2. **Collaborative Filtering** - Recommends based on similar parents' preferences  
3. **Hybrid Approach** - Combines both methods for optimal results

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Node.js API   │───▶│  Recommendation  │───▶│   Python ML     │
│   Routes        │    │  Engine (JS)     │    │   Service       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        ▼                        ▼
         │              ┌──────────────────┐    ┌─────────────────┐
         └─────────────▶│   SQLite DB      │    │   ML Model      │
                        │   (User Data)    │    │   (my_model.pkl)│
                        └──────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Installation

The system requires both Node.js and Python dependencies:

```bash
# Python dependencies (for ML service)
pip3 install pandas numpy scikit-learn

# Node.js dependencies (if using npm)
npm install express sqlite3
```

### 2. Initialize the Database

Ensure your SQLite database has the required tables:

```sql
-- Users table (parents and au pairs)
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT, -- 'parent' or 'aupair'
  province TEXT,
  skills_preference TEXT,
  gender_preference TEXT,
  -- Add other relevant fields
);

-- Au Pairs specific data
CREATE TABLE pairners (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  availability_status TEXT, -- 'available', 'busy'
  -- Add other au pair specific fields
);

-- Ratings table
CREATE TABLE ratings (
  id INTEGER PRIMARY KEY,
  parent_id INTEGER,
  aupair_id INTEGER,
  rating INTEGER, -- 1-5
  created_at TEXT
);

-- Recommendation logs (optional, for analytics)
CREATE TABLE recommendation_logs (
  id INTEGER PRIMARY KEY,
  parent_id INTEGER,
  algorithm TEXT,
  recommendation_count INTEGER,
  created_at TEXT
);

-- Feedback table (optional)
CREATE TABLE recommendation_feedback (
  id INTEGER PRIMARY KEY,
  parent_id INTEGER,
  recommendation_ids TEXT, -- JSON array
  feedback_type TEXT, -- 'helpful', 'not_helpful', 'irrelevant'
  comments TEXT,
  created_at TEXT
);
```

### 3. Setup the Recommendation Engine

```javascript
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { createRecommendationRouter } = require('./server/routes/recommendations');

const app = express();
const db = new sqlite3.Database('your_database.db');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(express.json());

// Mount recommendation routes
const recommendationRouter = createRecommendationRouter(db, JWT_SECRET);
app.use('/api/recommendations', recommendationRouter);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## API Endpoints

### Get Personalized Recommendations

```bash
GET /api/recommendations?algorithm=hybrid&limit=10
Authorization: Bearer <jwt-token>
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": 18,
        "name": "Maria Santos",
        "usia": 19,
        "jenis_kelamin": "Perempuan",
        "provinsi": "DKI Jakarta",
        "skills_combined": "Memasak First-Aid Mengemudi",
        "rating_avg": 4.5,
        "pengalaman_tahun": 2,
        "compatibility_score": "89.5",
        "match_explanation": "Strong skill match; Same location; Highly rated",
        "match_type": "ml-hybrid"
      }
    ],
    "algorithm_used": "hybrid",
    "total_found": 5
  }
}
```

### Rate an Au Pair

```bash
POST /api/recommendations/rate
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "auPairId": 18,
  "rating": 5
}
```

### Get Custom Recommendations

```bash
GET /api/recommendations/custom?skills=Memasak,First-Aid&location=DKI Jakarta&gender=Perempuan&limit=5
Authorization: Bearer <jwt-token>
```

### Get Similar Au Pairs

```bash
GET /api/recommendations/similar/18?limit=5
Authorization: Bearer <jwt-token>
```

### Submit Feedback

```bash
POST /api/recommendations/feedback
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "recommendation_ids": [18, 25, 30],
  "feedback_type": "helpful",
  "comments": "Great matches for our family needs"
}
```

## Algorithm Details

### Content-Based Filtering

Scores au pairs based on:
- **Skill Match** (40% weight) - Exact matches with parent requirements
- **Location Preference** (30% weight) - Same province gets highest score
- **Gender Preference** (20% weight) - Matches parent's stated preference
- **Rating Bonus** (30% weight) - Higher rated au pairs get bonus
- **Age Appropriateness** (10% weight) - Prefers 18-25 age range
- **Experience** (10% weight) - More experience gets higher score

### Collaborative Filtering

Uses matrix factorization (SVD) to find patterns in parent-au pair ratings and recommends au pairs liked by parents with similar preferences.

### Hybrid Approach

Combines content-based (60% weight) and collaborative (40% weight) scores for balanced recommendations.

## ML Model Integration

### Python Service Usage

The system includes a Python ML service that can be used directly:

```bash
# Train the model
python3 server/services/MLRecommendationService.py train

# Get recommendations
python3 server/services/MLRecommendationService.py recommend '{
  "algorithm": "hybrid",
  "parent_id": 1,
  "parent_requirements": {
    "skills": ["Memasak", "First-Aid"],
    "location": "DKI Jakarta",
    "gender": "Perempuan"
  },
  "limit": 10
}'
```

### Model File

The system automatically creates and saves a model file (`my_model.pkl`) containing:
- Trained TF-IDF vectorizer for content-based filtering
- SVD model for collaborative filtering
- Sample data for testing

If you have your own trained model, place it in the root directory as `my_model.pkl`.

## Configuration Options

### RecommendationEngine Options

```javascript
const options = {
  limit: 10,           // Number of recommendations
  algorithm: 'hybrid', // 'content', 'collaborative', 'hybrid'
  use_ml: true        // Use ML service or fallback to rule-based
};

const recommendations = await recommendationEngine.getRecommendations(parentId, options);
```

### Algorithm Selection Guide

- **Content-Based**: Best for new parents with clear preferences
- **Collaborative**: Best for parents with rating history
- **Hybrid**: Best overall performance for most cases

## Performance Considerations

1. **ML Service**: First call may be slower due to model loading
2. **Caching**: Consider caching recommendations for frequently requested combinations
3. **Async Processing**: ML recommendations run asynchronously with rule-based fallback
4. **Database Indexing**: Index frequently queried columns (user_id, rating, etc.)

## Error Handling

The system provides comprehensive error handling:

```javascript
try {
  const recommendations = await recommendationEngine.getRecommendations(parentId, options);
} catch (error) {
  console.error('Recommendation error:', error.message);
  // Handle graceful fallback
}
```

## Analytics and Monitoring

### Get System Statistics

```bash
GET /api/recommendations/stats
```

Returns metrics like:
- Total recommendations generated
- Success rate
- Most requested skills
- Average compatibility scores

### Logging

All recommendation requests are logged for analytics:
- Parent ID
- Algorithm used
- Number of recommendations returned
- Timestamp

## Best Practices

1. **Regular Model Retraining**: Update the ML model periodically with new rating data
2. **A/B Testing**: Test different algorithms with different user groups
3. **Feedback Collection**: Actively collect user feedback to improve recommendations
4. **Fallback Strategies**: Always have rule-based fallback when ML fails
5. **Privacy**: Ensure user data privacy when logging and analyzing

## Troubleshooting

### Common Issues

1. **Python ML Service Not Working**
   ```bash
   # Check Python dependencies
   pip3 list | grep -E "(pandas|scikit-learn|numpy)"
   
   # Test service directly
   python3 server/services/MLRecommendationService.py load
   ```

2. **No Recommendations Returned**
   - Check if au pairs are marked as 'available'
   - Verify parent preferences are properly formatted
   - Check database connectivity

3. **Low Quality Recommendations**
   - Ensure sufficient rating data for collaborative filtering
   - Verify skill mappings are correct
   - Consider adjusting algorithm weights

## Example Implementation

See the complete working example in `server/routes/recommendations.js` and `server/models/RecommendationEngine.js`.

For testing purposes, you can use the provided sample data that includes 20 au pairs and 15 parent families with realistic preferences and ratings.

## Support

For issues or questions about the recommendation system, check:
1. Database schema and data quality
2. Python service logs
3. Node.js application logs
4. Network connectivity between services