# 2025GCS

## Prerequisites
- Node.js and npm installed
- Python 3.11 installed

## Running the Project

### 1. Automate All Installations and Run Everything
To automate all installations and run both the frontend and backend together, use the following command:

```sh
cd frontend
npm run start:full
```

This will:
1. Create and activate a virtual environment (if it doesn't exist).
2. Install the required Python dependencies.
3. Start the backend server (server.py).
4. Install the required node packages
5. Start the frontend.

### Things to Note About the OS You Are Running On

#### Unix Based (linux, mac)
If you are on a mac you will need to first grant the `start:full` script executable permissions, this can be done by navigating to the `frontend` directory and executing `chmod a+x ./scripts/start.sh`

#### Windows
If you are on windows open a `git bash` terminal and run `npm run start:full` in the frontend directory

### 2. Run the Frontend Only
To run the frontend only:
```sh
cd frontend
npm ci
npm run start
```

### 3. Run the Backend Only
To run the backend only, follow these steps:
1. Navigate to the backend directory:
```sh
cd backend
```
2. Create and activate the virtual environment (if it doesn't exist):
```sh
python3 -m venv venv
source venv/bin/activate
```
3. Install the required Python dependencies:
```sh
pip install -r requirements.txt
```
4. Run the server:
```sh
python server.py
```