"""Pure Jaccard matching. No ML deps. ML training lives in /ml (Colab, V2)."""
import logging
from typing import Dict, List

from ..models import normalize_tags

logger = logging.getLogger("teampilot")


def jaccard(a: List[str], b: List[str]) -> float:
    """Jaccard similarity = |A n B| / |A u B| as 0..1 fraction.

    Both lists are normalized (lowercase-trimmed) so 'React' == 'react '.
    Empty union (both empty) -> 0.0 to avoid ZeroDivisionError.
    """
    set_a = set(normalize_tags(a))
    set_b = set(normalize_tags(b))
    union = set_a | set_b
    if not union:
        return 0.0
    return len(set_a & set_b) / len(union)


def score_idea(student_skills: List[str], idea_tech: List[str]) -> Dict[str, object]:
    """Return pct score + matching/missing lists for one idea."""
    s = set(normalize_tags(student_skills))
    t = set(normalize_tags(idea_tech))
    matching = sorted(list(s & t))
    missing = sorted(list(t - s))
    pct = round(jaccard(student_skills, idea_tech) * 100.0, 1)
    return {"score": pct, "matching_skills": matching, "missing_skills": missing}
