# TeamPilot — CampusPilot Hackathon Module

Match students into hackathon teams by skill overlap (Jaccard similarity).
Backend: FastAPI + SQLModel + PostgreSQL (SQLite fallback, no Docker needed).
Frontend: React (Vite) + Tailwind — user-built in `frontend/`.
ML training (Colab) lives in `ml/` only — never imported by the backend (V2 upgrade).

## Folder structure (you own `frontend/`)
```text
project3_teampilot/
  README.md
  backend/
    requirements.txt
    .env.example              # copy to .env
    backend/                  # FastAPI package (run from backend/ folder)
      main.py                 # app, CORS, /health, router includes
      database.py             # Postgres->SQLite fallback, logs DB in use
      models.py               # Student, Idea, TeamRequest + normalize_tags
      config.py               # DATABASE_URL reader
      routes/students.py      # Students CRUD (409 on dup email)
      routes/ideas.py         # Ideas CRUD + ?tech= + join/decide
      routes/matching.py      # GET /match/{student_id}
      services/matching_service.py  # pure Jaccard, no ML deps
      services/idea_service.py      # count_accepted / is_full
      scripts/seed.py         # 8 students + 6 ideas, idempotent
      tests/test_matching.py  # 4 Jaccard unit tests
  database/
    docker-compose.yml        # Postgres 15, volume + healthcheck
  frontend/
    .env.example              # VITE_API_URL=http://localhost:8001
    PHASE5-CONTRACT.md        # your Vite setup steps + prop specs
    src/api.js                # all fetch calls (base URL from env)
    src/App.jsx               # dashboard wiring reference
    src/components/ErrorBanner.jsx | Spinner.jsx
    src/components/IdeaCard.jsx | IdeaBoard.jsx | PostIdeaForm.jsx | BestMatches.jsx
  ml/
    README.md                 # Colab placeholder, backend never imports it
```
Generated at runtime (not source): `backend/.env`, `backend/teampilot.db`,
`__pycache__/`, `.pytest_cache/`.

## Prerequisites
- Python 3.10 (`py -3.10 --version`) — code is 3.10-safe, runs on 3.11+ too
- Node 18+ (`node --version`) — for your own Vite setup
- Docker Desktop (optional — app runs on SQLite without it)

## Ports
| Service  | Port | URL |
|----------|------|-----|
| FastAPI  | 8001 | http://localhost:8001 + /docs |
| Postgres | 5433 | localhost:5433 (docker maps 5433->5432) |
| Vite     | 5173 | http://localhost:5173 (backend CORS allows only this) |

## Env variables
| File | Var | Example | Notes |
|------|-----|---------|-------|
| `backend/.env` | DATABASE_URL | `sqlite:///./teampilot.db` (default) | Postgres: `postgresql://teampilot:teampilot_pw@localhost:5433/teampilot` |
| `frontend/.env` | VITE_API_URL | `http://localhost:8001` | Read in `src/api.js` via `import.meta.env` |

## Setup + run (PowerShell)
```powershell
# 0. Enter project
cd "C:\Users\Appex\Documents\Default Project\project3_teampilot"

# 1. Backend (first test surface is /docs, before any frontend)
cd backend
py -3.10 -m venv .venv
.\.venv\Scripts\pip.exe install -r requirements.txt
Copy-Item -Force .env.example .env
.\.venv\Scripts\python.exe -m backend.scripts.seed
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --port 8001
# open http://localhost:8001/docs

# 2. Tests
$env:PYTHONPATH="C:\Users\Appex\Documents\Default Project\project3_teampilot\backend"
.\.venv\Scripts\python.exe -m pytest backend/tests/test_matching.py -v

# 3. Postgres (optional — skip if no Docker; SQLite already works)
cd ../database
docker compose up -d
# then in backend/.env set DATABASE_URL=postgresql://teampilot:teampilot_pw@localhost:5433/teampilot
# rerun seed + uvicorn from step 1

# 4. Frontend (YOU build — backend never blocks on this)
cd ../frontend
npm create vite@latest . -- --template react
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
Copy-Item -Force .env.example .env
npm run dev
```

## API quick reference
- `GET /health` -> `{"status":"ok"}`
- Students: `POST /students | GET /students | GET /students/{id} | PUT /students/{id} | DELETE /students/{id}` (dup email -> 409)
- Ideas: `POST /ideas | GET /ideas?tech=python | GET /ideas/{id} | PUT /ideas/{id} | DELETE /ideas/{id}`
- `POST /ideas/{id}/join {"student_id":N}` blocks: owner-own (400), dup (409), closed (400), full = accepted>=size (400)
- `GET /ideas/{id}/requests`, `PUT /team-requests/{id} {"owner_id":N,"status":"accepted"|"rejected"}` (non-owner 403)
- `GET /match/{student_id}` -> ranked `[{idea_id,title,tech_stack,score %,matching_skills,missing_skills,is_open,owner_id}]`, own ideas excluded
- **V2 upgrade**: On-student-join chat notification (2-line only, creator‑aware) — WebSocket / real‑time not included in MVP.
- **Chat room access**: Idea owner has direct chat access. Non-owners may submit a `POST /ideas/{id}/chat-request` {student_id}; owner receives notification and can `PUT /chat-requests/{id}` to approve/reject. Approved students may enter the chat room (2‑line message limit per message).

## Troubleshooting
| Symptom | Cause | Fix |
|---------|-------|-----|
| `No module named backend` | Wrong cwd | `cd ...\project3_teampilot\backend` first; set `$env:PYTHONPATH=...\project3_teampilot\backend` for pytest |
| `307 on POST /students/` | Trailing slash | Use `/students` not `/students/` (same for `/ideas`) |
| `422 Unprocessable Entity` | Missing fields / bad body | Students need `name,email`; join needs `{"student_id":N}`; decide needs `{"owner_id":N,"status":"accepted"}` |
| `409 Email already registered` | Duplicate email (by design) | Use a new email or `PUT /students/{id}` |
| `400 Owner cannot join own idea` | By design | Switch current student in UI selector |
| `400 Team is full` | accepted >= team_size_needed (by design) | Bump size via `PUT /ideas/{id}` |
| `API unreachable / CORS error` | Backend down or wrong origin | Backend on `:8001`, frontend exactly `http://localhost:5173`, `VITE_API_URL=http://localhost:8001` |
| `psycopg2 install fails` | No build tools | Stay on SQLite fallback (default); Postgres optional |
| `port 8001 in use` | Old uvicorn running | `netstat -ano \| findstr 8001`, kill PID, or `--port 8002` |

## Notes
- Auth: current-student `<select>` in React state (no login; V2 upgrade).
- Skills/tech normalized lowercase-trimmed: "React" == "react ".
- Startup log states DB in use: `Using database: sqlite (...)` vs `postgres (...)`.
- Test order: `/docs` first, then frontend.
