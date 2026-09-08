import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_officer, get_db
from app.models.officer import Officer
from app.models.reagent import Reagent
from app.schemas.reagent import ReagentOut

router = APIRouter(prefix="/reagents", tags=["reagents"])


@router.get("/", response_model=list[ReagentOut])
def list_reagents(
    category: str | None = Query(default=None),
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
) -> list[Reagent]:
    reagents = db.query(Reagent).all()

    if category and category.lower() != "all":
        reagents = [reagent for reagent in reagents if reagent.category == category]

    if q:
        needle = q.lower().strip()

        def matches(reagent: Reagent) -> bool:
            substances = []
            if reagent.substances:
                try:
                    parsed = json.loads(reagent.substances)
                    if isinstance(parsed, list):
                        substances.extend(str(item) for item in parsed)
                except json.JSONDecodeError:
                    substances.append(reagent.substances)

            haystacks = [
                reagent.name,
                reagent.category or "",
                reagent.category_label or "",
                reagent.description or "",
                reagent.primary_match_name or "",
                reagent.target_reaction or "",
                " ".join(substances),
            ]
            return any(needle in value.lower() for value in haystacks)

        reagents = [reagent for reagent in reagents if matches(reagent)]

    reagents.sort(key=lambda reagent: reagent.name)
    return reagents


@router.get("/{reagent_id}", response_model=ReagentOut)
def get_reagent(
    reagent_id: str,
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
) -> Reagent:
    reagent = db.query(Reagent).filter(Reagent.id == reagent_id).first()
    if reagent is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reagent not found")
    return reagent

