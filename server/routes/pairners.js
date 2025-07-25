const express = require('express');
const jwt = require('jsonwebtoken');

// Auth middleware
const authenticateToken = (JWT_SECRET) => (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

module.exports = (db, JWT_SECRET) => {
  const router = express.Router();
  const auth = authenticateToken(JWT_SECRET);

  // Get all pairners with filtering
  router.get('/', auth, (req, res) => {
    const { gender, min_age, max_age, skills } = req.query;
    
    let query = 'SELECT * FROM pairners WHERE is_available = 1';
    let params = [];

    // Apply filters
    if (gender) {
      query += ' AND gender = ?';
      params.push(gender);
    }

    if (min_age) {
      query += ' AND age >= ?';
      params.push(parseInt(min_age));
    }

    if (max_age) {
      query += ' AND age <= ?';
      params.push(parseInt(max_age));
    }

    if (skills) {
      query += ' AND skills LIKE ?';
      params.push(`%${skills}%`);
    }

    query += ' ORDER BY rating DESC, created_at DESC';

    db.all(query, params, (err, pairners) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ pairners });
    });
  });

  // Get recommended pairners based on user preferences
  router.get('/recommended', auth, (req, res) => {
    // Get user preferences first
    db.get('SELECT preferred_gender, preferred_age_range FROM users WHERE id = ?', [req.userId], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let query = 'SELECT * FROM pairners WHERE is_available = 1';
      let params = [];

      // Apply user preferences
      if (user.preferred_gender && user.preferred_gender !== 'any') {
        query += ' AND gender = ?';
        params.push(user.preferred_gender);
      }

      // Parse age range (e.g., "18-25")
      if (user.preferred_age_range) {
        const [minAge, maxAge] = user.preferred_age_range.split('-').map(age => parseInt(age.trim()));
        if (minAge) {
          query += ' AND age >= ?';
          params.push(minAge);
        }
        if (maxAge) {
          query += ' AND age <= ?';
          params.push(maxAge);
        }
      }

      query += ' ORDER BY rating DESC, created_at DESC LIMIT 10';

      db.all(query, params, (err, pairners) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ pairners });
      });
    });
  });

  // Get single pairner details
  router.get('/:id', auth, (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM pairners WHERE id = ?', [id], (err, pairner) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!pairner) {
        return res.status(404).json({ error: 'Pairner not found' });
      }

      res.json({ pairner });
    });
  });

  // Get pairner's availability (meetings schedule)
  router.get('/:id/availability', auth, (req, res) => {
    const { id } = req.params;

    db.all(
      `SELECT scheduled_date, scheduled_time, status 
       FROM meetings 
       WHERE pairner_id = ? AND status IN ('pending', 'confirmed')
       ORDER BY scheduled_date, scheduled_time`,
      [id],
      (err, meetings) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ availability: meetings });
      }
    );
  });

  // Search pairners
  router.get('/search/:query', auth, (req, res) => {
    const { query } = req.params;
    const searchTerm = `%${query}%`;

    db.all(
      `SELECT * FROM pairners 
       WHERE is_available = 1 AND (
         name LIKE ? OR 
         skills LIKE ? OR 
         bio LIKE ?
       )
       ORDER BY rating DESC`,
      [searchTerm, searchTerm, searchTerm],
      (err, pairners) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ pairners });
      }
    );
  });

  // Rate a pairner (after meeting)
  router.post('/:id/rate', auth, (req, res) => {
    const { id } = req.params;
    const { rating, review } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if user has had a completed meeting with this pairner
    db.get(
      'SELECT * FROM meetings WHERE user_id = ? AND pairner_id = ? AND status = "completed"',
      [req.userId, id],
      (err, meeting) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!meeting) {
          return res.status(400).json({ error: 'You can only rate pairners after a completed meeting' });
        }

        // Calculate new average rating
        db.get('SELECT rating FROM pairners WHERE id = ?', [id], (err, pairner) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (!pairner) {
            return res.status(404).json({ error: 'Pairner not found' });
          }

          // Simple rating update (in real app, you'd store individual ratings)
          const newRating = pairner.rating === 0 ? rating : (pairner.rating + rating) / 2;

          db.run(
            'UPDATE pairners SET rating = ? WHERE id = ?',
            [newRating, id],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to update rating' });
              }

              res.json({ 
                message: 'Rating submitted successfully',
                new_rating: newRating
              });
            }
          );
        });
      }
    );
  });

  return router;
};
