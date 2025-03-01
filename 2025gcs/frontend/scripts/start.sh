#!/bin/bash

kill_port() {
  PORT=$1
  PID=$(lsof -t -i:$PORT)
  if [ -n "$PID" ]; then
    echo "Killing process on port $PORT (PID: $PID)"
    kill -9 $PID || { echo "Failed to kill process on port $PORT"; exit 1; }
  fi
}

# Check and kill processes on ports 80 and 3000
kill_port 80
kill_port 3000

# Function to run when Ctrl+C is detected
on_ctrl_c() {
  echo "Caught interrupt signal (Ctrl+C)"
  # Add your command logic here
  echo "Running the command..."
  # Example: kill the backend server process
  kill_port 80
  kill_port 3000
  exit 0
}

# Set up trap for SIGINT
trap on_ctrl_c SIGINT

# Navigate to the backend directory
cd "$(dirname "$0")/../../backend"

# Echo the path after navigating to the backend directory
echo "Path after navigating to backend: $(pwd)"

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

# Navigate back to the frontend directory
cd ../frontend

# Start the frontend (frontend should be aware of the venv environment)
echo "Starting frontend..."
npm start

# Keep the script running to ensure the backend remains active (if needed)
wait
