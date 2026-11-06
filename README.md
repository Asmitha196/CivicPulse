# CivicPulse

CivicPulse is a full-stack civic issue reporting and resolution platform. Citizens can report location-based problems, administrators can review and merge duplicate complaints, field workers can update assigned work, and citizens can track resolution and submit feedback.

## Features

- Role-based dashboards for citizens, administrators, and field workers
- GPS/map-based issue reporting with image uploads
- AI-assisted category, priority, and duplicate detection
- Complaint grouping and administrative verification
- Worker assignment and status tracking
- Repair evidence upload and administrator approval
- Notifications, citizen feedback, reopening, and analytics
- Automatic demo data seeding for local development

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, React Router |
| Maps and charts | Leaflet, React Leaflet, Chart.js |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Authentication | JWT and bcrypt |
| Database | PostgreSQL/PostGIS with automatic SQLite fallback |
| AI fallback | scikit-learn TF-IDF similarity and local heuristics |

## Project Structure

~~~text
CivicPulse/
├── backend/
│   ├── app/
│   │   ├── database/       # SQLAlchemy engine and sessions
│   │   ├── middleware/     # Authentication dependencies
│   │   ├── models/         # Database models
│   │   ├── routes/         # FastAPI endpoints
│   │   ├── schemas/        # Pydantic request/response models
│   │   ├── services/       # AI and notification services
│   │   └── main.py         # FastAPI application
│   ├── uploads/            # Report and evidence uploads
│   ├── requirements.txt
│   └── test_workflow.py    # End-to-end demonstration workflow
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
├── start_all.bat
├── start_backend.bat
└── start_frontend.bat
~~~

## Prerequisites

- Python 3.11 or newer
- Node.js 18 or newer
- npm
- PostgreSQL with PostGIS is optional; SQLite is used automatically when PostgreSQL is unavailable

## Quick Start on Windows

Run these commands from the repository root in PowerShell:

~~~powershell
py -3.11 -m venv backend\venv
.\backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env

Push-Location frontend
npm install
Pop-Location

.\start_all.bat
~~~

Then open:

- Frontend: http://localhost:5173
- API documentation: http://127.0.0.1:8001/docs
- Health check: http://127.0.0.1:8001/api/health

The backend creates the required tables and seeds demo accounts on first startup.

## Manual Start

Start the backend:

~~~powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
~~~

In another terminal, start the frontend:

~~~powershell
cd frontend
npm run dev
~~~

On macOS or Linux, create a virtual environment with python3 -m venv backend/venv, use backend/venv/bin/python, and run the backend/frontend commands manually.

## Configuration

Copy backend/.env.example to backend/.env and adjust these values as needed:

| Variable | Purpose |
| --- | --- |
| SECRET_KEY | Signs JWT access tokens; replace it outside local development |
| ACCESS_TOKEN_EXPIRE_MINUTES | JWT lifetime in minutes |
| DATABASE_URL | PostgreSQL connection URL |
| SQLITE_FALLBACK_URL | Local database used when PostgreSQL is unavailable |
| UPLOAD_DIR | Upload storage directory |

For a deployed frontend, set VITE_API_URL to the backend API base URL, including /api.

The included credentials and secret key are for local demonstration only.

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@civicpulse.org | admin123 |
| Field worker | worker@civicpulse.org | worker123 |
| Field worker | worker2@civicpulse.org | worker123 |
| Citizen | citizen@civicpulse.org | citizen123 |
| Citizen | citizen2@civicpulse.org | citizen123 |

## Validation

Build the frontend:

~~~powershell
cd frontend
npm run build
~~~

Check backend imports and dependencies:

~~~powershell
cd backend
.\venv\Scripts\python.exe -m compileall -q app
.\venv\Scripts\python.exe -m pip check
~~~

Run the end-to-end workflow while the backend is running on port 8001:

~~~powershell
cd backend
.\venv\Scripts\python.exe test_workflow.py
~~~

The workflow writes demonstration records to the configured database. It is a standalone integration script, not a pytest test suite.

## Troubleshooting

- A PostgreSQL connection warning is expected when PostgreSQL is not running; the backend then uses SQLite.
- If a launcher reports a missing virtual environment, run the Quick Start setup first.
- If ports 5173 or 8001 are already in use, stop the existing process before using the batch launchers.
- Map tiles and reverse geocoding require internet access. Browser geolocation also requires location permission.
- Uploaded files are stored under backend/uploads/.
