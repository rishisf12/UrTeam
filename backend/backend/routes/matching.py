"""GET /match/{student_id}: rank ideas by Jaccard skill overlap."""
import logging
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
from sqlmodel import Session, select

from ..database import engine
from ..models import Idea, Student
from ..services.matching_service import score_idea

logger = logging.getLogger("teampilot")
router = APIRouter(tags=["matching"])


@router.get("/match/{student_id}")
def match_student(student_id: int) -> Dict[str, Any]:
    """Rank ideas (excluding own) by Jaccard score desc. 404 if no student."""
    try:
        with Session(engine) as s:
            student = s.get(Student, student_id)
            if not student:
                raise HTTPException(status_code=404, detail="Student not found.")
            ideas = list(s.exec(select(Idea).order_by(Idea.id)).all())
            out: List[Dict[str, Any]] = []
            for idea in ideas:
                if idea.owner_id == student_id:
                    continue
                sc = score_idea(student.skills or [], idea.tech_stack or [])
                out.append({"idea_id": idea.id, "title": idea.title,
                            "tech_stack": idea.tech_stack, "is_open": idea.is_open,
                            "owner_id": idea.owner_id, "score": sc["score"],
                            "matching_skills": sc["matching_skills"],
                            "missing_skills": sc["missing_skills"]})
            out.sort(key=lambda m: (-float(m["score"]), int(m["idea_id"])))
            logger.info("Match student=%s ideas=%d", student_id, len(out))
            return {"student_id": student_id, "student_skills": student.skills,
                    "matches": out}
    except HTTPException:
        raise
    except Exception:
        logger.exception("Match failed")
        raise HTTPException(status_code=500, detail="Could not compute matches.")
