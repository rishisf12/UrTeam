# Phase 5 contract — YOU build Vite + Tailwind around this (backend already done).

## 1. Your setup (do this yourself)
```bash
cd project3_teampilot/frontend
npm create vite@latest . -- --template react
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm run dev   # -> http://localhost:5173
```
- No custom CSS beyond the Tailwind import.
- Copy `.env.example` to `.env` (already `VITE_API_URL=http://localhost:8001`).
- Backend CORS allows only `http://localhost:5173`.

## 2. api.js (done, in src/api.js)
Import: `import { listStudents, createStudent, getMatches, ... } from "./api.js"`.
Every call throws `Error(detail)` on failure -> catch and show in ErrorBanner.
Every request shows Spinner while pending.

## 3. ProfileForm (YOU build in src/components/ProfileForm.jsx)
Fields: name, email, branch, year, bio + SkillTagInput.
- Current-student selector: React state only (no login; V2 upgrade).
- Save: `createStudent(payload)` then `updateStudent(id, payload)`.
- Payload shape: `{name, email, branch, year, skills:[...], bio}`.

## 4. SkillTagInput (YOU build in src/components/SkillTagInput.jsx)
- Props: `{ value: string[], onChange: (tags:string[]) => void }`.
- Suggestions (exact): Python, React, AI/ML, Node.js, FastAPI, Java, Flutter, UI/UX, SQL.
- Backend lowercases/trims, so "React" and "react " match. Send raw strings.

## 5. Wiring order (test after each)
1. `/docs` POST /students works (Phase 2).
2. ProfileForm saves + reload lists via `listStudents()`.
3. Errors show red banner, loading shows spinner.
