# AuPairly - Connecting Single Parents with Trained Au Pairs

A modern web platform that connects single parents with trained and verified au pairs from affiliated orphanages, providing trusted childcare solutions while creating opportunities for young adults.

## 🌟 Features

- **Modern UI/UX**: Beautiful, responsive design with smooth animations
- **Authentication System**: Secure login and registration for single parents
- **Au Pair Profiles**: Detailed profiles with skills, bio, and intro videos
- **Smart Matching**: Recommendation system based on preferences
- **Real-time Chat**: Communication between parents and au pairs
- **Meeting Scheduler**: Easy interview scheduling system
- **Mobile-Friendly**: Responsive design that works on all devices
- **Progressive Web App**: Can be installed on mobile devices

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **Modern CSS** - Custom CSS with CSS Grid and Flexbox
- **Progressive Web App** - PWA features for mobile installation
- **Responsive Design** - Mobile-first approach

### Backend
- **Node.js** with **Express** - RESTful API server
- **SQLite** - Lightweight database for development
- **JWT Authentication** - Secure token-based authentication
- **bcryptjs** - Password hashing
- **CORS** enabled for cross-origin requests

## 🚀 Getting Started

### Prerequisites
- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aupairly
   ```

2. **Install dependencies**
   ```bash
   # Install all dependencies (both client and server)
   npm run install-all
   
   # Or install separately:
   npm run install-server
   npm run install-client
   ```

3. **Environment Setup**
   Create a `.env` file in the `server` directory:
   ```env
   JWT_SECRET=your-super-secret-jwt-key-here
   PORT=5000
   NODE_ENV=development
   ```

### Running the Application

#### Development Mode (Recommended)
```bash
# Run both client and server concurrently
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`

#### Production Mode
```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

### Individual Commands

```bash
# Server only (Backend API)
npm run server

# Client only (Frontend)
npm run client

# Build frontend for production
npm run build
```

## 📱 Application Structure

```
aupairly/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # React context providers
│   │   ├── services/      # API services
│   │   ├── styles/        # CSS styles
│   │   └── App.js         # Main app component
│   └── package.json
├── server/                # Node.js backend
│   ├── config/           # Database configuration
│   ├── middleware/       # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── server.js        # Main server file
└── package.json
```

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:

### Registration
- Single parents can register with email, password, and preferences
- Requires child's age and preferences for au pair matching
- Verification documents required during contract signing

### Login
- Email and password authentication
- JWT token stored in localStorage
- Automatic token refresh

## 📊 Database Schema

### Users (Single Parents)
- Personal information (name, email, phone)
- Child information (age)
- Preferences (gender, age range)
- Address

### Pairners (Au Pairs)
- Personal details (name, age, gender)
- Orphanage affiliation
- Skills and bio
- Availability status
- Rating system

### Chats
- Real-time messaging between users and au pairs
- Message history and timestamps

### Meetings
- Interview scheduling
- Status tracking
- Notes and feedback

## 🎨 Design System

### Colors
- **Primary Blue**: `#2563eb` - Main brand color
- **Accent Orange**: `#f97316` - Secondary accent
- **Success Green**: `#10b981` - Success states
- **Neutral Grays**: Various shades for text and backgrounds

### Typography
- **Font**: Inter (Google Fonts)
- **Responsive**: Fluid typography that scales with screen size

### Components
- Modern card-based design
- Smooth hover animations
- Accessibility-first approach
- Mobile-responsive layouts

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Au Pairs
- `GET /api/pairners` - Get all au pairs
- `GET /api/pairners/recommended` - Get recommended matches
- `GET /api/pairners/:id` - Get specific au pair

### Chat
- `GET /api/chat/:pairnerId` - Get chat history
- `POST /api/chat/:pairnerId` - Send message
- `GET /api/chat/stats` - Get chat statistics

### Meetings
- `GET /api/users/meetings` - Get user's meetings
- `POST /api/users/meetings` - Schedule new meeting

## 🚀 Deployment

### Frontend Deployment
The React app can be deployed to any static hosting service:
- **Vercel** (Recommended)
- **Netlify**
- **GitHub Pages**
- **AWS S3 + CloudFront**

### Backend Deployment
The Node.js server can be deployed to:
- **Heroku** (Easy deployment)
- **DigitalOcean App Platform**
- **AWS Elastic Beanstalk**
- **Railway**

### Environment Variables
Make sure to set these in production:
```env
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
PORT=5000
```

## 🔧 Development

### Code Structure
- **Component-based**: Modular React components
- **Responsive-first**: Mobile-first CSS approach
- **Modern JavaScript**: ES6+ features
- **Clean Architecture**: Separation of concerns

### Best Practices
- **Security**: JWT authentication, input validation
- **Performance**: Optimized bundle size, lazy loading
- **Accessibility**: ARIA labels, keyboard navigation
- **SEO**: Meta tags, semantic HTML

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Frontend**: Modern React with beautiful UI/UX
- **Backend**: Robust Node.js API with authentication
- **Database**: SQLite for development, easily upgradeable to PostgreSQL/MySQL
- **Security**: JWT authentication, password hashing, input validation

## 🌟 Key Features Highlight

### For Single Parents
- ✅ Easy registration and profile setup
- ✅ Smart au pair recommendations
- ✅ Secure messaging system
- ✅ Interview scheduling
- ✅ Background-checked au pairs

### For Au Pairs
- ✅ Profile creation with skills showcase
- ✅ Training certification tracking
- ✅ Communication with families
- ✅ Opportunity for personal growth

### For Platform
- ✅ Verification system
- ✅ Rating and review system
- ✅ Ongoing support and monitoring
- ✅ Document management for contracts

---

**AuPairly** - Connecting families with trusted childcare while providing opportunities for growth and independence. 💝
