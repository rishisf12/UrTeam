"""Seed ~8 students + ~6 ideas. Run from backend/ folder. Idempotent."""
import logging
import sys
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from sqlmodel import Session, select  # noqa: E402

from backend.database import engine, init_db  # noqa: E402
from backend.models import Idea, Student, normalize_tags  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("teampilot")


STUDENTS = [
    ("Aarav Shah", "aarav@iiitdmj.ac.in", "CSE", 2, ["Python", "FastAPI", "SQL"], "Backend fan"),
    ("Diya Patel", "diya@iiitdmj.ac.in", "CSE", 3, ["React", "UI/UX", "JavaScript"], "Frontend dev"),
    ("Kabir Rao", "kabir@iiitdmj.ac.in", "AI", 2, ["Python", "AI/ML", "SQL"], "ML explorer"),
    ("Meera Nair", "meera@iiitdmj.ac.in", "ECE", 1, ["Flutter", "Dart", "UI/UX"], "Mobile newbie"),
    ("Rohan Iyer", "rohan@iiitdmj.ac.in", "CSE", 4, ["Node.js", "React", "SQL"], "Full-stack"),
    ("Sneha Kulkarni", "sneha@iiitdmj.ac.in", "IT", 3, ["Java", "SQL", "React"], "Java + web"),
    ("Arjun Mehta", "arjun@iiitdmj.ac.in", "CSE", 2, ["Python", "React", "FastAPI"], "Hackathon regular"),
    ("Ishita Verma", "ishita@iiitdmj.ac.in", "DS", 3, ["AI/ML", "Python", "Flutter"], "AI + apps"),
]

IDEAS = [
    ("Campus Lost & Found API", "Report and find lost items on campus.", ["Python", "FastAPI", "SQL"], 3, 0, True),
    ("Study Buddy Matcher", "Match students by subjects and time slots.", ["React", "Node.js", "SQL"], 4, 1, True),
    ("Attendance via Face", "Prototype face-recognition attendance.", ["Python", "AI/ML", "SQL"], 3, 2, True),
    ("Mess Menu App", "Weekly mess menu + polls, Flutter UI.", ["Flutter", "UI/UX"], 2, 3, True),
    ("Fest Website", "College fest site with events and passes.", ["React", "UI/UX"], 4, 4, False),
    ("Placement Prep Bot", "Q&A bot over placement questions.", ["Python", "AI/ML", "FastAPI"], 3, 6, True),
]


def main() -> None:
    init_db()
    with Session(engine) as s:
        existing = s.exec(select(Student)).all()
        if existing:
            logger.info("Seed skipped: %d students already exist.", len(existing))
            return
        objs = []
        for name, email, branch, year, skills, bio in STUDENTS:
            objs.append(Student(name=name, email=email.lower().strip(),
                                branch=branch, year=year,
                                skills=normalize_tags(skills), bio=bio))
        s.add_all(objs)
        s.commit()
        for o in objs:
            s.refresh(o)
        ideas = []
        for title, desc, stack, size, owner_idx, is_open in IDEAS:
            ideas.append(Idea(title=title, description=desc,
                              tech_stack=normalize_tags(stack),
                              team_size_needed=size,
                              owner_id=objs[owner_idx].id, is_open=is_open))
        s.add_all(ideas)
        s.commit()
        logger.info("Seeded %d students + %d ideas.", len(objs), len(ideas))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        logger.exception("Seed failed")
        raise
