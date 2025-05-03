#!/bin/bash
set -e 

kill_port() {
  PORT=$1
  OS="$(uname -s)"

  case "$OS" in Linux*|Darwin*)
      PID=$(sudo lsof -t -i:$PORT)
      if [ -n "$PID" ]; then
        echo "Killing process on port $PORT (PID: $PID)"
        sudo kill -9 $PID || { echo "Failed to kill process on port $PORT"; exit 1; }
        echo "Process killed successfully"
      fi
      ;;
    CYGWIN*|MINGW*|MSYS*|Windows_NT)
      echo "Killing process on port $PORT (Windows)..."
      powershell -Command "& { Get-Process -Id (Get-NetTCPConnection -LocalPort $PORT).OwningProcess | Stop-Process -Force }" 2>/dev/null
      ;;
    *)
      echo "Unsupported OS: $OS"
      exit 1
      ;;
  esac
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

PYTHON_CMD=""

if command -v python3.11 >/dev/null 2>&1; then
    PYTHON_CMD="python3.11"
elif command -v python >/dev/null 2>&1 && python --version 2>&1 | grep -q "Python 3.11"; then
    PYTHON_CMD="python"
else
    echo "Error: Python 3.11 is required but not found."
    exit 1
fi

# Check if the virtual environment exists
if [ ! -d "suav_venv_gcs" ]; then
  echo "Virtual environment not found. Creating virtual environment..."
  $PYTHON_CMD -m venv suav_venv_gcs || { echo "Failed to create virtual environment."; exit 1; }
fi


# Detect OS and activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows (Git Bash / PowerShell)
    source suav_venv_gcs/Scripts/activate || { echo "Failed to activate the virtual environment."; exit 1; }
else
    # Linux/macOS
    source suav_venv_gcs/bin/activate || { echo "Failed to activate the virtual environment."; exit 1; }
fi

# Function to check if Python dependencies need updating
check_python_deps() {
  if [ ! -f "requirements.txt" ]; then
    echo "No requirements.txt found, skipping dependency installation."
    return
  fi

  # Compare installed packages with requirements.txt
  if ! pip freeze | grep -Fxqf requirements.txt; then
    echo "Updating Python dependencies..."
    pip install -r requirements.txt || { echo "Failed to install the requirements."; exit 1; }
  else
    echo "Python dependencies are already installed."
  fi
}

check_python_deps

# Start the backend server in the background
# Detect the operating system
OS="$(uname -s)"
case "$OS" in
  Linux*|Darwin*)
    echo "Checking sudo access..."
    
    # Prompt for sudo access upfront
    if ! sudo -v; then
      echo "Failed to gain sudo privileges. Exiting."
      exit 1
    fi

    echo "Starting backend server with sudo permissions..."
    sudo python server.py &  # Run with sudo
    ;;
  CYGWIN*|MINGW*|MSYS*|Windows_NT)
    # Start the backend server without sudo on Windows
    echo "Starting backend server on Windows..."
    python server.py &
    ;;
  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac

cd ../frontend

# Install node dependencies only if package-lock.json has changed
if [ -d "node_modules" ] && cmp -s package-lock.json .installed-lock; then
  echo "Node.js dependencies are already installed."
else
  echo "Installing Node.js dependencies..."
  npm ci
  cp package-lock.json .installed-lock  # Cache current state of dependencies
fi

echo "Starting frontend..."
npm start

wait