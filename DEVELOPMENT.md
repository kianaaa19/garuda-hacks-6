# AuPairly Development Guide

## Quick Start

### Option 1: Using the startup script (Recommended)
```bash
# Make the script executable
chmod +x start-app.sh

# Run the application
./start-app.sh
```

### Option 2: Using npm scripts
```bash
# Install all dependencies
npm run install-all

# Start both servers concurrently
npm run dev
```

### Option 3: Manual startup
```bash
# Terminal 1 - Backend
cd server
npm install
node server.js

# Terminal 2 - Frontend  
cd client
npm install
npm start
```

## Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Testing the Application

### 1. Backend API Test
```bash
curl http://localhost:5000/api/health
# Expected response: {"status":"OK","message":"Aupairly API is running"}
```

### 2. Frontend Test
Open your browser and navigate to `http://localhost:3000`

## Default Test Account

For testing purposes, you can register a new account or use these sample credentials:

**Single Parent Registration:**
- Email: test@example.com
- Password: password123
- Name: Test Parent
- Phone: +1234567890
- Child Age: 6
- Preferred Gender: Any
- Preferred Age Range: 18-25
- Address: 123 Test Street, Test City

## Available Au Pairs (Sample Data)

The database is pre-populated with sample au pairs:
1. **Sari** - 19 years old, female, skills in cooking, teaching Quran, English
2. **Budi** - 20 years old, male, skills in sports, computer, mathematics  
3. **Nia** - 18 years old, female, skills in dancing, drawing, music

## Features to Test

### ✅ Authentication
- [x] User registration with preferences
- [x] User login
- [x] JWT token management
- [x] Auto-logout on token expiration

### ✅ Home Dashboard
- [x] Welcome section with animations
- [x] Quick statistics
- [x] Quick action buttons
- [x] Recommended au pairs
- [x] Recently added au pairs
- [x] Features showcase
- [x] Process explanation
- [x] Call-to-action section

### ✅ Au Pair Profiles
- [x] Enhanced au pair cards
- [x] Detailed profile view with tabs
- [x] Skills and experience display
- [x] Background verification info
- [x] Action buttons (message, schedule)

### ✅ Chat System
- [x] Conversation list
- [x] Real-time-like messaging
- [x] Message timestamps
- [x] Auto-responses (simulated)
- [x] Quick actions panel

### ✅ Meeting Scheduler
- [x] Upcoming meetings view
- [x] Past meetings history
- [x] Schedule new meetings
- [x] Meeting management
- [x] Interview tips

### ✅ Responsive Design
- [x] Mobile-friendly layout
- [x] Tablet optimization
- [x] Desktop experience
- [x] Touch-friendly controls

## Troubleshooting

### Port Already in Use
```bash
# Kill processes using ports 3000 and 5000
npx kill-port 3000
npx kill-port 5000
```

### Database Issues
```bash
# If database issues occur, delete and restart
rm server/aupairly.db
cd server && node server.js
```

### Node Modules Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json  
rm -rf server/node_modules server/package-lock.json
npm run install-all
```

### Browser Cache
- Clear browser cache and localStorage
- Try incognito/private browsing mode
- Hard refresh (Ctrl+F5 or Cmd+Shift+R)

## Development Notes

### Backend (Node.js + Express)
- Uses SQLite database (aupairly.db)
- JWT authentication
- RESTful API endpoints
- Sample data auto-populated

### Frontend (React)
- Modern React 18 with hooks
- Context API for state management
- Responsive CSS with animations
- Progressive Web App ready

### Database Schema
- `users` - Single parents
- `pairners` - Au pairs/orphanage children  
- `chats` - Message history
- `meetings` - Interview scheduling

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register single parent
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Au Pairs
- `GET /api/pairners` - Get all au pairs
- `GET /api/pairners/recommended` - Get recommendations
- `GET /api/pairners/:id` - Get specific au pair

### Chat
- `GET /api/chat/:pairnerId` - Get chat history
- `POST /api/chat/:pairnerId` - Send message

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/meetings` - Get meetings

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## Need Help?

- Check the main README.md for complete documentation
- Review the code comments for implementation details
- Test with the sample data provided
- Use browser developer tools for debugging

---

Happy coding! 🚀✨