#!/bin/bash

# Echo the initial path
npm ci

echo "Initial path: $(pwd)"

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

# Echo the path after activating the virtual environment
echo "Path after activating virtual environment: $(pwd)"

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