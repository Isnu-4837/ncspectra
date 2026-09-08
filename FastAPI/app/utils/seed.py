"""
Seed the database with the exact same data that was previously in mockData.ts.
Called once at startup if the officers table is empty.
"""
import json
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.analysis_result import AnalysisResult
from app.models.officer import Officer
from app.models.reagent import Reagent
from app.models.seizure_record import SeizureRecord
from app.models.notification import Notification
from app.utils.security import hash_password


def seed_db(db: Session) -> None:
    # ── Guard: only seed once ─────────────────────────────────────────────────
    if db.query(Officer).first():
        return

    print("Seeding database with initial NCSpectra data...")

    # ── Officer ───────────────────────────────────────────────────────────────
    officer = Officer(
        badge_number="NCB-DEL-9842",
        name="Officer Sharma",
        zone="NCB Delhi Zone",
        division="Special Enforcement Branch",
        rank="Sub-Inspector",
        unit="Special Enforcement Branch",
        status="ACTIVE",
        device_model="Pixel 8 Tactical (Hardened OS)",
        encryption_standard="256-Bit Hardware AES",
        battery_percent=84,
        gps_accuracy="+/-3m",
        offline_ready=True,
        hashed_password=hash_password("tactical-auth-2024"),
    )
    db.add(officer)
    db.flush()  # get officer.id before inserting records

    # ── Reagents ──────────────────────────────────────────────────────────────
    reagents_data = [
        {
            "id": "marquis",
            "name": "Marquis Reagent",
            "cat_number": "CAT #R-01",
            "exp_date": "11/2025",
            "category": "opiates",
            "category_label": "Opiates",
            "description": "General Screening / Opiate Derivatives",
            "substances": json.dumps(["Morphine", "Heroin", "Codeine", "MDMA"]),
            "target_reaction": "Violet / Purple",
            "color_hex": "#3D165E",
            "color_gradient": "linear-gradient(to right, #4C1D95, #2E1065, #1E1B4B)",
            "primary_match_name": "HEROIN HYDROCHLORIDE",
            "confidence_score": 86.4,
            "delta_e": 8.4,
            "peak_wavelength": "546.2 nm",
            "absorbance": "0.84 A",
        },
        {
            "id": "scott",
            "name": "Scott Reagent",
            "cat_number": "CAT #R-04",
            "exp_date": "08/2025",
            "category": "stimulants",
            "category_label": "Cocaine",
            "description": "Cocaine Specific Field Test",
            "substances": json.dumps(["Cocaine HCl", "Crack Base"]),
            "target_reaction": "Cobalt Blue",
            "color_hex": "#0284C7",
            "color_gradient": "linear-gradient(to right, #0284C7, #1D4ED8)",
            "primary_match_name": "COCAINE HYDROCHLORIDE",
            "confidence_score": 91.8,
            "delta_e": 6.2,
            "peak_wavelength": "620.4 nm",
            "absorbance": "0.91 A",
        },
        {
            "id": "mandelin",
            "name": "Mandelin Reagent",
            "cat_number": "CAT #R-07",
            "exp_date": "02/2026",
            "category": "stimulants",
            "category_label": "Amphetamines",
            "description": "Amphetamines & Ketamine Screening",
            "substances": json.dumps(["Methamphetamine", "Ketamine", "Amphetamine Sulfate"]),
            "target_reaction": "Olive / Red-Brown",
            "color_hex": "#3F6212",
            "color_gradient": "linear-gradient(to right, #3F6212, #5A3E1B, #78350F)",
            "primary_match_name": "METHAMPHETAMINE HCl",
            "confidence_score": 78.5,
            "delta_e": 14.1,
            "peak_wavelength": "495.1 nm",
            "absorbance": "0.67 A",
        },
        {
            "id": "duquenois",
            "name": "Duquenois-Levine",
            "cat_number": "CAT #R-11",
            "exp_date": "12/2025",
            "category": "cannabinoids",
            "category_label": "Cannabinoids",
            "description": "THC & Cannabinoid Confirmation",
            "substances": json.dumps(["Cannabis Sativa", "THC Concentrates", "Hashish Oil"]),
            "target_reaction": "Violet-Indigo",
            "color_hex": "#581C87",
            "color_gradient": "linear-gradient(to right, #581C87, #0F172A)",
            "primary_match_name": "DELTA-9-TETRAHYDROCANNABINOL",
            "confidence_score": 89.2,
            "delta_e": 7.9,
            "peak_wavelength": "565.0 nm",
            "absorbance": "0.78 A",
        },
        {
            "id": "ehrlich",
            "name": "Ehrlich / Hofmann",
            "cat_number": "CAT #R-14",
            "exp_date": "09/2025",
            "category": "synthetics",
            "category_label": "Synthetics",
            "description": "Indoles & Hallucinogens",
            "substances": json.dumps(["LSD-25 Blotter", "Psilocybin", "DMT / Tryptamines"]),
            "target_reaction": "Magenta-Purple",
            "color_hex": "#A21CAF",
            "color_gradient": "linear-gradient(to right, #A21CAF, #C026D3, #86198F)",
            "primary_match_name": "LYSERGIC ACID DIETHYLAMIDE (LSD)",
            "confidence_score": 94.7,
            "delta_e": 4.8,
            "peak_wavelength": "590.3 nm",
            "absorbance": "0.88 A",
        },
    ]
    for r in reagents_data:
        db.add(Reagent(**r))

    # ── Seizure Records ───────────────────────────────────────────────────────
    records_data = [
        {
            "id": "ncb-891",
            "case_number": "#NCB-2024-0891",
            "officer_id": officer.id,
            "officer_name": officer.name,
            "officer_badge_number": officer.badge_number,
            "reagent_name": "MARQUIS",
            "location": "IGI Cargo Terminal 3, Air Courier Wing",
            "live_location": "IGI Cargo Terminal 3, Air Courier Wing",
            "image_name": "marquis_capture_20241028_085210.jpg",
            "status": "POSITIVE",
            "compound_name": "HEROIN",
            "match_score": "94.2% Match",
            "accent_color": "#ba1a1a",
            "custodian_id": "OFFICER #DEL-9842",
            "evidence_seal": "#NC-8891-EVD",
            "sha256": "9f83a2d1e4c7b8045f319208aef7210e7b419c8d5029b3f46182a932d01e9124",
            "timestamp_utc": datetime.fromisoformat("2024-10-28T08:52:10"),
            "lat": 28.5562,
            "lng": 77.1,
            "location_label": "IGI Cargo Terminal 3",
            "synced_at": datetime.fromisoformat("2024-10-28T10:00:00"),
        },
        {
            "id": "ncb-889",
            "case_number": "#NCB-2024-0889",
            "officer_id": officer.id,
            "officer_name": officer.name,
            "officer_badge_number": officer.badge_number,
            "reagent_name": "SCOTT REAGENT",
            "location": "Paharganj Sector 4, Transit Checkpoint",
            "live_location": "Paharganj Sector 4, Transit Checkpoint",
            "image_name": "scott_capture_20241028_053512.jpg",
            "status": "POSITIVE",
            "compound_name": "COCAINE HCl",
            "match_score": "91.8% Match",
            "accent_color": "#505f76",
            "custodian_id": "OFFICER #DEL-9842",
            "evidence_seal": "#NC-8889-EVD",
            "sha256": "a12bc904f8491e0a29ef182a3920cda45e783910c2834b91823901aef04829bc",
            "timestamp_utc": datetime.fromisoformat("2024-10-28T05:35:12"),
            "lat": 28.6433,
            "lng": 77.2141,
            "location_label": "Paharganj Sector 4",
            "synced_at": datetime.fromisoformat("2024-10-28T10:00:00"),
        },
        {
            "id": "ncb-884",
            "case_number": "#NCB-2024-0884",
            "officer_id": officer.id,
            "officer_name": officer.name,
            "officer_badge_number": officer.badge_number,
            "reagent_name": "MANDELIN",
            "location": "Seelampur Logistics Hub Yard 2",
            "live_location": "Seelampur Logistics Hub Yard 2",
            "image_name": "mandelin_capture_20241027_164500.jpg",
            "status": "INCONCLUSIVE",
            "compound_name": "RETEST",
            "match_score": "Delta > 0.45",
            "accent_color": "#005823",
            "custodian_id": "OFFICER #DEL-9842",
            "evidence_seal": "#NC-8884-EVD",
            "sha256": "7c82a104b293847a9f18234892cfa71b8293c04819230a1bf82934819a82341b",
            "timestamp_utc": datetime.fromisoformat("2024-10-27T16:45:00"),
            "lat": 28.6692,
            "lng": 77.2731,
            "location_label": "Seelampur Logistics Yard",
            "synced_at": None,
        },
    ]
    for rec in records_data:
        db.add(SeizureRecord(**rec))

    analysis_results_data = [
        {
            "record_id": "ncb-891",
            "reagent_id": "marquis",
            "spectral_match": 94.2,
            "purity_index": 89.1,
            "confidence": 97.3,
            "std_dev": 0.03,
            "reaction_threshold_exceeded": True,
            "peak_wavelength": "546.2 nm",
            "absorbance": "0.84 A",
            "raw_delta_e": 8.4,
            "created_at": datetime.fromisoformat("2024-10-28T08:52:10"),
        },
        {
            "record_id": "ncb-889",
            "reagent_id": "scott",
            "spectral_match": 91.8,
            "purity_index": 88.0,
            "confidence": 96.4,
            "std_dev": 0.03,
            "reaction_threshold_exceeded": True,
            "peak_wavelength": "620.4 nm",
            "absorbance": "0.91 A",
            "raw_delta_e": 6.2,
            "created_at": datetime.fromisoformat("2024-10-28T05:35:12"),
        },
        {
            "record_id": "ncb-884",
            "reagent_id": "mandelin",
            "spectral_match": 78.5,
            "purity_index": 73.0,
            "confidence": 82.1,
            "std_dev": 0.06,
            "reaction_threshold_exceeded": False,
            "peak_wavelength": "495.1 nm",
            "absorbance": "0.67 A",
            "raw_delta_e": 14.1,
            "created_at": datetime.fromisoformat("2024-10-27T16:45:00"),
        },
    ]
    for result in analysis_results_data:
        db.add(AnalysisResult(**result))

    # ── Notifications ─────────────────────────────────────────────────────────
    now = datetime.now()
    notifs = [
        {"id": "n1", "officer_id": officer.id, "icon": "sync", "title": "Vault Sync Complete",
         "description": "42 records synced to central evidence server.", "time_display": "2m ago",
         "unread": True, "color": "#56d474", "created_at": now - timedelta(minutes=2)},
        {"id": "n2", "officer_id": officer.id, "icon": "warning", "title": "Reagent Calibration Due",
         "description": "Marquis Reagent kit is due for recalibration.", "time_display": "1h ago",
         "unread": True, "color": "#f5c451", "created_at": now - timedelta(hours=1)},
        {"id": "n3", "officer_id": officer.id, "icon": "gps_fixed", "title": "GPS Lock Reacquired",
         "description": "Location services restored after signal drop.", "time_display": "3h ago",
         "unread": True, "color": "#93ccff", "created_at": now - timedelta(hours=3)},
        {"id": "n4", "officer_id": officer.id, "icon": "menu_book", "title": "SOP Updated",
         "description": "Field Guide protocol manual updated to v4.2.", "time_display": "Yesterday",
         "unread": False, "color": "#93ccff", "created_at": now - timedelta(days=1)},
        {"id": "n5", "officer_id": officer.id, "icon": "verified_user", "title": "Certification Renewed",
         "description": "Your Field Analyst certification was renewed.", "time_display": "3 days ago",
         "unread": False, "color": "#4edea3", "created_at": now - timedelta(days=3)},
    ]
    for n in notifs:
        db.add(Notification(**n))

    db.commit()
    print("Database seeded successfully.")
