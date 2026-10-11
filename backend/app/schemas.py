from datetime import date
from typing import Literal
from pydantic import BaseModel, EmailStr, Field


class SignupIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: Literal["Faculty", "Administrator"] = "Faculty"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class StudentIn(BaseModel):
    student_id: str = Field(pattern=r"^[A-Za-z0-9-]{2,20}$")
    first_name: str = Field(min_length=1, max_length=50)
    last_name: str = Field(min_length=1, max_length=50)
    email: EmailStr
    department: str = Field(min_length=2, max_length=80)
    semester: int = Field(ge=1, le=8)


class AssessmentIn(BaseModel):
    student_id: str
    course_code: str = Field(pattern=r"^[A-Za-z]{2,4}\d{2,4}$")
    title: str = Field(min_length=2, max_length=100)
    assessment_type: Literal["IAT1", "IAT2", "EndSem"]
    score: float = Field(ge=0)
    max_score: float = Field(gt=0, le=200)


class AttendanceRecord(BaseModel):
    student_id: str
    status: Literal["Present", "Absent"]


class BulkAttendanceIn(BaseModel):
    date: date
    records: list[AttendanceRecord]
