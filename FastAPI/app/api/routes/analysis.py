from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_officer, get_db
from app.models.analysis_result import AnalysisResult
from app.models.officer import Officer
from app.models.reagent import Reagent
from app.models.seizure_record import SeizureRecord
from app.schemas.analysis import AnalysisRequest, AnalysisResultOut
from app.utils.domain import (
    build_case_number,
    build_custodian_id,
    build_image_name,
    build_record_id,
    build_sha256,
    derive_analysis_metrics,
    next_numeric_suffix,
)

router = APIRouter(prefix="/analysis", tags=["analysis"])


def _build_analysis_response(
    record: SeizureRecord,
    reagent: Reagent,
    analysis: AnalysisResult,
) -> AnalysisResultOut:
    return AnalysisResultOut(
        case_id=record.case_number.lstrip("#"),
        sha256=record.sha256,
        compound_name=analysis.record.compound_name,
        compound_class=reagent.category_label or reagent.category or "Unknown",
        spectral_match=analysis.spectral_match or 0.0,
        purity_index=analysis.purity_index or 0.0,
        confidence=analysis.confidence or 0.0,
        std_dev=analysis.std_dev or 0.0,
        reaction_threshold_exceeded=bool(analysis.reaction_threshold_exceeded),
        peak_wavelength=analysis.peak_wavelength or reagent.peak_wavelength or "0.0 nm",
        absorbance=analysis.absorbance or reagent.absorbance or "0.00 A",
        delta_e=analysis.raw_delta_e or 0.0,
        status=record.status,
        reagent_name=reagent.name,
        reagent_id=reagent.id,
        officer_name=record.officer_name,
        officer_badge_number=record.officer_badge_number,
        live_location=record.live_location or record.location,
        image_name=record.image_name,
        timestamp_utc=record.timestamp_utc.isoformat(),
    )


@router.post("/", response_model=AnalysisResultOut)
def run_analysis(
    payload: AnalysisRequest,
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
) -> AnalysisResultOut:
    requested_badge = payload.officer_badge.strip().upper()
    if requested_badge and requested_badge != current_officer.badge_number:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Officer badge does not match the authenticated user",
        )

    reagent = db.query(Reagent).filter(Reagent.id == payload.reagent_id).first()
    if reagent is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reagent not found")

    metrics = derive_analysis_metrics(reagent)
    now = datetime.now()
    sequence = next_numeric_suffix((row[0] for row in db.query(SeizureRecord.id).all()), "ncb-")
    live_location = payload.live_location or payload.location or "DEL-NORTH-HQ"
    image_name = payload.image_name or build_image_name(reagent.name, now)

    record = SeizureRecord(
        id=build_record_id(sequence),
        case_number=build_case_number(sequence, now),
        officer_id=current_officer.id,
        officer_name=payload.officer_name or current_officer.name,
        officer_badge_number=current_officer.badge_number,
        reagent_name=reagent.name.upper(),
        location=live_location,
        live_location=live_location,
        image_name=image_name,
        status=metrics["status"],
        compound_name=metrics["compound_name"],
        match_score=metrics["match_score"],
        accent_color=reagent.color_hex or "#ba1a1a",
        custodian_id=build_custodian_id(current_officer.badge_number),
        evidence_seal=f"#NC-{sequence:04d}-EVD",
        sha256=build_sha256(
            [
                current_officer.badge_number,
                current_officer.name,
                reagent.id,
                live_location,
                image_name,
                now.isoformat(),
                str(metrics["spectral_match"]),
                str(metrics["confidence"]),
            ]
        ),
        timestamp_utc=now,
        lat=payload.lat,
        lng=payload.lng,
        location_label=live_location,
        synced_at=None,
    )

    analysis = AnalysisResult(
        record=record,
        reagent_id=reagent.id,
        spectral_match=metrics["spectral_match"],
        purity_index=metrics["purity_index"],
        confidence=metrics["confidence"],
        std_dev=metrics["std_dev"],
        reaction_threshold_exceeded=metrics["reaction_threshold_exceeded"],
        peak_wavelength=metrics["peak_wavelength"],
        absorbance=metrics["absorbance"],
        raw_delta_e=metrics["raw_delta_e"],
    )

    db.add_all([record, analysis])
    db.commit()
    db.refresh(record)
    db.refresh(analysis)

    return _build_analysis_response(record, reagent, analysis)


@router.get("/{record_id}", response_model=AnalysisResultOut)
def get_analysis(
    record_id: str,
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
) -> AnalysisResultOut:
    record = (
        db.query(SeizureRecord)
        .filter(
            SeizureRecord.id == record_id,
            SeizureRecord.officer_id == current_officer.id,
        )
        .first()
    )
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    analysis = db.query(AnalysisResult).filter(AnalysisResult.record_id == record.id).first()
    if analysis is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

    reagent = db.query(Reagent).filter(Reagent.id == analysis.reagent_id).first()
    if reagent is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reagent not found")

    return _build_analysis_response(record, reagent, analysis)
