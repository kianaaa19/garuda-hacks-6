class Pairner {
    constructor(db) {
      this.db = db;
    }
  
    // Get all available pairners with filters
    getAll(filters = {}) {
      const { gender, min_age, max_age, skills, limit = 50, offset = 0 } = filters;
      
      let query = 'SELECT * FROM pairners WHERE is_available = 1';
      let params = [];
  
      // Apply filters
      if (gender && gender !== 'any') {
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
  
      query += ' ORDER BY rating DESC, created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));
  
      return new Promise((resolve, reject) => {
        this.db.all(query, params, (err, pairners) => {
          if (err) {
            reject(err);
          } else {
            resolve(pairners);
          }
        });
      });
    }
  
    // Get pairner by ID
    findById(id) {
      return new Promise((resolve, reject) => {
        this.db.get('SELECT * FROM pairners WHERE id = ?', [id], (err, pairner) => {
          if (err) {
            reject(err);
          } else {
            resolve(pairner);
          }
        });
      });
    }
  
    // Get recommended pairners based on user preferences
    getRecommended(userPreferences) {
      const { preferred_gender, preferred_age_range, limit = 10 } = userPreferences;
      
      let query = 'SELECT * FROM pairners WHERE is_available = 1';
      let params = [];
  
      // Apply user preferences
      if (preferred_gender && preferred_gender !== 'any') {
        query += ' AND gender = ?';
        params.push(preferred_gender);
      }
  
      // Parse age range (e.g., "18-25")
      if (preferred_age_range) {
        const ageRange = preferred_age_range.split('-');
        if (ageRange.length === 2) {
          const [minAge, maxAge] = ageRange.map(age => parseInt(age.trim()));
          if (minAge) {
            query += ' AND age >= ?';
            params.push(minAge);
          }
          if (maxAge) {
            query += ' AND age <= ?';
            params.push(maxAge);
          }
        }
      }
  
      query += ' ORDER BY rating DESC, created_at DESC LIMIT ?';
      params.push(parseInt(limit));
  
      return new Promise((resolve, reject) => {
        this.db.all(query, params, (err, pairners) => {
          if (err) {
            reject(err);
          } else {
            resolve(pairners);
          }
        });
      });
    }
  
    // Search pairners
    search(searchTerm, limit = 20) {
      const searchPattern = `%${searchTerm}%`;
      
      return new Promise((resolve, reject) => {
        this.db.all(
          `SELECT * FROM pairners 
           WHERE is_available = 1 AND (
             name LIKE ? OR 
             skills LIKE ? OR 
             bio LIKE ?
           )
           ORDER BY rating DESC, name ASC
           LIMIT ?`,
          [searchPattern, searchPattern, searchPattern, parseInt(limit)],
          (err, pairners) => {
            if (err) {
              reject(err);
            } else {
              resolve(pairners);
            }
          }
        );
      });
    }
  
    // Get pairner's availability (scheduled meetings)
    getAvailability(id) {
      return new Promise((resolve, reject) => {
        this.db.all(
          `SELECT scheduled_date, scheduled_time, status 
           FROM meetings 
           WHERE pairner_id = ? AND status IN ('pending', 'confirmed')
           ORDER BY scheduled_date, scheduled_time`,
          [id],
          (err, meetings) => {
            if (err) {
              reject(err);
            } else {
              resolve(meetings);
            }
          }
        );
      });
    }
  
    // Update pairner rating
    updateRating(id, newRating) {
      return new Promise((resolve, reject) => {
        // Get current rating first
        this.db.get('SELECT rating FROM pairners WHERE id = ?', [id], (err, pairner) => {
          if (err) {
            reject(err);
            return;
          }
  
          if (!pairner) {
            reject(new Error('Pairner not found'));
            return;
          }
  
          // Calculate new average (simplified - in real app, store individual ratings)
          const updatedRating = pairner.rating === 0 ? newRating : (pairner.rating + newRating) / 2;
  
          this.db.run(
            'UPDATE pairners SET rating = ? WHERE id = ?',
            [updatedRating, id],
            function(err) {
              if (err) {
                reject(err);
              } else {
                resolve({
                  updated: this.changes > 0,
                  new_rating: updatedRating
                });
              }
            }
          );
        });
      });
    }
  
    // Update availability status
    updateAvailability(id, isAvailable) {
      return new Promise((resolve, reject) => {
        this.db.run(
          'UPDATE pairners SET is_available = ? WHERE id = ?',
          [isAvailable ? 1 : 0, id],
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
  
    // Get pairner statistics
    getStats(id) {
      return new Promise((resolve, reject) => {
        this.db.get(
          `SELECT 
             (SELECT COUNT(*) FROM meetings WHERE pairner_id = ?) as total_meetings,
             (SELECT COUNT(*) FROM meetings WHERE pairner_id = ? AND status = 'completed') as completed_meetings,
             (SELECT COUNT(*) FROM chats WHERE pairner_id = ?) as total_messages,
             (SELECT COUNT(DISTINCT user_id) FROM chats WHERE pairner_id = ?) as total_conversations,
             p.rating,
             p.created_at as member_since
           FROM pairners p
           WHERE p.id = ?`,
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
  
    // Get pairners by orphanage
    getByOrphanage(orphanageId, limit = 20) {
      return new Promise((resolve, reject) => {
        this.db.all(
          'SELECT * FROM pairners WHERE orphanage_id = ? AND is_available = 1 ORDER BY rating DESC, name ASC LIMIT ?',
          [orphanageId, parseInt(limit)],
          (err, pairners) => {
            if (err) {
              reject(err);
            } else {
              resolve(pairners);
            }
          }
        );
      });
    }
  
    // Get top rated pairners
    getTopRated(limit = 10) {
      return new Promise((resolve, reject) => {
        this.db.all(
          'SELECT * FROM pairners WHERE is_available = 1 AND rating > 0 ORDER BY rating DESC, name ASC LIMIT ?',
          [parseInt(limit)],
          (err, pairners) => {
            if (err) {
              reject(err);
            } else {
              resolve(pairners);
            }
          }
        );
      });
    }
  
    // Get recently added pairners
    getRecent(limit = 10) {
      return new Promise((resolve, reject) => {
        this.db.all(
          'SELECT * FROM pairners WHERE is_available = 1 ORDER BY created_at DESC LIMIT ?',
          [parseInt(limit)],
          (err, pairners) => {
            if (err) {
              reject(err);
            } else {
              resolve(pairners);
            }
          }
        );
      });
    }
  
    // Create new pairner (admin function)
    create(pairnerData) {
      const { name, age, gender, orphanage_id, skills, bio, intro_video_url } = pairnerData;
      
      return new Promise((resolve, reject) => {
        this.db.run(
          `INSERT INTO pairners (name, age, gender, orphanage_id, skills, bio, intro_video_url) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [name, age, gender, orphanage_id, skills, bio, intro_video_url],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({
                id: this.lastID,
                name,
                age,
                gender,
                orphanage_id,
                skills,
                bio,
                intro_video_url,
                is_available: true,
                rating: 0
              });
            }
          }
        );
      });
    }
  
    // Update pairner profile (admin function)
    update(id, pairnerData) {
      const { name, age, gender, skills, bio, intro_video_url } = pairnerData;
      
      return new Promise((resolve, reject) => {
        this.db.run(
          `UPDATE pairners SET name = ?, age = ?, gender = ?, skills = ?, bio = ?, intro_video_url = ? 
           WHERE id = ?`,
          [name, age, gender, skills, bio, intro_video_url, id],
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
  }
  
  module.exports = Pairner;