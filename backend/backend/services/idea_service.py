"""Helpers for join flow. Full = accepted count >= team_size_needed."""
import logging
from sqlmodel import Session, select

from ..models import TeamRequest

logger = logging.getLogger("teampilot")


def count_accepted(s: Session, idea_id: int) -> int:
    rows = s.exec(select(TeamRequest).where(
        TeamRequest.idea_id == idea_id, TeamRequest.status == "accepted")).all()
    return len(list(rows))


def is_full(s: Session, idea_id: int, team_size_needed: int) -> bool:
    return count_accepted(s, idea_id) >= team_size_needed
