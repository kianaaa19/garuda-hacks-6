#!/bin/bash

echo "🚀 Starting AuPairly Application..."

# Kill any existing processes on these ports
echo "📋 Cleaning up existing processes..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true

# Wait a moment
sleep 2

# Start the backend server
echo "🔧 Starting backend server..."
cd server
node server.js &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start the frontend
echo "🎨 Starting frontend development server..."
cd client
npm start &
FRONTEND_PID=$!
cd ..

echo "✅ Application started!"
echo "🔗 Backend API: http://localhost:5000"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "📋 Process IDs:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "⏹️  To stop the application, run:"
echo "   kill $BACKEND_PID $FRONTEND_PID"

# Keep the script running
wait