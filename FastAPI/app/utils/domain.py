from __future__ import annotations

import hashlib
import re
from datetime import datetime, timedelta
from typing import Iterable

from app.models.reagent import Reagent


def next_numeric_suffix(values: Iterable[str], prefix: str) -> int:
    pattern = re.compile(rf"^{re.escape(prefix)}(\d+)$")
    max_suffix = 0
    for value in values:
        if not value:
            continue
        match = pattern.match(value)
        if match:
            max_suffix = max(max_suffix, int(match.group(1)))
    return max_suffix + 1


def build_record_id(sequence: int) -> str:
    return f"ncb-{sequence}"


def build_case_number(sequence: int, created_at: datetime | None = None) -> str:
    year = (created_at or datetime.now()).year
    return f"#NCB-{year}-{sequence:04d}"


def build_notification_id(sequence: int) -> str:
    return f"n{sequence}"


def build_custodian_id(badge_number: str) -> str:
    suffix = badge_number.split("-")[-1] if badge_number else "UNKNOWN"
    return f"OFFICER #{suffix}"


def build_image_name(seed: str, created_at: datetime | None = None) -> str:
    stamp = (created_at or datetime.now()).strftime("%Y%m%d_%H%M%S")
    slug = re.sub(r"[^a-z0-9]+", "-", seed.lower()).strip("-") or "capture"
    return f"{slug}_{stamp}.jpg"


def build_sha256(parts: Iterable[str]) -> str:
    payload = "|".join(str(part) for part in parts).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def build_time_display(created_at: datetime, now: datetime | None = None) -> str:
    now = now or datetime.now()
    delta = now - created_at
    if delta < timedelta(minutes=1):
        return "Just now"
    if delta < timedelta(hours=1):
        return f"{max(1, int(delta.total_seconds() // 60))}m ago"
    if delta < timedelta(days=1):
        return f"{max(1, int(delta.total_seconds() // 3600))}h ago"
    if delta < timedelta(days=2):
        return "Yesterday"
    return f"{delta.days} days ago"


def derive_analysis_metrics(
    reagent: Reagent,
    override_status: str | None = None,
    override_compound_name: str | None = None,
    override_spectral_match: float | None = None,
    override_confidence: float | None = None,
    override_purity_index: float | None = None,
    override_match_score: str | None = None,
) -> dict[str, object]:
    if override_status:
        status = override_status.upper()
        if status == "NEGATIVE":
            spectral_match = override_spectral_match if override_spectral_match is not None else 12.4
            confidence = override_confidence if override_confidence is not None else 14.8
            purity_index = override_purity_index if override_purity_index is not None else 5.0
            match_score = override_match_score or f"{spectral_match:.1f}% No Match"
            compound_name = override_compound_name or "NO CONTROLLED SUBSTANCE DETECTED"
            reaction_threshold_exceeded = False
            std_dev = 0.65
            delta_e = 48.2
        elif status == "INCONCLUSIVE":
            spectral_match = override_spectral_match if override_spectral_match is not None else 68.5
            confidence = override_confidence if override_confidence is not None else 72.1
            purity_index = override_purity_index if override_purity_index is not None else 45.0
            match_score = override_match_score or "Delta > 18.4"
            compound_name = override_compound_name or f"INCONCLUSIVE ({reagent.name})"
            reaction_threshold_exceeded = False
            std_dev = 0.35
            delta_e = 18.4
        else:
            status = "POSITIVE"
            spectral_match = override_spectral_match if override_spectral_match is not None else 91.2
            confidence = override_confidence if override_confidence is not None else 94.1
            purity_index = override_purity_index if override_purity_index is not None else 88.7
            match_score = override_match_score or f"{spectral_match:.1f}% Match"
            compound_name = override_compound_name or reagent.primary_match_name or reagent.name
            reaction_threshold_exceeded = True
            std_dev = 0.03
            delta_e = 0.42
    else:
        base_confidence = float(reagent.confidence_score or 80.0)
        delta_e = float(reagent.delta_e or 0.0)

        spectral_match = round(min(99.8, max(70.0, base_confidence + 4.2)), 1)
        purity_index = round(min(98.5, max(55.0, base_confidence - 2.5)), 1)
        confidence = round(min(99.8, max(60.0, base_confidence + 7.1)), 1)
        std_dev = round(max(0.01, min(0.08, delta_e / 240)), 2)
        reaction_threshold_exceeded = delta_e <= 10.0

        if confidence >= 90 and reaction_threshold_exceeded:
            status = "POSITIVE"
        elif confidence >= 75:
            status = "INCONCLUSIVE"
        else:
            status = "NEGATIVE"

        compound_name = reagent.primary_match_name or reagent.name
        if status == "POSITIVE":
            match_score = f"{spectral_match:.1f}% Match"
        elif status == "INCONCLUSIVE":
            match_score = f"Delta > {delta_e:.2f}"
        else:
            match_score = f"{spectral_match:.1f}% No Match"

    compound_class = reagent.category_label or reagent.category or "Unknown"
    peak_wavelength = reagent.peak_wavelength or "0.0 nm"
    absorbance = reagent.absorbance or "0.00 A"

    return {
        "compound_name": compound_name,
        "compound_class": compound_class,
        "spectral_match": spectral_match,
        "purity_index": purity_index,
        "confidence": confidence,
        "std_dev": std_dev,
        "reaction_threshold_exceeded": reaction_threshold_exceeded,
        "peak_wavelength": peak_wavelength,
        "absorbance": absorbance,
        "raw_delta_e": round(delta_e, 1),
        "status": status,
        "match_score": match_score,
    }
