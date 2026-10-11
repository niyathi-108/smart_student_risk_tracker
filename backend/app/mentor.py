# ai_mentor.py (Pure Local Logic - No OpenAI Required)

CAREER_MAPPINGS = {
    "CS": {
        "strong_keywords": ["programming", "algorithm", "software", "database"],
        "career_title": "Software & Systems Engineer",
        "job_roles": ["Backend Developer", "Systems Architect", "Software Engineer"],
        "business_idea": "Build a campus-wide automated assignment tracker and code review platform."
    },
    "CIV": {
        "strong_keywords": ["structural", "geotechnical", "design", "concrete"],
        "career_title": "Infrastructure & Structural Consultant",
        "job_roles": ["Structural Design Engineer", "Site Supervisor", "Geotechnical Analyst"],
        "business_idea": "Develop a localized smart-materials cost estimation and durability calculator tool."
    }
}

def generate_ai_mentor_report(student_name: str, department: str, semester: int, course_performance: list):
    strengths = [cp for cp in course_performance if cp['average_score'] >= 70.0]
    struggles = [cp for cp in course_performance if cp['average_score'] < 60.0]
    
    # Match department or default to general engineering
    profile = CAREER_MAPPINGS.get(department, {
        "career_title": "Core Technical Specialist",
        "job_roles": ["Junior Engineer", "Technical Consultant"],
        "business_idea": "Automated workflow optimization tool for engineering firms."
    })

    return {
        "student_name": student_name,
        "career_and_business_synergies": [{
            "title": profile["career_title"],
            "job_roles": profile["job_roles"],
            "business_idea": profile["business_idea"]
        }],
        "remedial_study_plans": [
            {
                "course_code": s["course_code"],
                "topic_title": s["title"],
                "current_score": s["average_score"],
                "study_plan": [
                    "Week 1: Review core textbook chapters and lecture slides.",
                    "Week 2: Complete practice problem sets with faculty guidance.",
                    "Week 3: Take timed mock tests focusing on weak modules."
                ],
                "resources": {
                    "books": "Recommended Course Reference Textbook",
                    "documents": "Departmental Lecture Notes & Previous Exam Papers",
                    "videos": "Core Concept Tutorial Series"
                }
            } for s in struggles
        ]
    }