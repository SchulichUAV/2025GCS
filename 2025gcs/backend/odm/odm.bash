#!/bin/bash

# Set variables
USER_NAME="$USER"
TARGET_DIR="/Users/${USER_NAME}/Documents/datasets/code"
PYTHON_EXEC="/opt/anaconda3/bin/python"
PYTHON_SCRIPT="/Users/liammah/Desktop/University/Schulich UAV/2025/2025GCS/2025gcs/backend/odm/odm_filter.py"

# Step 1: Delete everything in the target directory
rm -rf "${TARGET_DIR:?}"/*

# Step 2: Create required folders
mkdir -p "${TARGET_DIR}/images"
mkdir -p "${TARGET_DIR}/json_files"

echo "✅ Directory cleaned and folders created."

# Step 3: Run the Python script using specified Python version
echo "🚀 Running Python script..."
"$PYTHON_EXEC" "$PYTHON_SCRIPT"

echo "✅ Python script completed. Fresh ODM is ready."
