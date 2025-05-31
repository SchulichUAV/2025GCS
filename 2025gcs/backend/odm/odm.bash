#!/bin/bash

# Set variables
USER_NAME="$USER"
TARGET_DIR="/Users/${USER_NAME}/Documents/datasets/code"

# Step 1: Delete everything in the target directory
rm -rf "${TARGET_DIR:?}"/*

# Step 2: Create required folders
mkdir -p "${TARGET_DIR}/images"
mkdir -p "${TARGET_DIR}/json_files"

echo "Done: directory cleaned and folders created. Fresh ODM."
