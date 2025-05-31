# ODM Processing Workflow

This guide outlines the steps to preprocess and run an OpenDroneMap (ODM) project using a Bash script, a Python filter, and a Docker container.

---

## ✅ Step 1: Run the Bash Script

Start by cleaning and preparing your dataset directory:

```bash
./odm.bash
```

This script will:
- Delete everything inside `/Users/<your_username>/Documents/datasets/code/`
- Create two new folders: `images/` and `json_files/`

---

## ✅ Step 2: Run the Python Filter

Execute the Python script to filter or prepare geotags:

```bash
python3 /Users/liammah/Desktop/University/Schulich\ UAV/2025/2025GCS/2025gcs/backend/odm/odm_filter.py
```

---

## ✅ Step 3: Run ODM in Docker

Use the following Docker command to run the OpenDroneMap process:

```bash
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
  --align auto
```

---

## 💡 Notes

- Ensure Docker is installed and running.
- Make sure the image files and `odm_geotags.txt` are correctly placed under `/Users/liammah/Documents/datasets/code/`.
- You can modify `odm.bash` or the Python script path as needed to match your setup.
