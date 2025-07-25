const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./aupairly.db');

// Initialize database tables
db.serialize(() => {
  // Users table (single parents)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    child_age INTEGER,
    preferred_gender TEXT,
    preferred_age_range TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Pairners table (orphanage children)
  db.run(`CREATE TABLE IF NOT EXISTS pairners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    orphanage_id INTEGER,
    skills TEXT,
    bio TEXT,
    intro_video_url TEXT,
    is_available BOOLEAN DEFAULT 1,
    rating REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Chats table
  db.run(`CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    pairner_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    sender_type TEXT NOT NULL, -- 'user' or 'pairner'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (pairner_id) REFERENCES pairners (id)
  )`);

  // Meetings table
  db.run(`CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    pairner_id INTEGER NOT NULL,
    scheduled_date TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (pairner_id) REFERENCES pairners (id)
  )`);

  // Insert sample pairners for testing
  db.run(`INSERT OR IGNORE INTO pairners (id, name, age, gender, orphanage_id, skills, bio, intro_video_url) VALUES 
    (1, 'Sari', 19, 'female', 1, 'Memasak, Mengaji, Bahasa Inggris', 'Saya suka anak-anak dan berpengalaman merawat adik-adik di panti.', 'https://example.com/video1'),
    (2, 'Budi', 20, 'male', 1, 'Olahraga, Komputer, Matematika', 'Saya sabar dan suka mengajar anak-anak.', 'https://example.com/video2'),
    (3, 'Nia', 18, 'female', 2, 'Menari, Menggambar, Musik', 'Saya kreatif dan energik dalam mengasuh anak.', 'https://example.com/video3')`);
});

// Routes
const authRoutes = require('./routes/auth')(db, JWT_SECRET);
const userRoutes = require('./routes/users')(db, JWT_SECRET);
const pairnerRoutes = require('./routes/pairners')(db, JWT_SECRET);
const chatRoutes = require('./routes/chat')(db, JWT_SECRET);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pairners', pairnerRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Aupairly API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});