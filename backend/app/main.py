import csv
import io
import os
from collections import defaultdict
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlalchemy import delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from . import models as m
from .database import Base, engine, get_db
from .evaluation import evaluate_student
from .models import Assessment, Student
from .schemas import AssessmentIn, BulkAttendanceIn, LoginIn, SignupIn, StudentIn

from .mentor import generate_ai_mentor_report


SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer()

app = FastAPI(title="Student Performance & Risk Analytics API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:8080,http://localhost:5173").split(","),
    allow_methods=["*"], allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)  # use Alembic for production migrations


# ---------------- Auth ----------------
def make_token(user: m.User) -> str:
    return jwt.encode({"sub": user.email, "role": user.role, "exp": datetime.now(timezone.utc) + timedelta(hours=12)}, SECRET, "HS256")


async def current_user(cred: HTTPAuthorizationCredentials = Depends(bearer), db: AsyncSession = Depends(get_db)) -> m.User:
    try:
        payload = jwt.decode(cred.credentials, SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired token")
    user = await db.scalar(select(m.User).where(m.User.email == payload["sub"]))
    if not user:
        raise HTTPException(401, "User not found")
    return user


@app.post("/api/auth/signup", status_code=201)
async def signup(body: SignupIn, db: AsyncSession = Depends(get_db)):
    if await db.scalar(select(m.User).where(m.User.email == body.email)):
        raise HTTPException(409, "An account with this email already exists")
    db.add(m.User(name=body.name, email=body.email, password_hash=pwd.hash(body.password), role=body.role))
    await db.commit()
    return {"ok": True}


@app.post("/api/auth/login")
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(m.User).where(m.User.email == body.email))
    if not user or not pwd.verify(body.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    return {"access_token": make_token(user), "token_type": "bearer"}


# ---------------- Helpers ----------------
async def load_student(db: AsyncSession, sid: str) -> m.Student:
    s = await db.scalar(
        select(m.Student).where(m.Student.student_id == sid)
        .options(selectinload(m.Student.attendance), selectinload(m.Student.assessments), selectinload(m.Student.interventions))
    )
    if not s:
        raise HTTPException(404, f"Student {sid} not found")
    return s


async def reevaluate(db: AsyncSession, sid: str) -> dict:
    """Recompute risk and upsert the student's intervention row."""
    s = await load_student(db, sid)
    ev = evaluate_student(s)
    iv = s.interventions[0] if s.interventions else None
    if iv is None:
        db.add(m.Intervention(student_id=sid, risk_level=ev["risk_level"], reason=ev["reason"],
                              status="Resolved" if ev["risk_level"] == "Low" else "Pending"))
    else:
        if iv.risk_level.value != ev["risk_level"]:
            iv.status = m.InterventionStatus.Pending
        iv.risk_level, iv.reason = m.RiskLevel(ev["risk_level"]), ev["reason"]
    return ev


def student_dict(s: m.Student) -> dict:
    return {k: getattr(s, k) for k in ("student_id", "first_name", "last_name", "email", "department", "semester")}


# ---------------- Dashboard ----------------
@app.get("/api/dashboard")
async def dashboard(q: str = "", risk: str = "", db: AsyncSession = Depends(get_db), _=Depends(current_user)):
    stmt = select(m.Intervention, m.Student).join(m.Student)
    if risk in ("High", "Moderate", "Low"):
        stmt = stmt.where(m.Intervention.risk_level == risk)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(m.Student.student_id.ilike(like), m.Student.first_name.ilike(like),
                              m.Student.last_name.ilike(like), m.Student.department.ilike(like)))
    rows = (await db.execute(stmt)).all()
    all_iv = (await db.scalars(select(m.Intervention))).all()
    total = len((await db.scalars(select(m.Student.student_id))).all())
    count = lambda lvl: sum(1 for i in all_iv if i.risk_level.value == lvl)
    return {
        "kpis": {"total_students": total, "high_risk": count("High"), "moderate_risk": count("Moderate"), "on_track": count("Low")},
        "alerts": [{**student_dict(s), "intervention_id": iv.id, "risk_level": iv.risk_level.value,
                    "reason": iv.reason, "status": iv.status.value} for iv, s in rows],
    }


# ---------------- Students ----------------
@app.post("/api/students", status_code=201)
async def create_student(body: StudentIn, db: AsyncSession = Depends(get_db), _=Depends(current_user)):
    if await db.get(m.Student, body.student_id):
        raise HTTPException(409, "Student already exists")
    db.add(m.Student(**body.model_dump()))
    await db.flush()
    await reevaluate(db, body.student_id)
    await db.commit()
    return {"ok": True}


@app.post("/api/students/bulk")
async def bulk_students(file: UploadFile = File(...), db: AsyncSession = Depends(get_db), _=Depends(current_user)):
    text = (await file.read()).decode("utf-8-sig")
    added, errors = 0, []
    for i, row in enumerate(csv.DictReader(io.StringIO(text)), start=2):
        try:
            data = StudentIn(**{k.strip().lower(): v.strip() for k, v in row.items()})
        except Exception as e:  # noqa: BLE001
            errors.append({"line": i, "error": str(e)}); continue
        if await db.get(m.Student, data.student_id):
            continue
        db.add(m.Student(**data.model_dump())); await db.flush()
        await reevaluate(db, data.student_id); added += 1
    await db.commit()
    return {"added": added, "errors": errors}


