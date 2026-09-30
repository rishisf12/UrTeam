# ML (V2 upgrade) — kept separate from the backend.

- Model training happens on Google Colab, NOT in FastAPI.
- Backend matching is pure Jaccard (`backend/backend/services/matching_service.py`).
- Put your `.ipynb` here later. Nothing in `backend/` may import from `ml/`.
