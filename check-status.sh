#!/bin/bash

echo "🚀 AuPairly Application Status Check"
echo "=================================="

# Wait a moment for servers to start
sleep 5

# Check backend server
echo "📡 Checking Backend Server (Port 5000)..."
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Backend server is running and responding"
    curl -s http://localhost:5000/api/health
else
    echo "❌ Backend server is not responding"
fi

echo ""

# Check frontend server
echo "🌐 Checking Frontend Server (Port 3000)..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend server is running"
else
    echo "❌ Frontend server is not responding"
fi

echo ""
echo "🎉 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "📱 Open http://localhost:3000 in your browser to use AuPairly!"