#!/bin/bash

# Check for required arguments
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <lower_index> <upper_index>"
    exit 1
fi

# Read in CLI args for image index bounds
LOWER_INDEX=$1
UPPER_INDEX=$2

# Set variables
USER_NAME="$USER"
TARGET_DIR="/Users/${USER_NAME}/Documents/datasets/code"
PYTHON_EXEC="/opt/anaconda3/bin/python"
PYTHON_SCRIPT="/Users/liammah/Desktop/University/Schulich UAV/2025/2025GCS/2025gcs/backend/odm/odm_filter.py"

# Step 1: Clean the target directory
rm -rf "${TARGET_DIR:?}"/*

# Step 2: Create folders
mkdir -p "${TARGET_DIR}/images"
mkdir -p "${TARGET_DIR}/json_files"

echo "✅ Directory cleaned and folders created."

# Step 3: Run the Python filter script with the provided range
echo "🚀 Running Python script with image bounds $LOWER_INDEX to $UPPER_INDEX..."
"$PYTHON_EXEC" "$PYTHON_SCRIPT" "$LOWER_INDEX" "$UPPER_INDEX"
echo "✅ Python script completed."


# Step 4: Run ODM with Docker
# echo "🐳 Starting ODM Docker container..."
docker run -ti --rm -v "/Users/liammah/Documents/datasets:/datasets" \
 opendronemap/odm:latest \
 --project-path /datasets \
 --geo /datasets/code/odm_geotags.txt \
 --rerun-all \
 --orthophoto-resolution 4 \
 --feature-quality medium \
 --min-num-features 12000 \
 --matcher-neighbors 4 \
 --force-gps \
 --align auto \
 --fast-orthophoto \
 --dem-resolution 4 \
 --max-concurrency 8

echo "✅ ODM processing complete."

cp /Users/liammah/Documents/datasets/code/opensfm/stats/ortho.png /Users/liammah/Desktop/University/"Schulich UAV"/2025/2025GCS/2025gcs/backend/odm/map.png

echo "✅ Orthophoto copied to odm_ortho.png in geo folder."