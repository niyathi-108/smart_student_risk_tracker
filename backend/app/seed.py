import asyncio
from datetime import date, timedelta
from sqlalchemy import delete
from .database import SessionLocal, engine, Base
from .models import (
    User, Student, Attendance, Assessment, Intervention,
    AttendanceStatus, AssessmentType, RiskLevel, InterventionStatus
)

async def seed_database():
    print("🔄 Creating database tables if they don't exist...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with SessionLocal() as db:
        try:
            print("🧹 Clearing existing data...")
            await db.execute(delete(Intervention))
            await db.execute(delete(Assessment))
            await db.execute(delete(Attendance))
            await db.execute(delete(Student))
            await db.execute(delete(User))
            await db.commit()

            print("👤 Seeding Users (Faculty/Admin)...")
            faculty_user = User(
                name="Dr. Alan Turing",
                email="faculty@college.edu",
                password_hash="hashed_password_secure_placeholder",
                role="Faculty"
            )
            db.add(faculty_user)
            await db.commit()

            print("🎓 Seeding Students...")
            students_data = [
                Student(student_id="108M1", first_name="Ananya", last_name="Ramesh", email="ananya.r@college.edu", department="Civil Engineering", semester=6),
                Student(student_id="107M1", first_name="Dinesh", last_name="Babu", email="dinesh.b@college.edu", department="Civil Engineering", semester=6),
                Student(student_id="105M1", first_name="Gokul", last_name="Anand", email="gokul.a@college.edu", department="Mechanical Engineering", semester=6),
                Student(student_id="101C1", first_name="Priya", last_name="Sharma", email="priya.s@college.edu", department="Computer Science", semester=6),
            ]
            db.add_all(students_data)
            await db.commit()

            print("📊 Seeding Assessments (IAT-1, IAT-2, EndSem)...")
            assessments_data = [
                Assessment(student_id="108M1", course_code="CIV601", title="Design of Steel Structural Elements", assessment_type=AssessmentType.IAT1, score=24.0, max_score=50.0),
                Assessment(student_id="108M1", course_code="CIV601", title="Design of Steel Structural Elements", assessment_type=AssessmentType.IAT2, score=28.0, max_score=50.0),
                Assessment(student_id="108M1", course_code="CIV601", title="Design of Steel Structural Elements", assessment_type=AssessmentType.EndSem, score=45.0, max_score=100.0),
                Assessment(student_id="108M1", course_code="CIV602", title="Geotechnical Engineering-II", assessment_type=AssessmentType.IAT1, score=22.0, max_score=50.0),
                Assessment(student_id="107M1", course_code="CIV601", title="Design of Steel Structural Elements", assessment_type=AssessmentType.IAT1, score=18.0, max_score=50.0),
                Assessment(student_id="107M1", course_code="CIV601", title="Design of Steel Structural Elements", assessment_type=AssessmentType.IAT2, score=20.0, max_score=50.0),
                Assessment(student_id="107M1", course_code="CIV602", title="Geotechnical Engineering-II", assessment_type=AssessmentType.EndSem, score=35.0, max_score=100.0),
                Assessment(student_id="105M1", course_code="MECH601", title="Design of Transmission Systems", assessment_type=AssessmentType.IAT1, score=42.0, max_score=50.0),
                Assessment(student_id="105M1", course_code="MECH601", title="Design of Transmission Systems", assessment_type=AssessmentType.EndSem, score=85.0, max_score=100.0),
                Assessment(student_id="101C1", course_code="CSE601", title="Compiler Design", assessment_type=AssessmentType.IAT1, score=45.0, max_score=50.0),
                Assessment(student_id="101C1", course_code="CSE601", title="Compiler Design", assessment_type=AssessmentType.EndSem, score=92.0, max_score=100.0),
            ]
            db.add_all(assessments_data)
            await db.commit()

            print("📅 Seeding Daily Attendance Logs...")
            today = date.today()
            attendance_data = []
            for student_id in ["108M1", "107M1", "105M1", "101C1"]:
                for i in range(10):
                    day = today - timedelta(days=i)
                    status = AttendanceStatus.Absent if i % 4 == 0 else AttendanceStatus.Present
                    attendance_data.append(Attendance(student_id=student_id, date=day, status=status))
            db.add_all(attendance_data)
            await db.commit()

            print("⚠️ Seeding Risk Interventions...")
            interventions_data = [
                Intervention(student_id="108M1", risk_level=RiskLevel.High, reason="Auto-evaluated: Avg Mark = 55.0% (Moderate risk), Attendance = 75.0% (High risk driver).", status=InterventionStatus.Pending),
                Intervention(student_id="107M1", risk_level=RiskLevel.High, reason="Auto-evaluated: Avg Mark = 42.5% (High risk), Attendance = 70.0% (High risk driver).", status=InterventionStatus.Pending),
                Intervention(student_id="105M1", risk_level=RiskLevel.High, reason="Auto-evaluated: Attendance = 70.0% (High risk driver).", status=InterventionStatus.Pending),
                Intervention(student_id="101C1", risk_level=RiskLevel.Low, reason="Auto-evaluated: On track.", status=InterventionStatus.Resolved),
            ]
            db.add_all(interventions_data)
            await db.commit()

            print("✅ Database successfully seeded asynchronously using SessionLocal!")

        except Exception as e:
            await db.rollback()
            print(f"❌ Error seeding database: {e}")

if __name__ == "__main__":
    asyncio.run(seed_database())