@app.get("/api/students/{student_id}")
async def student_detail(student_id: str, db: AsyncSession = Depends(get_db), _=Depends(current_user)):
    s = await load_student(db, student_id)
    ev = evaluate_student(s)
    return {
        "student": student_dict(s),
        "evaluation": ev,
        "attendance": [{"id": a.id, "date": a.date.isoformat(), "status": a.status.value} for a in sorted(s.attendance, key=lambda a: a.date)],
        "assessments": [{"id": a.id, "course_code": a.course_code, "title": a.title, "assessment_type": a.assessment_type.value,
                         "score": a.score, "max_score": a.max_score} for a in s.assessments],
        "intervention": ({"status": s.interventions[0].status.value} if s.interventions else None),
    }


@app.delete("/api/students/{student_id}")
async def delete_student(student_id: str, db: AsyncSession = Depends(get_db), _=Depends(current_user)):
    s = await load_student(db, student_id)
    await db.delete(s); await db.commit()
    return {"ok": True}


@app.post("/api/students/{student_id}/resolve")
async def resolve(student_id: str, db: AsyncSession = Depends(get_db), _=Depends(current_user)):
    """Toggle the intervention status Pending <-> Resolved."""
    s = await load_student(db, student_id)
    if not s.interventions:
        raise HTTPException(404, "No intervention for this student")
    iv = s.interventions[0]
    iv.status = m.InterventionStatus.Resolved if iv.status == m.InterventionStatus.Pending else m.InterventionStatus.Pending
    await db.commit()
    return {"student_id": student_id, "status": iv.status.value}


# ---------------- Marks ----------------
@app.post("/api/assessments", status_code=201)
async def add_assessment(body: AssessmentIn, db: AsyncSession = Depends(get_db), _=Depends(current_user)):
    if body.score > body.max_score:
        raise HTTPException(422, "Score cannot exceed max score")
    await load_student(db, body.student_id)
    db.add(m.Assessment(**{**body.model_dump(), "course_code": body.course_code.upper()}))
    await db.flush(); ev = await reevaluate(db, body.student_id); await db.commit()
    return {"ok": True, "risk_level": ev["risk_level"]}


@app.post("/api/assessments/bulk")
async def bulk_assessments(file: UploadFile = File(...), db: AsyncSession = Depends(get_db), _=Depends(current_user)):
    text = (await file.read()).decode("utf-8-sig")
    touched, errors = set(), []
    for i, row in enumerate(csv.DictReader(io.StringIO(text)), start=2):
        try:
            a = AssessmentIn(**{k.strip().lower(): v.strip() for k, v in row.items()})
            if a.score > a.max_score or not await db.get(m.Student, a.student_id):
                raise ValueError("Invalid score or unknown student")
        except Exception as e:  # noqa: BLE001
            errors.append({"line": i, "error": str(e)}); continue
        db.add(m.Assessment(**a.model_dump())); touched.add(a.student_id)
    await db.flush()
    for sid in touched:
        await reevaluate(db, sid)
    await db.commit()
    return {"students_updated": len(touched), "errors": errors}


@app.delete("/api/assessments/{assessment_id}")
async def delete_assessment(assessment_id: int, db: AsyncSession = Depends(get_db), _=Depends(current_user)):
    a = await db.get(m.Assessment, assessment_id)
    if not a:
        raise HTTPException(404, "Assessment not found")
    sid = a.student_id
    await db.delete(a); await db.flush(); await reevaluate(db, sid); await db.commit()
    return {"ok": True}


# ---------------- Attendance ----------------
@app.post("/api/attendance/bulk")
async def bulk_attendance(body: BulkAttendanceIn, db: AsyncSession = Depends(get_db), _=Depends(current_user)):
    ids = [r.student_id for r in body.records]
    await db.execute(delete(m.Attendance).where(m.Attendance.date == body.date, m.Attendance.student_id.in_(ids)))
    for r in body.records:
        db.add(m.Attendance(student_id=r.student_id, date=body.date, status=r.status))
    await db.flush()
    for sid in ids:
        await reevaluate(db, sid)
    await db.commit()
    return {"date": body.date.isoformat(), "saved": len(body.records)}


@app.get("/api/students/{student_id}/ai-report")
async def get_student_ai_report(student_id: str, db: AsyncSession = Depends(get_db)):
    # Fetch student
    student_result = await db.execute(select(Student).where(Student.student_id == student_id))
    student = student_result.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Fetch assessments
    assessments_result = await db.execute(select(Assessment).where(Assessment.student_id == student_id))
    assessments = assessments_result.scalars().all()
    
    # Calculate average performance per course/topic
    course_stats = defaultdict(lambda: {"total_score": 0, "total_max": 0, "title": ""})
    for asm in assessments:
        code = asm.course_code
        course_stats[code]["total_score"] += asm.score
        course_stats[code]["total_max"] += asm.max_score
        course_stats[code]["title"] = asm.title
        
    course_performance = []
    for code, data in course_stats.items():
        avg = (data["total_score"] / data["total_max"] * 100) if data["total_max"] > 0 else 0
        course_performance.append({
            "course_code": code,
            "title": data["title"],
            "average_score": round(avg, 2)
        })