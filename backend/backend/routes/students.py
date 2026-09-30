"""Students CRUD. Duplicate emails -> 409. Skills normalized. Domain: @iiitdmj.ac.in only."""
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from sqlmodel import Session, select

from ..database import engine
from ..models import Student, normalize_tags

logger = logging.getLogger("teampilot")

router = APIRouter(prefix="/students", tags=["students"])


def _norm_email(email: str) -> str:
    e = str(email).strip().lower()
    if not e.endswith("@iiitdmj.ac.in"):
        raise HTTPException(status_code=400, detail="Email must be an @iiitdmj.ac.in address.")
    return e


@router.post("", status_code=status.HTTP_201_CREATED)
def create_student(payload: Student) -> Student:
    """Create student. 409 if email already exists. Domain @iiitdmj.ac.in required."""
    email = _norm_email(payload.email)
    if not email:
        raise HTTPException(status_code=400, detail="Email is required.")
    try:
        with Session(engine) as s:
            exists = s.exec(select(Student).where(Student.email == email)).first()
            if exists:
                raise HTTPException(status_code=409,
                                    detail="Email already registered: %s" % email)
            obj = Student(name=payload.name.strip(), email=email,
                          branch=payload.branch.strip(), year=payload.year,
                          skills=normalize_tags(payload.skills), bio=payload.bio)
            s.add(obj)
            s.commit()
            s.refresh(obj)
            logger.info("Student created id=%s email=%s", obj.id, email)
            return obj
    except HTTPException:
        raise
    except Exception:
        logger.exception("Create student failed")
        raise HTTPException(status_code=500, detail="Could not create student.")


@router.get("", response_model=List[Student])
def list_students() -> List[Student]:
    try:
        with Session(engine) as s:
            rows = s.exec(select(Student).order_by(Student.id)).all()
            return list(rows)
    except Exception:
        logger.exception("List students failed")
        raise HTTPException(status_code=500, detail="Could not list students.")


@router.get("/{student_id}")
def get_student(student_id: int) -> Student:
    try:
        with Session(engine) as s:
            obj = s.get(Student, student_id)
            if not obj:
                raise HTTPException(status_code=404, detail="Student not found.")
            return obj
    except HTTPException:
        raise
    except Exception:
        logger.exception("Get student failed")
        raise HTTPException(status_code=500, detail="Could not fetch student.")


@router.put("/{student_id}")
def update_student(student_id: int, payload: Student) -> Student:
    """Full update. 409 if new email belongs to another student."""
    try:
        with Session(engine) as s:
            obj = s.get(Student, student_id)
            if not obj:
                raise HTTPException(status_code=404, detail="Student not found.")
            email = _norm_email(payload.email)
            clash = s.exec(select(Student).where(Student.email == email)).first()
            if clash and clash.id != student_id:
                raise HTTPException(status_code=409,
                                    detail="Email already registered: %s" % email)
            obj.name = payload.name.strip()
            obj.email = email
            obj.branch = payload.branch.strip()
            obj.year = payload.year
            obj.skills = normalize_tags(payload.skills)
            obj.bio = payload.bio
            s.add(obj)
            s.commit()
            s.refresh(obj)
            logger.info("Student updated id=%s", student_id)
            return obj
    except HTTPException:
        raise
    except Exception:
        logger.exception("Update student failed")
        raise HTTPException(status_code=500, detail="Could not update student.")


@router.delete("/{student_id}")
def delete_student(student_id: int) -> dict:
    try:
        with Session(engine) as s:
            obj = s.get(Student, student_id)
            if not obj:
                raise HTTPException(status_code=404, detail="Student not found.")
            s.delete(obj)
            s.commit()
            logger.info("Student deleted id=%s", student_id)
            return {"deleted": student_id}
    except HTTPException:
        raise
    except Exception:
        logger.exception("Delete student failed")
        raise HTTPException(status_code=500, detail="Could not delete student.")
