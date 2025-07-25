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

  // Get user profile
  router.get('/profile', auth, (req, res) => {
    db.get(
      'SELECT id, email, name, phone, child_age, preferred_gender, preferred_age_range, address FROM users WHERE id = ?',
      [req.userId],
      (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
      }
    );
  });

  // Update user profile
  router.put('/profile', auth, (req, res) => {
    const { name, phone, child_age, preferred_gender, preferred_age_range, address } = req.body;

    db.run(
      `UPDATE users SET name = ?, phone = ?, child_age = ?, preferred_gender = ?, 
       preferred_age_range = ?, address = ? WHERE id = ?`,
      [name, phone, child_age, preferred_gender, preferred_age_range, address, req.userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update profile' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully' });
      }
    );
  });

  // Get user's meetings
  router.get('/meetings', auth, (req, res) => {
    db.all(
      `SELECT m.*, p.name as pairner_name, p.age as pairner_age, p.gender as pairner_gender
       FROM meetings m
       JOIN pairners p ON m.pairner_id = p.id
       WHERE m.user_id = ?
       ORDER BY m.scheduled_date DESC, m.scheduled_time DESC`,
      [req.userId],
      (err, meetings) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ meetings });
      }
    );
  });

  // Schedule a meeting
  router.post('/meetings', auth, (req, res) => {
    const { pairner_id, scheduled_date, scheduled_time, notes } = req.body;

    // Check if pairner exists and is available
    db.get('SELECT * FROM pairners WHERE id = ? AND is_available = 1', [pairner_id], (err, pairner) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!pairner) {
        return res.status(404).json({ error: 'Pairner not found or not available' });
      }

      // Check if user already has a meeting with this pairner on the same date
      db.get(
        'SELECT * FROM meetings WHERE user_id = ? AND pairner_id = ? AND scheduled_date = ?',
        [req.userId, pairner_id, scheduled_date],
        (err, existingMeeting) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existingMeeting) {
            return res.status(400).json({ error: 'You already have a meeting with this pairner on this date' });
          }

          // Create meeting
          db.run(
            'INSERT INTO meetings (user_id, pairner_id, scheduled_date, scheduled_time, notes) VALUES (?, ?, ?, ?, ?)',
            [req.userId, pairner_id, scheduled_date, scheduled_time, notes],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to schedule meeting' });
              }

              res.status(201).json({
                message: 'Meeting scheduled successfully',
                meeting: {
                  id: this.lastID,
                  user_id: req.userId,
                  pairner_id,
                  scheduled_date,
                  scheduled_time,
                  notes,
                  status: 'pending'
                }
              });
            }
          );
        }
      );
    });
  });

  // Update meeting status
  router.put('/meetings/:meetingId', auth, (req, res) => {
    const { meetingId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    db.run(
      'UPDATE meetings SET status = ? WHERE id = ? AND user_id = ?',
      [status, meetingId, req.userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Meeting not found' });
        }

        res.json({ message: 'Meeting status updated successfully' });
      }
    );
  });

  return router;
};
