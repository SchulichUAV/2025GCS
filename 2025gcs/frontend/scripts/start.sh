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

# Check if the virtual environment exists
if [ ! -d "suav_venv_gcs" ]; then
  echo "Virtual environment not found. Creating virtual environment..."
  python3.11 -m venv suav_venv_gcs || { echo "Failed to create virtual environment."; exit 1; }
fi

# Activate the virtual environment
source suav_venv_gcs/bin/activate || { echo "Failed to activate the virtual environment."; exit 1; }

# Function to check if Python dependencies need updating
check_python_deps() {
  if [ ! -f "requirements.txt" ]; then
    echo "No requirements.txt found, skipping dependency installation."
    return
  fi

  # Compare installed packages with requirements.txt
  if ! pip freeze | grep -Fxqf requirements.txt; then
    echo "Updating Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt || { echo "Failed to install the requirements."; exit 1; }
  else
    echo "Python dependencies are already installed."
  fi
}

check_python_deps

# Start the backend server in the background
echo "Starting backend server..."
python server.py &

cd ../frontend

# Install node dependencies only if package-lock.json has changed
if [ -d "node_modules" ] && cmp -s package-lock.json .installed-lock; then
  echo "Node.js dependencies are already installed."
  npm run postinstall
else
  echo "Installing Node.js dependencies..."
  npm ci
  cp package-lock.json .installed-lock  # Cache current state of dependencies
fi

echo "Starting frontend..."
npm start

wait