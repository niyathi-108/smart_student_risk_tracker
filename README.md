# Intel Mentor

Act as a Full-Stack Software Architect. I am migrating an existing Django monolithic app (Student Performance & Risk Analytics Platform) into a modern decoupled stack:
- Frontend: React.js (Vite, Tailwind CSS, Lucide Icons, Recharts, Shadcn UI / Radix primitives).
- Backend: Python FastAPI connected to a local PostgreSQL Database via SQLAlchemy / AsyncPG.

Based on my existing Django HTML template directory structure, build the complete React UI with modern component design and provide FastAPI endpoint integrations.

---

### 📁 UI PAGES TO RECREATE IN REACT JS

1. Landing Page (`landing.html`)
   - Modern hero section introducing the AI Student Performance & Risk Analytics System.
   - Core Features overview (Explainability, Attendance Tracking, AI Mentorship).
   - Navigation bar with "Login" and "Sign Up" CTAs.

2. Authentication Pages (`login.html`, `signup.html`)
   - Clean, centered card forms for faculty/admin authentication.
   - Form state handling with React and JWT token storage in localStorage.

3. Main Dashboard (`dashboard.html`)
   - Top KPI cards: Total Students, High Risk Count, Moderate Risk Count, On-Track Count.
   - Global Search bar & Risk Level filter dropdowns (High, Moderate, Low).
   - Action Header Buttons: "Daily Attendance Portal", "Add Student", "Bulk Upload Students".
   - Recent Student Intervention Alerts table displaying Student ID, Name, Risk Level (colored badges), Identified Reason, Status (Pending/Resolved toggle button), and View/Delete actions.

4. Student Detail View (`student_detail.html`)
   - Student profile summary header (Name, ID, Department, Semester, Risk Status Badge, Email).
   - Metric summary cards: Average Mark %, Attendance %.
   - System Evaluation Log / Risk Explanation Card (Rule #03 Plain-Language Feature Contribution Drivers).
   - Overall Subject Performance Card: Progress bars per subject aggregating IAT-1, IAT-2, and End Sem marks into color-coded indicators (<50% red, 50-60% yellow, >60% green).
   - AI Smart Mentor Card: Interdisciplinary career/business ideas for strong subjects (≥70%) and a 3-week study plan with book/video recommendations for weak subjects (<60%).
   - Daily Attendance Calendar Grid with status indicators (Present, Absent, Pending).
   - Marks Table with individual subject scores, types, and delete actions.

5. Data Input Portals
   - Add Single Student Form (`add_student.html`).
   - Bulk Student Upload (`bulk_upload.html` with CSV parsing drag-and-drop zone).
   - Daily Attendance Portal (`bulk_attendance_portal.html` with batch present/absent toggles).
   - Add Marks Form (`add_assessment.html`).
   - Bulk Upload Marks (`bulk_upload_assessment.html`).

---

### ⚙️ FASTAPI + LOCAL POSTGRESQL ARCHITECTURE INSTRUCTIONS

Please provide full instructions for setting up the FastAPI Python backend with local PostgreSQL:

1. PostgreSQL Database Schema (SQLAlchemy Models):
   - `Student`: `student_id` (PK), `first_name`, `last_name`, `email`, `department`, `semester`.
   - `Attendance`: `id`, `student_id` (FK), `date`, `status` (Present/Absent).
   - `Assessment`: `id`, `student_id` (FK), `course_code`, `title`, `assessment_type` (IAT1/IAT2/EndSem), `score`, `max_score`.
   - `Intervention`: `id`, `student_id` (FK), `risk_level` (High/Moderate/Low), `reason`, `status` (Pending/Resolved).

2. Core Backend Logic:
   - Provide the API endpoint structure for GET `/api/dashboard`, GET `/api/students/{student_id}`, POST `/api/students/{student_id}/resolve`, and POST `/api/attendance/bulk`.
   - Include the automated evaluation logic that computes mark risk, attendance risk, feature contribution drivers, and the AI mentor recommendations dictionary in Python.

3. Connection Config:
   - Use `postgresql://postgres:password@localhost:5432/student_analytics` for the local PostgreSQL connection. . use a foramal and professional ui

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://intel-mentor.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/20f05068-758f-4910-9976-6699db5c50eb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
