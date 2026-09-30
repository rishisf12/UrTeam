"""SQLModel tables. Skills/tech_stack normalized to lowercase-trimmed."""
import datetime
from typing import List, Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


def normalize_tags(values: List[str]) -> List[str]:
    """Lowercase + trim each tag, drop empties. 'React ' and 'react' match."""
    cleaned: List[str] = []
    for v in values or []:
        t = str(v).strip().lower()
        if t and t not in cleaned:
            cleaned.append(t)
    return cleaned


class Student(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(unique=True, index=True, max_length=200)
    branch: str = Field(default="", max_length=100)
    year: int = Field(default=1, ge=1, le=6)
    skills: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    bio: str = Field(default="", max_length=1000)


class Idea(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    tech_stack: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    team_size_needed: int = Field(default=3, ge=1, le=20)
    owner_id: Optional[int] = Field(default=None, foreign_key="student.id")
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    is_open: bool = Field(default=True)


class TeamRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    idea_id: int = Field(foreign_key="idea.id")
    student_id: int = Field(foreign_key="student.id")
    status: str = Field(default="pending", max_length=20)


class ChatRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    idea_id: int = Field(foreign_key="idea.id")
    student_id: int = Field(foreign_key="student.id")
    status: str = Field(default="pending", max_length=20)  # pending | approved


class ChatMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    idea_id: int = Field(foreign_key="idea.id")
    student_id: int = Field(foreign_key="student.id")
    text: str = Field(default="", max_length=500)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
