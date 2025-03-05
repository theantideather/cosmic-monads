#!/bin/bash

# Cosmic Monads Local Development Script

echo "=== Starting Cosmic Monads Local Development ==="

# Kill any existing serve processes
echo "Stopping any existing servers..."
pkill -f "node server.js" || true
pkill -f "npx serve" || true
sleep 2

# Start the backend server
echo "Starting backend server..."
node server.js &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"
sleep 2

# Check if backend is running
if ! curl -s http://localhost:3001/api/status > /dev/null; then
  echo "Error: Backend server failed to start"
  exit 1
fi

echo "Backend API running at http://localhost:3001/api"

# Start the frontend server
echo "Starting frontend server..."
npx serve &
FRONTEND_PID=$!
echo "Frontend server started with PID: $FRONTEND_PID"
sleep 2

echo ""
echo "Cosmic Monads is now running!"
echo "- Backend: http://localhost:3001"
echo "- Frontend: Check the serve output for the correct port (likely http://localhost:3000)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Keep the script running
wait 