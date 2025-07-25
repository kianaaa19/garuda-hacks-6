const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (db, JWT_SECRET) => {
  const router = express.Router();

  // Register
  router.post('/register', async (req, res) => {
    try {
      const { email, password, name, phone, child_age, preferred_gender, preferred_age_range, address } = req.body;

      // Check if user exists
      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (user) {
          return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert user
        db.run(
          `INSERT INTO users (email, password, name, phone, child_age, preferred_gender, preferred_age_range, address) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [email, hashedPassword, name, phone, child_age, preferred_gender, preferred_age_range, address],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create user' });
            }

            // Generate token
            const token = jwt.sign({ userId: this.lastID }, JWT_SECRET, { expiresIn: '7d' });
            
            res.status(201).json({
              message: 'User created successfully',
              token,
              user: {
                id: this.lastID,
                email,
                name,
                phone,
                child_age,
                preferred_gender,
                preferred_age_range,
                address
              }
            });
          }
        );
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            child_age: user.child_age,
            preferred_gender: user.preferred_gender,
            preferred_age_range: user.preferred_age_range,
            address: user.address
          }
        });
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Verify token
  router.get('/verify', (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      db.get('SELECT id, email, name, phone, child_age, preferred_gender, preferred_age_range, address FROM users WHERE id = ?', 
        [decoded.userId], (err, user) => {
          if (err || !user) {
            return res.status(401).json({ error: 'Invalid token' });
          }

          res.json({ user });
        });
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  return router;
};
