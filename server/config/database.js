const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database configuration
const DB_CONFIG = {
  development: {
    filename: './aupairly_dev.db',
    verbose: true
  },
  production: {
    filename: './aupairly_prod.db',
    verbose: false
  },
  test: {
    filename: ':memory:', // In-memory database for testing
    verbose: false
  }
};

class Database {
  constructor(environment = 'development') {
    this.env = environment;
    this.config = DB_CONFIG[environment];
    this.db = null;
  }

  // Initialize database connection
  connect() {
    return new Promise((resolve, reject) => {
      const dbMode = this.config.verbose ? sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE : sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;
      
      this.db = new sqlite3.Database(this.config.filename, dbMode, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log(`Connected to SQLite database: ${this.config.filename}`);
          
          // Enable foreign keys
          this.db.run('PRAGMA foreign_keys = ON');
          
          // Set WAL mode for better performance
          if (this.env === 'production') {
            this.db.run('PRAGMA journal_mode = WAL');
          }
          
          resolve(this.db);
        }
      });

      // Enable verbose mode for development
      if (this.config.verbose) {
        this.db.on('trace', (sql) => {
          console.log('SQL:', sql);
        });
      }
    });
  }

  // Initialize database tables
  async initializeTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Users table (single parents)
        this.db.run(`CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          child_age INTEGER,
          preferred_gender TEXT CHECK(preferred_gender IN ('male', 'female', 'any')),
          preferred_age_range TEXT,
          address TEXT,
          is_verified BOOLEAN DEFAULT 0,
          verification_token TEXT,
          password_reset_token TEXT,
          password_reset_expires DATETIME,
          last_login DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) {
            console.error('Error creating users table:', err.message);
            reject(err);
          }
        });

        // Pairners table (orphanage children)
        this.db.run(`CREATE TABLE IF NOT EXISTS pairners (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          age INTEGER NOT NULL CHECK(age >= 16 AND age <= 25),
          gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
          orphanage_id INTEGER,
          skills TEXT,
          bio TEXT,
          intro_video_url TEXT,
          profile_image_url TEXT,
          is_available BOOLEAN DEFAULT 1,
          rating REAL DEFAULT 0,
          total_ratings INTEGER DEFAULT 0,
          languages TEXT, -- JSON array of languages
          education_level TEXT,
          experience_years INTEGER DEFAULT 0,
          certifications TEXT, -- JSON array of certifications
          background_check_status TEXT DEFAULT 'pending',
          training_completed BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) {
            console.error('Error creating pairners table:', err.message);
            reject(err);
          }
        });

        // Chats table
        this.db.run(`CREATE TABLE IF NOT EXISTS chats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          pairner_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          sender_type TEXT NOT NULL CHECK(sender_type IN ('user', 'pairner')),
          message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'image', 'file')),
          file_url TEXT,
          is_read BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (pairner_id) REFERENCES pairners (id) ON DELETE CASCADE
        )`, (err) => {
          if (err) {
            console.error('Error creating chats table:', err.message);
            reject(err);
          }
        });

        // Meetings table
        this.db.run(`CREATE TABLE IF NOT EXISTS meetings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          pairner_id INTEGER NOT NULL,
          scheduled_date TEXT NOT NULL,
          scheduled_time TEXT NOT NULL,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed', 'rescheduled')),
          location TEXT,
          notes TEXT,
          meeting_type TEXT DEFAULT 'in_person' CHECK(meeting_type IN ('in_person', 'video_call', 'phone_call')),
          rating INTEGER CHECK(rating >= 1 AND rating <= 5),
          feedback TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (pairner_id) REFERENCES pairners (id) ON DELETE CASCADE
        )`, (err) => {
          if (err) {
            console.error('Error creating meetings table:', err.message);
            reject(err);
          }
        });

        // Orphanages table
        this.db.run(`CREATE TABLE IF NOT EXISTS orphanages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          contact_person TEXT,
          license_number TEXT,
          is_verified BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) {
            console.error('Error creating orphanages table:', err.message);
            reject(err);
          }
        });

        // Ratings table (for detailed rating system)
        this.db.run(`CREATE TABLE IF NOT EXISTS ratings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          pairner_id INTEGER NOT NULL,
          meeting_id INTEGER,
          rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
          review TEXT,
          communication_rating INTEGER CHECK(communication_rating >= 1 AND communication_rating <= 5),
          reliability_rating INTEGER CHECK(reliability_rating >= 1 AND reliability_rating <= 5),
          childcare_skills_rating INTEGER CHECK(childcare_skills_rating >= 1 AND childcare_skills_rating <= 5),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (pairner_id) REFERENCES pairners (id) ON DELETE CASCADE,
          FOREIGN KEY (meeting_id) REFERENCES meetings (id) ON DELETE SET NULL,
          UNIQUE(user_id, pairner_id, meeting_id)
        )`, (err) => {
          if (err) {
            console.error('Error creating ratings table:', err.message);
            reject(err);
          }
        });

        // Create indexes for better performance
        this.db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_chats_user_pairner ON chats(user_id, pairner_id)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_meetings_pairner_id ON meetings(pairner_id)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(scheduled_date)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_pairners_available ON pairners(is_available)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_pairners_rating ON pairners(rating)');

        // Create triggers for updated_at
        this.db.run(`CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
          AFTER UPDATE ON users
          BEGIN
            UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
          END`);

        this.db.run(`CREATE TRIGGER IF NOT EXISTS update_pairners_timestamp 
          AFTER UPDATE ON pairners
          BEGIN
            UPDATE pairners SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
          END`);

        this.db.run(`CREATE TRIGGER IF NOT EXISTS update_meetings_timestamp 
          AFTER UPDATE ON meetings
          BEGIN
            UPDATE meetings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
          END`);

        console.log('Database tables initialized successfully');
        resolve();
      });
    });
  }

  // Seed initial data
  async seedData() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Insert sample orphanages
        this.db.run(`INSERT OR IGNORE INTO orphanages (id, name, address, phone, email, contact_person, is_verified) VALUES 
          (1, 'Panti Asuhan Kasih Ibu', 'Jl. Raya No. 123, Jakarta', '021-1234567', 'kasihibu@email.com', 'Ibu Sari', 1),
          (2, 'Panti Asuhan Harapan Bangsa', 'Jl. Merdeka No. 456, Bandung', '022-7654321', 'harapanbangsa@email.com', 'Bapak Budi', 1),
          (3, 'Panti Asuhan Cahaya Kasih', 'Jl. Pemuda No. 789, Surabaya', '031-9876543', 'cahayakasih@email.com', 'Ibu Dewi', 1)`);

        // Insert sample pairners
        this.db.run(`INSERT OR IGNORE INTO pairners (id, name, age, gender, orphanage_id, skills, bio, intro_video_url, languages, education_level, experience_years, training_completed) VALUES 
          (1, 'Sari Indah', 19, 'female', 1, 'Memasak, Mengaji, Bahasa Inggris, Bermain Piano', 'Saya suka anak-anak dan berpengalaman merawat adik-adik di panti. Saya sabar dan telah mengikuti pelatihan pengasuhan anak.', 'https://example.com/video1', '["Bahasa Indonesia", "English"]', 'SMA', 2, 1),
          (2, 'Budi Santoso', 20, 'male', 1, 'Olahraga, Komputer, Matematika, Fotografi', 'Saya sabar dan suka mengajar anak-anak. Berpengalaman dalam tutoring dan aktivitas outdoor.', 'https://example.com/video2', '["Bahasa Indonesia", "English"]', 'SMK', 1, 1),
          (3, 'Nia Permata', 18, 'female', 2, 'Menari, Menggambar, Musik, Storytelling', 'Saya kreatif dan energik dalam mengasuh anak. Suka mengembangkan kreativitas anak melalui seni.', 'https://example.com/video3', '["Bahasa Indonesia"]', 'SMA', 1, 1),
          (4, 'Dian Pratiwi', 21, 'female', 2, 'Bahasa Inggris, Matematika, Memasak', 'Lulusan D3 dengan pengalaman mengajar. Fokus pada pendidikan dan nutrisi anak.', 'https://example.com/video4', '["Bahasa Indonesia", "English", "Mandarin"]', 'D3', 3, 1),
          (5, 'Andi Wijaya', 22, 'male', 3, 'Coding, Robotika, Olahraga', 'Passion di bidang teknologi dan ingin mengajarkan skill digital pada anak-anak zaman sekarang.', 'https://example.com/video5', '["Bahasa Indonesia", "English"]', 'D3', 2, 1)`);

        console.log('Sample data seeded successfully');
        resolve();
      });
    });
  }

  // Get database instance
  getDB() {
    return this.db;
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  // Backup database
  async backup(backupPath) {
    if (this.config.filename === ':memory:') {
      throw new Error('Cannot backup in-memory database');
    }

    const sourcePath = this.config.filename;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const finalBackupPath = backupPath || `./backups/aupairly_backup_${timestamp}.db`;

    // Create backup directory if it doesn't exist
    const backupDir = path.dirname(finalBackupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      fs.copyFile(sourcePath, finalBackupPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Database backed up to: ${finalBackupPath}`);
          resolve(finalBackupPath);
        }
      });
    });
  }

  // Database health check
  async healthCheck() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT 1', (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: this.config.filename
          });
        }
      });
    });
  }

  // Get database statistics
  async getStats() {
    return new Promise((resolve, reject) => {
      const stats = {};
      
      this.db.serialize(() => {
        this.db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
          if (err) return reject(err);
          stats.users = row.count;
        });

        this.db.get('SELECT COUNT(*) as count FROM pairners', (err, row) => {
          if (err) return reject(err);
          stats.pairners = row.count;
        });

        this.db.get('SELECT COUNT(*) as count FROM chats', (err, row) => {
          if (err) return reject(err);
          stats.messages = row.count;
        });

        this.db.get('SELECT COUNT(*) as count FROM meetings', (err, row) => {
          if (err) return reject(err);
          stats.meetings = row.count;
          resolve(stats);
        });
      });
    });
  }
}

// Factory function to create database instance
const createDatabase = (environment = process.env.NODE_ENV || 'development') => {
  return new Database(environment);
};

module.exports = {
  Database,
  createDatabase,
  DB_CONFIG
};
