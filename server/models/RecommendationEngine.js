const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class RecommendationEngine {
  constructor(db) {
    this.db = db;
    this.pythonServicePath = path.join(__dirname, '../services/MLRecommendationService.py');
    this.skillWeights = {
      memasak: 0.2,
      first_aid: 0.25,
      mengemudi: 0.15,
      berenang: 0.1,
      komputer: 0.1,
      musik: 0.1,
      olahraga: 0.1
    };
    this.locationWeight = 0.3;
    this.genderWeight = 0.2;
    this.ratingWeight = 0.3;
    this.ageWeight = 0.1;
    this.experienceWeight = 0.1;
  }

  // Get recommendations for a parent based on their preferences
  async getRecommendations(parentId, options = {}) {
    const { limit = 10, algorithm = 'hybrid', use_ml = true } = options;
    
    try {
      // Get parent information and preferences
      const parent = await this.getParentById(parentId);
      if (!parent) {
        throw new Error('Parent not found');
      }

      let recommendations = [];

      // Try ML-based recommendations first if enabled
      if (use_ml) {
        try {
          const mlRecommendations = await this.getMLRecommendations(parentId, parent, algorithm, limit);
          if (mlRecommendations && mlRecommendations.length > 0) {
            return mlRecommendations;
          }
        } catch (mlError) {
          console.warn('ML recommendations failed, falling back to rule-based:', mlError.message);
        }
      }

      // Fallback to rule-based recommendations
      const auPairs = await this.getAvailableAuPairs();
      
      switch (algorithm) {
        case 'content':
          recommendations = await this.getContentBasedRecommendations(parent, auPairs, limit);
          break;
        case 'collaborative':
          recommendations = await this.getCollaborativeRecommendations(parentId, auPairs, limit);
          break;
        case 'hybrid':
        default:
          recommendations = await this.getHybridRecommendations(parent, parentId, auPairs, limit);
          break;
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  // Get ML-based recommendations using Python service
  async getMLRecommendations(parentId, parent, algorithm, limit) {
    return new Promise((resolve, reject) => {
      try {
        // Prepare parameters for ML service
        const params = {
          algorithm: algorithm,
          limit: limit,
          parent_id: parentId,
          parent_requirements: {
            skills: this.parseSkills(parent.skills_preference || parent.preferensi_keahlian || ''),
            location: parent.province || parent.provinsi || '',
            gender: parent.gender_preference || parent.preferensi_gender_aupair || ''
          }
        };

        const pythonProcess = spawn('python3', [this.pythonServicePath, 'recommend', JSON.stringify(params)]);

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
            return;
          }

          try {
            const result = JSON.parse(output);
            if (result.success) {
              // Transform ML recommendations to match our format
              const transformedRecs = result.recommendations.map(rec => ({
                id: rec.id,
                name: rec.name,
                usia: rec.age,
                jenis_kelamin: rec.gender,
                provinsi: rec.location,
                skills_combined: rec.skills,
                rating_avg: rec.rating,
                pengalaman_tahun: rec.experience,
                compatibility_score: rec.compatibility_score,
                match_explanation: rec.explanation,
                match_type: `ml-${result.algorithm}`
              }));
              resolve(transformedRecs);
            } else {
              reject(new Error(result.error || 'ML recommendation failed'));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse ML service response: ${parseError.message}`));
          }
        });

        // Set timeout for Python process
        setTimeout(() => {
          pythonProcess.kill();
          reject(new Error('ML recommendation service timeout'));
        }, 30000); // 30 second timeout

      } catch (error) {
        reject(error);
      }
    });
  }

  // Content-based filtering using parent preferences
  async getContentBasedRecommendations(parent, auPairs, limit) {
    const scores = [];
    
    // Parse parent requirements
    const requiredSkills = this.parseSkills(parent.preferensi_keahlian);
    const preferredGender = parent.preferensi_gender_aupair;
    const parentLocation = parent.provinsi;
    const budget = parent.budget_bulanan;

    for (const auPair of auPairs) {
      let score = 0;
      let explanation = [];

      // Skill matching
      const skillScore = this.calculateSkillMatch(requiredSkills, auPair);
      score += skillScore * 0.4;
      if (skillScore > 0.5) {
        explanation.push(`Strong skill match (${(skillScore * 100).toFixed(0)}%)`);
      }

      // Location preference
      const locationScore = this.calculateLocationMatch(parentLocation, auPair.provinsi);
      score += locationScore * this.locationWeight;
      if (locationScore > 0.8) {
        explanation.push('Same province');
      } else if (locationScore > 0.5) {
        explanation.push('Nearby location');
      }

      // Gender preference
      const genderScore = this.calculateGenderMatch(preferredGender, auPair.jenis_kelamin);
      score += genderScore * this.genderWeight;
      if (genderScore === 1 && preferredGender !== 'Tidak-Ada-Preferensi') {
        explanation.push('Matches gender preference');
      }

      // Rating bonus
      const ratingScore = (auPair.rating_avg || 4.0) / 5.0;
      score += ratingScore * this.ratingWeight;
      if (auPair.rating_avg >= 4.5) {
        explanation.push('Highly rated');
      }

      // Age appropriateness (prefer 18-25 range)
      const ageScore = this.calculateAgeScore(auPair.usia);
      score += ageScore * this.ageWeight;

      // Experience bonus
      const experienceScore = Math.min(auPair.pengalaman_tahun / 3, 1);
      score += experienceScore * this.experienceWeight;
      if (auPair.pengalaman_tahun >= 2) {
        explanation.push('Experienced');
      }

      scores.push({
        auPair,
        score,
        explanation: explanation.join(', '),
        matchType: 'content-based'
      });
    }

    // Sort by score and return top recommendations
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, limit).map(item => ({
      ...item.auPair,
      compatibility_score: (item.score * 100).toFixed(1),
      match_explanation: item.explanation,
      match_type: item.matchType
    }));
  }

  // Collaborative filtering based on ratings from similar parents
  async getCollaborativeRecommendations(parentId, auPairs, limit) {
    try {
      // Get ratings from similar parents
      const similarParents = await this.findSimilarParents(parentId);
      const auPairScores = new Map();

      // Calculate weighted scores based on similar parents' ratings
      for (const similarParent of similarParents) {
        const ratings = await this.getParentRatings(similarParent.id);
        
        for (const rating of ratings) {
          const currentScore = auPairScores.get(rating.aupair_id) || 0;
          const weightedScore = rating.rating * similarParent.similarity;
          auPairScores.set(rating.aupair_id, currentScore + weightedScore);
        }
      }

      // Filter to only available au pairs and add scores
      const recommendations = auPairs
        .filter(auPair => auPairScores.has(auPair.id))
        .map(auPair => ({
          ...auPair,
          compatibility_score: ((auPairScores.get(auPair.id) / similarParents.length) * 20).toFixed(1),
          match_explanation: 'Recommended by parents with similar preferences',
          match_type: 'collaborative'
        }))
        .sort((a, b) => parseFloat(b.compatibility_score) - parseFloat(a.compatibility_score))
        .slice(0, limit);

      return recommendations;
    } catch (error) {
      console.error('Error in collaborative filtering:', error);
      return [];
    }
  }

  // Hybrid approach combining content-based and collaborative filtering
  async getHybridRecommendations(parent, parentId, auPairs, limit) {
    try {
      // Get both types of recommendations
      const contentRecs = await this.getContentBasedRecommendations(parent, auPairs, limit * 2);
      const collabRecs = await this.getCollaborativeRecommendations(parentId, auPairs, limit * 2);

      // Create a map to combine scores
      const combinedScores = new Map();

      // Add content-based scores (weight: 0.6)
      contentRecs.forEach(rec => {
        const score = parseFloat(rec.compatibility_score) * 0.6;
        combinedScores.set(rec.id, {
          auPair: rec,
          score: score,
          explanation: [rec.match_explanation]
        });
      });

      // Add collaborative scores (weight: 0.4)
      collabRecs.forEach(rec => {
        const collabScore = parseFloat(rec.compatibility_score) * 0.4;
        const existing = combinedScores.get(rec.id);
        
        if (existing) {
          existing.score += collabScore;
          existing.explanation.push('Similar parents also liked this au pair');
        } else {
          combinedScores.set(rec.id, {
            auPair: rec,
            score: collabScore,
            explanation: [rec.match_explanation]
          });
        }
      });

      // Convert to array and sort
      const hybridResults = Array.from(combinedScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => ({
          ...item.auPair,
          compatibility_score: item.score.toFixed(1),
          match_explanation: item.explanation.join('; '),
          match_type: 'hybrid'
        }));

      return hybridResults;
    } catch (error) {
      console.error('Error in hybrid recommendations:', error);
      // Fallback to content-based
      return this.getContentBasedRecommendations(parent, auPairs, limit);
    }
  }

  // Helper methods
  parseSkills(skillString) {
    if (!skillString) return [];
    return skillString.split(/[\s,]+/).filter(skill => skill.length > 0);
  }

  calculateSkillMatch(requiredSkills, auPair) {
    if (!requiredSkills.length) return 0.5;

    const auPairSkills = [];
    const skillMap = {
      'Memasak': 'memasak',
      'First-Aid': 'first_aid', 
      'Mengemudi': 'mengemudi',
      'Berenang': 'berenang',
      'Komputer': 'komputer',
      'Musik': 'musik',
      'Olahraga': 'olahraga'
    };

    // Convert au pair skills to array
    Object.keys(skillMap).forEach(skill => {
      if (auPair[skillMap[skill]] === 1 || auPair[skillMap[skill]] === '1') {
        auPairSkills.push(skill);
      }
    });

    const matchingSkills = requiredSkills.filter(skill => 
      auPairSkills.some(auPairSkill => 
        auPairSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(auPairSkill.toLowerCase())
      )
    );

    return matchingSkills.length / requiredSkills.length;
  }

  calculateLocationMatch(parentLocation, auPairLocation) {
    if (!parentLocation || !auPairLocation) return 0.3;
    
    if (parentLocation.toLowerCase() === auPairLocation.toLowerCase()) {
      return 1.0;
    }
    
    // Check for major cities that are close
    const majorCities = {
      'DKI Jakarta': ['Jawa Barat', 'Banten'],
      'Jawa Barat': ['DKI Jakarta', 'Jawa Tengah'],
      'Jawa Tengah': ['Jawa Barat', 'Jawa Timur', 'DI Yogyakarta'],
      'DI Yogyakarta': ['Jawa Tengah'],
      'Jawa Timur': ['Jawa Tengah']
    };

    if (majorCities[parentLocation]?.includes(auPairLocation)) {
      return 0.7;
    }

    return 0.3;
  }

  calculateGenderMatch(preferredGender, auPairGender) {
    if (!preferredGender || preferredGender === 'Tidak-Ada-Preferensi') {
      return 1.0;
    }
    return preferredGender === auPairGender ? 1.0 : 0.3;
  }

  calculateAgeScore(age) {
    if (age >= 18 && age <= 25) return 1.0;
    if (age >= 16 && age <= 30) return 0.8;
    return 0.5;
  }

  // Database helper methods
  async getParentById(parentId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE id = ? AND role = "parent"',
        [parentId],
        (err, parent) => {
          if (err) reject(err);
          else resolve(parent);
        }
      );
    });
  }

  async getAvailableAuPairs() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT p.*, u.name, u.email, u.age as usia, u.gender as jenis_kelamin, u.province as provinsi, u.city as kota,
                u.skills_memasak as memasak, u.skills_first_aid as first_aid, u.skills_mengemudi as mengemudi,
                u.skills_berenang as berenang, u.skills_komputer as komputer, u.skills_musik as musik, u.skills_olahraga as olahraga,
                u.experience_years as pengalaman_tahun, u.average_rating as rating_avg
         FROM pairners p 
         JOIN users u ON p.user_id = u.id 
         WHERE p.availability_status = 'available' AND u.is_active = 1`,
        [],
        (err, auPairs) => {
          if (err) reject(err);
          else resolve(auPairs || []);
        }
      );
    });
  }

  async findSimilarParents(parentId) {
    return new Promise((resolve, reject) => {
      // Find parents with similar preferences (simplified)
      this.db.all(
        `SELECT u.id, u.location_preference, u.gender_preference, u.skills_preference
         FROM users u 
         WHERE u.role = 'parent' AND u.id != ? AND u.id IN (
           SELECT DISTINCT parent_id FROM ratings WHERE rating >= 4
         )`,
        [parentId],
        (err, parents) => {
          if (err) reject(err);
          else {
            // Add similarity scores (simplified - in real implementation, use more sophisticated similarity)
            const parentsWithSimilarity = parents.map(parent => ({
              ...parent,
              similarity: Math.random() * 0.3 + 0.7 // Simplified similarity score
            }));
            resolve(parentsWithSimilarity);
          }
        }
      );
    });
  }

  async getParentRatings(parentId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT aupair_id, rating FROM ratings WHERE parent_id = ? AND rating >= 4',
        [parentId],
        (err, ratings) => {
          if (err) reject(err);
          else resolve(ratings || []);
        }
      );
    });
  }

  // Method to train/update the model based on new ratings
  async updateModel(parentId, auPairId, rating) {
    try {
      // Store the rating
      await this.storeRating(parentId, auPairId, rating);
      
      // Update au pair's average rating
      await this.updateAuPairRating(auPairId);
      
      return { success: true, message: 'Model updated with new rating' };
    } catch (error) {
      console.error('Error updating model:', error);
      throw error;
    }
  }

  async storeRating(parentId, auPairId, rating) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO ratings (parent_id, aupair_id, rating, created_at) VALUES (?, ?, ?, ?)',
        [parentId, auPairId, rating, new Date().toISOString()],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async updateAuPairRating(auPairId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings FROM ratings WHERE aupair_id = ?',
        [auPairId],
        (err, result) => {
          if (err) {
            reject(err);
            return;
          }

          this.db.run(
            'UPDATE users SET average_rating = ?, total_ratings = ? WHERE id = ?',
            [result.avg_rating, result.total_ratings, auPairId],
            (updateErr) => {
              if (updateErr) reject(updateErr);
              else resolve(result);
            }
          );
        }
      );
    });
  }

  // Get recommendations for similar au pairs (for au pair profile pages)
  async getSimilarAuPairs(auPairId, limit = 5) {
    try {
      const auPair = await this.getAuPairById(auPairId);
      if (!auPair) {
        throw new Error('Au pair not found');
      }

      const allAuPairs = await this.getAvailableAuPairs();
      const otherAuPairs = allAuPairs.filter(ap => ap.id !== auPairId);

      const similarities = otherAuPairs.map(other => {
        let score = 0;

        // Skill similarity
        const skillSimilarity = this.calculateSkillSimilarity(auPair, other);
        score += skillSimilarity * 0.4;

        // Location similarity
        const locationSimilarity = this.calculateLocationMatch(auPair.provinsi, other.provinsi);
        score += locationSimilarity * 0.3;

        // Age similarity
        const ageDiff = Math.abs(auPair.usia - other.usia);
        const ageSimilarity = Math.max(0, 1 - (ageDiff / 10));
        score += ageSimilarity * 0.2;

        // Rating similarity
        const ratingDiff = Math.abs((auPair.rating_avg || 4.0) - (other.rating_avg || 4.0));
        const ratingSimilarity = Math.max(0, 1 - (ratingDiff / 2));
        score += ratingSimilarity * 0.1;

        return {
          ...other,
          similarity_score: (score * 100).toFixed(1)
        };
      });

      return similarities
        .sort((a, b) => parseFloat(b.similarity_score) - parseFloat(a.similarity_score))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting similar au pairs:', error);
      throw error;
    }
  }

  calculateSkillSimilarity(auPair1, auPair2) {
    const skills = ['memasak', 'first_aid', 'mengemudi', 'berenang', 'komputer', 'musik', 'olahraga'];
    let matches = 0;
    let total = 0;

    skills.forEach(skill => {
      const skill1 = auPair1[skill] === 1 || auPair1[skill] === '1';
      const skill2 = auPair2[skill] === 1 || auPair2[skill] === '1';
      
      if (skill1 || skill2) {
        total++;
        if (skill1 === skill2) {
          matches++;
        }
      }
    });

    return total > 0 ? matches / total : 0.5;
  }

  async getAuPairById(auPairId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT p.*, u.name, u.email, u.age as usia, u.gender as jenis_kelamin, u.province as provinsi, u.city as kota,
                u.skills_memasak as memasak, u.skills_first_aid as first_aid, u.skills_mengemudi as mengemudi,
                u.skills_berenang as berenang, u.skills_komputer as komputer, u.skills_musik as musik, u.skills_olahraga as olahraga,
                u.experience_years as pengalaman_tahun, u.average_rating as rating_avg
         FROM pairners p 
         JOIN users u ON p.user_id = u.id 
         WHERE p.id = ?`,
        [auPairId],
        (err, auPair) => {
          if (err) reject(err);
          else resolve(auPair);
        }
      );
    });
  }

  // Analytics methods
  async getRecommendationStats() {
    try {
      const stats = await Promise.all([
        this.getTotalRecommendations(),
        this.getSuccessfulMatches(),
        this.getAverageCompatibilityScore(),
        this.getTopSkillsRequested()
      ]);

      return {
        total_recommendations: stats[0],
        successful_matches: stats[1],
        average_compatibility: stats[2],
        top_skills: stats[3],
        success_rate: stats[1] > 0 ? ((stats[1] / stats[0]) * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error getting recommendation stats:', error);
      throw error;
    }
  }

  async getTotalRecommendations() {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT COUNT(*) as count FROM recommendation_logs',
        [],
        (err, result) => {
          if (err) reject(err);
          else resolve(result?.count || 0);
        }
      );
    });
  }

  async getSuccessfulMatches() {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT COUNT(*) as count FROM ratings WHERE rating >= 4',
        [],
        (err, result) => {
          if (err) reject(err);
          else resolve(result?.count || 0);
        }
      );
    });
  }

  async getAverageCompatibilityScore() {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT AVG(compatibility_score) as avg_score FROM recommendation_logs WHERE compatibility_score IS NOT NULL',
        [],
        (err, result) => {
          if (err) reject(err);
          else resolve(result?.avg_score || 0);
        }
      );
    });
  }

  async getTopSkillsRequested() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT skill, COUNT(*) as count 
         FROM (
           SELECT 'memasak' as skill FROM users WHERE role = 'parent' AND skills_preference LIKE '%Memasak%'
           UNION ALL
           SELECT 'first_aid' as skill FROM users WHERE role = 'parent' AND skills_preference LIKE '%First-Aid%'
           UNION ALL
           SELECT 'mengemudi' as skill FROM users WHERE role = 'parent' AND skills_preference LIKE '%Mengemudi%'
           UNION ALL
           SELECT 'berenang' as skill FROM users WHERE role = 'parent' AND skills_preference LIKE '%Berenang%'
           UNION ALL
           SELECT 'komputer' as skill FROM users WHERE role = 'parent' AND skills_preference LIKE '%Komputer%'
           UNION ALL
           SELECT 'musik' as skill FROM users WHERE role = 'parent' AND skills_preference LIKE '%Musik%'
           UNION ALL
           SELECT 'olahraga' as skill FROM users WHERE role = 'parent' AND skills_preference LIKE '%Olahraga%'
         ) skills_table
         GROUP BY skill
         ORDER BY count DESC
         LIMIT 5`,
        [],
        (err, results) => {
          if (err) reject(err);
          else resolve(results || []);
        }
      );
    });
  }
}

module.exports = RecommendationEngine;