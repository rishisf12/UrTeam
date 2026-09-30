"""Unit tests for Jaccard. Run: py -3.10 -m pytest -q"""
from backend.services.matching_service import jaccard, score_idea


def test_identical_sets() -> None:
    assert jaccard(["python", "react"], ["python", "react"]) == 1.0


def test_disjoint_sets() -> None:
    assert jaccard(["python"], ["react"]) == 0.0


def test_empty_sets() -> None:
    assert jaccard([], []) == 0.0
    assert jaccard(["python"], []) == 0.0
    assert jaccard([], ["python"]) == 0.0


def test_case_and_space_differences() -> None:
    assert jaccard(["React", "react ", " REACT"], ["react"]) == 1.0
    out = score_idea(["Python", " SQL "], ["python", "react"])
    assert out["score"] == round(1 / 3 * 100, 1)
    assert out["matching_skills"] == ["python"]
    assert out["missing_skills"] == ["react"]
