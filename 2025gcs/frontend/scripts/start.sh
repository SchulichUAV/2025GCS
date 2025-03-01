#!/bin/bash

kill_port() {
  PORT=$1
  PID=$(lsof -t -i:$PORT)
  if [ -n "$PID" ]; then
    echo "Killing process on port $PORT (PID: $PID)"
    kill -9 $PID || { echo "Failed to kill process on port $PORT"; exit 1; }
  fi
}
# Function to run when Ctrl+C is detected
on_ctrl_c() {
  echo "Caught interrupt signal (Ctrl+C)"
  # kill running ports from this project (backend and frontend)
  kill_port 80
  kill_port 3000
  exit 0
}
# Set up trap for SIGINT
trap on_ctrl_c SIGINT

cd "$(dirname "$0")/../../backend"

# Check if the virtual environment folder exists
if [ ! -d "venv" ]; then
  echo "Virtual environment not found. Creating virtual environment..."
  python3.11 -m venv venv || { echo "Failed to create virtual environment."; exit 1; }
fi

# Activate the virtual environment
source venv/bin/activate || { echo "Failed to activate the virtual environment."; exit 1; }

# Install the requirements
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt || { echo "Failed to install the requirements."; exit 1; }

# Start the backend server in the background
echo "Starting backend server..."
python server.py &

cd ../frontend
# Install node dependencies
npm ci

echo "Starting frontend..."
npm start

# Keep the script running to ensure the backend remains active
wait