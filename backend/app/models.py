import enum
from datetime import date
from sqlalchemy import Date, Enum, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


class AttendanceStatus(str, enum.Enum):
    Present = "Present"
    Absent = "Absent"


class AssessmentType(str, enum.Enum):
    IAT1 = "IAT1"
    IAT2 = "IAT2"
    EndSem = "EndSem"


class RiskLevel(str, enum.Enum):
    High = "High"
    Moderate = "Moderate"
    Low = "Low"


class InterventionStatus(str, enum.Enum):
    Pending = "Pending"
    Resolved = "Resolved"


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="Faculty")


class Student(Base):
    __tablename__ = "students"
    student_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    first_name: Mapped[str] = mapped_column(String(50))
    last_name: Mapped[str] = mapped_column(String(50))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    department: Mapped[str] = mapped_column(String(80))
    semester: Mapped[int] = mapped_column(Integer)

    attendance: Mapped[list["Attendance"]] = relationship(back_populates="student", cascade="all, delete-orphan")
    assessments: Mapped[list["Assessment"]] = relationship(back_populates="student", cascade="all, delete-orphan")
    interventions: Mapped[list["Intervention"]] = relationship(back_populates="student", cascade="all, delete-orphan")


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (UniqueConstraint("student_id", "date"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[str] = mapped_column(ForeignKey("students.student_id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = mapped_column(Date)
    status: Mapped[AttendanceStatus] = mapped_column(Enum(AttendanceStatus))
    student: Mapped[Student] = relationship(back_populates="attendance")


class Assessment(Base):
    __tablename__ = "assessments"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[str] = mapped_column(ForeignKey("students.student_id", ondelete="CASCADE"), index=True)
    course_code: Mapped[str] = mapped_column(String(10))
    title: Mapped[str] = mapped_column(String(100))
    assessment_type: Mapped[AssessmentType] = mapped_column(Enum(AssessmentType))
    score: Mapped[float] = mapped_column(Float)
    max_score: Mapped[float] = mapped_column(Float)
    student: Mapped[Student] = relationship(back_populates="assessments")


class Intervention(Base):
    __tablename__ = "interventions"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[str] = mapped_column(ForeignKey("students.student_id", ondelete="CASCADE"), index=True)
    risk_level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel))
    reason: Mapped[str] = mapped_column(String(500))
    status: Mapped[InterventionStatus] = mapped_column(Enum(InterventionStatus), default=InterventionStatus.Pending)
    student: Mapped[Student] = relationship(back_populates="interventions")
