const bcrypt = require('bcryptjs');

class User {
  constructor(db) {
    this.db = db;
  }

  // Create a new user
  async create(userData) {
    const { email, password, name, phone, child_age, preferred_gender, preferred_age_range, address } = userData;
    
    try {
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      return new Promise((resolve, reject) => {
        this.db.run(
          `INSERT INTO users (email, password, name, phone, child_age, preferred_gender, preferred_age_range, address) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [email, hashedPassword, name, phone, child_age, preferred_gender, preferred_age_range, address],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({
                id: this.lastID,
                email,
                name,
                phone,
                child_age,
                preferred_gender,
                preferred_age_range,
                address
              });
            }
          }
        );
      });
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  findByEmail(email) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    });
  }

  // Find user by ID
  findById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id, email, name, phone, child_age, preferred_gender, preferred_age_range, address, created_at FROM users WHERE id = ?',
        [id],
        (err, user) => {
          if (err) {
            reject(err);
          } else {
            resolve(user);
          }
        }
      );
    });
  }

  // Update user profile
  update(id, userData) {
    const { name, phone, child_age, preferred_gender, preferred_age_range, address } = userData;
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE users SET name = ?, phone = ?, child_age = ?, preferred_gender = ?, 
         preferred_age_range = ?, address = ? WHERE id = ?`,
        [name, phone, child_age, preferred_gender, preferred_age_range, address, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  // Change password
  async changePassword(id, oldPassword, newPassword) {
    try {
      // Get current password hash
      const user = await new Promise((resolve, reject) => {
        this.db.get('SELECT password FROM users WHERE id = ?', [id], (err, user) => {
          if (err) reject(err);
          else resolve(user);
        });
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        throw new Error('Invalid old password');
      }

      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      return new Promise((resolve, reject) => {
        this.db.run(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, id],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve(this.changes > 0);
            }
          }
        );
      });
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  async verifyPassword(email, password) {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        return false;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      return isMatch ? user : false;
    } catch (error) {
      throw error;
    }
  }

  // Delete user (for GDPR compliance)
  delete(id) {
    return new Promise((resolve, reject) => {
      // Start transaction to delete user and related data
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        // Delete related data first
        this.db.run('DELETE FROM chats WHERE user_id = ?', [id]);
        this.db.run('DELETE FROM meetings WHERE user_id = ?', [id]);
        
        // Delete user
        this.db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
          } else {
            this.db.run('COMMIT');
            resolve(this.changes > 0);
          }
        });
      });
    });
  }

  // Get user statistics
  getStats(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT 
           (SELECT COUNT(*) FROM meetings WHERE user_id = ?) as total_meetings,
           (SELECT COUNT(*) FROM meetings WHERE user_id = ? AND status = 'completed') as completed_meetings,
           (SELECT COUNT(*) FROM chats WHERE user_id = ?) as total_messages,
           (SELECT COUNT(DISTINCT pairner_id) FROM chats WHERE user_id = ?) as total_conversations,
           (SELECT created_at FROM users WHERE id = ?) as member_since`,
        [id, id, id, id, id],
        (err, stats) => {
          if (err) {
            reject(err);
          } else {
            resolve(stats);
          }
        }
      );
    });
  }

  // Get user's favorite pairners (based on interactions)
  getFavorites(id, limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT p.*, COUNT(c.id) as message_count
         FROM pairners p
         JOIN chats c ON p.id = c.pairner_id
         WHERE c.user_id = ?
         GROUP BY p.id
         ORDER BY message_count DESC, p.rating DESC
         LIMIT ?`,
        [id, limit],
        (err, favorites) => {
          if (err) {
            reject(err);
          } else {
            resolve(favorites);
          }
        }
      );
    });
  }
}

module.exports = User;