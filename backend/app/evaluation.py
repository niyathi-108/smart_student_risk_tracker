"""Automated evaluation engine. Mirrors src/lib/evaluation.ts in the React app."""
import re
from collections import defaultdict

THRESHOLDS = {"mark_high": 50, "mark_moderate": 60, "att_high": 65, "att_moderate": 75, "strong": 70, "weak": 60}
RANK = {"Low": 0, "Moderate": 1, "High": 2}


def subject_band(pct: float) -> str:
    return "red" if pct < 50 else "yellow" if pct < 60 else "green"


def subject_performance(assessments) -> list[dict]:
    """Aggregate IAT1 + IAT2 + EndSem per course into a single percentage."""
    agg = defaultdict(lambda: {"title": "", "s": 0.0, "m": 0.0})
    for a in assessments:
        e = agg[a.course_code]
        e["title"] = a.title
        e["s"] += a.score
        e["m"] += a.max_score
    out = []
    for code, e in agg.items():
        pct = round(e["s"] / e["m"] * 100, 1) if e["m"] else 0.0
        out.append({"course_code": code, "title": e["title"], "percent": pct, "band": subject_band(pct)})
    return out


def average_mark(subjects: list[dict]) -> float:
    return round(sum(s["percent"] for s in subjects) / len(subjects), 1) if subjects else 0.0


def attendance_percent(records) -> float:
    if not records:
        return 100.0
    present = sum(1 for r in records if r.status.value == "Present")
    return round(present / len(records) * 100, 1)


def mark_risk(avg: float) -> str:
    return "High" if avg < THRESHOLDS["mark_high"] else "Moderate" if avg < THRESHOLDS["mark_moderate"] else "Low"


def attendance_risk(pct: float) -> str:
    return "High" if pct < THRESHOLDS["att_high"] else "Moderate" if pct < THRESHOLDS["att_moderate"] else "Low"


def overall_risk(a: str, b: str) -> str:
    return a if RANK[a] >= RANK[b] else b


def contribution_drivers(avg: float, att: float, subjects: list[dict]) -> list[dict]:
    """Rule #03 — plain-language feature contribution drivers (percentages sum to ~100)."""
    mark_gap = max(0.0, THRESHOLDS["mark_moderate"] - avg)
    att_gap = max(0.0, THRESHOLDS["att_moderate"] - att)
    failing = sum(1 for s in subjects if s["percent"] < 50)
    raw = [
        ("Academic marks", mark_gap * 1.2,
         f"Average mark of {avg}% is {f'{mark_gap:.1f} points below' if mark_gap else 'at or above'} the {THRESHOLDS['mark_moderate']}% benchmark."),
        ("Attendance", att_gap,
         f"Attendance of {att}% is {f'{att_gap:.1f} points below' if att_gap else 'at or above'} the {THRESHOLDS['att_moderate']}% requirement."),
        ("Failing subjects", failing * 8,
         f"{failing} subject(s) are below the 50% pass line." if failing else "No subjects below the pass line."),
    ]
    total = sum(w for _, w, _ in raw)
    return [{"feature": f, "contribution": round(w / total * 100) if total else 0, "explanation": e} for f, w, e in raw]


def risk_reason(avg: float, att: float) -> str:
    parts = []
    if avg < THRESHOLDS["mark_moderate"]:
        parts.append(f"Low average marks ({avg}%)")
    if att < THRESHOLDS["att_moderate"]:
        parts.append(f"Low attendance ({att}%)")
    return "; ".join(parts) or "Performing on track"


# ---------------- AI Smart Mentor dictionary ----------------
MENTOR_IDEAS = {
    "default": ["Build a portfolio project that applies this subject to a real community problem.",
                "Mentor junior students — teaching consolidates mastery."],
    "CS": ["Launch an EdTech micro-SaaS tool for peer learning.", "Contribute to open-source analytics libraries."],
    "MA": ["Quantitative analyst track: apply statistics to fintech risk models.", "Offer data-modelling consulting for local businesses."],
    "PH": ["Explore renewable-energy hardware prototyping.", "Combine physics with CS for simulation software."],
    "EC": ["Design IoT products for smart agriculture.", "Embedded systems freelancing for startups."],
}
MENTOR_RESOURCES = {
    "default": {"book": "Make It Stick — Brown, Roediger & McDaniel", "video": "Crash Course Study Skills (YouTube)"},
    "CS": {"book": "Introduction to Algorithms — Cormen et al.", "video": "MIT 6.006 OpenCourseWare lectures"},
    "MA": {"book": "Higher Engineering Mathematics — B.S. Grewal", "video": "3Blue1Brown — Essence of Linear Algebra"},
    "PH": {"book": "Concepts of Physics — H.C. Verma", "video": "Walter Lewin Physics Lectures (MIT)"},
    "EC": {"book": "Electronic Devices and Circuit Theory — Boylestad", "video": "NPTEL Analog Electronics"},
}


def _prefix(code: str) -> str:
    return re.sub(r"[^A-Za-z]", "", code)[:2].upper()


def mentor_recommendations(subjects: list[dict]) -> dict:
    strong, weak = [], []
    for s in subjects:
        p = _prefix(s["course_code"])
        label = f"{s['course_code']} · {s['title']}"
        if s["percent"] >= THRESHOLDS["strong"]:
            strong.append({"subject": label, "percent": s["percent"], "ideas": MENTOR_IDEAS.get(p, MENTOR_IDEAS["default"])})
        elif s["percent"] < THRESHOLDS["weak"]:
            r = MENTOR_RESOURCES.get(p, MENTOR_RESOURCES["default"])
            weak.append({
                "subject": label, "percent": s["percent"], **r,
                "plan": [
                    f"Week 1 — Rebuild fundamentals of {s['title']}: 45 min daily with the recommended text.",
                    "Week 2 — Solve previous IAT papers; review every mistake with a faculty mentor.",
                    "Week 3 — Timed mock tests and spaced revision of weak units.",
                ],
            })
    return {"strong": strong, "weak": weak}


def evaluate_student(student) -> dict:
    subjects = subject_performance(student.assessments)
    avg = average_mark(subjects)
    att = attendance_percent(student.attendance)
    mr, ar = mark_risk(avg), attendance_risk(att)
    return {
        "average_mark": avg, "attendance_percent": att,
        "mark_risk": mr, "attendance_risk": ar, "risk_level": overall_risk(mr, ar),
        "reason": risk_reason(avg, att),
        "subjects": subjects,
        "drivers": contribution_drivers(avg, att, subjects),
        "mentor": mentor_recommendations(subjects),
    }
