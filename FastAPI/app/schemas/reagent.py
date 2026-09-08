import json
from typing import List, Optional
from pydantic import BaseModel, field_validator


class ReagentOut(BaseModel):
    id: str
    name: str
    cat_number: str
    exp_date: str
    category: str
    category_label: str
    description: str
    substances: List[str]
    target_reaction: str
    color_hex: str
    color_gradient: str
    primary_match_name: str
    confidence_score: float
    delta_e: float
    peak_wavelength: str
    absorbance: str

    model_config = {"from_attributes": True}

    @field_validator("substances", mode="before")
    @classmethod
    def parse_substances(cls, v):
        """The DB stores substances as a JSON string; deserialize on read."""
        if isinstance(v, str):
            return json.loads(v)
        return v
