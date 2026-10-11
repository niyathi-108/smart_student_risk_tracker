# FastAPI Backend — Student Performance & Risk Analytics

## 1. Create the local PostgreSQL database
```bash
psql -U postgres -c "CREATE DATABASE student_analytics;"
```
Connection: `postgresql://postgres:password@localhost:5432/student_analytics`
(The app uses the async driver form `postgresql+asyncpg://...`; override with `DATABASE_URL`.)

## 2. Install & run
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export JWT_SECRET="a-long-random-string"
uvicorn app.main:app --reload --port 8000
```
Tables are created on startup. Interactive docs: http://localhost:8000/docs

## 3. Connect the React frontend
Create `.env` in the frontend root:
```
VITE_API_URL=http://localhost:8000
```
Without it, the UI runs on a built-in local demo dataset.

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| POST | /api/auth/signup | Register faculty/admin |
| POST | /api/auth/login | Returns JWT `access_token` |
| GET | /api/dashboard?q=&risk= | KPIs + intervention alerts |
| POST | /api/students | Add student |
| POST | /api/students/bulk | CSV upload (multipart `file`) |
| GET | /api/students/{student_id} | Profile, evaluation, drivers, mentor, attendance, marks |
| DELETE | /api/students/{student_id} | Delete student |
| POST | /api/students/{student_id}/resolve | Toggle Pending/Resolved |
| POST | /api/assessments | Add marks |
| POST | /api/assessments/bulk | CSV upload of marks |
| DELETE | /api/assessments/{id} | Delete mark |
| POST | /api/attendance/bulk | `{date, records:[{student_id,status}]}` |

## Evaluation rules (`app/evaluation.py`)
- Subject % = (IAT1 + IAT2 + EndSem scores) / (sum of max scores). Bands: <50 red, 50–60 yellow, ≥60 green.
- Mark risk: avg <50 High, <60 Moderate, else Low. Attendance risk: <65 High, <75 Moderate, else Low.
- Overall risk = the worse of the two. Every data change re-evaluates and upserts the Intervention row.
- Mentor: ≥70% → interdisciplinary career/business ideas; <60% → 3-week plan + book & video.
