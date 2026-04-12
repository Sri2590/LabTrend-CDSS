from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.schemas.risk import RiskAssessment, RiskScore
from app.database import get_db, PatientDB, LabResultDB, CustomTestDB
from app.routers.tests import BUILTIN_TESTS

router = APIRouter()

DISEASE_MAP = {
    "HbA1c":                 "Type 2 Diabetes Risk",
    "Fasting Glucose":        "Type 2 Diabetes Risk",
    "Post-Prandial Glucose":  "Type 2 Diabetes Risk",
    "eGFR":                   "CKD Risk",
    "Serum Creatinine":       "CKD Risk",
    "Blood Urea Nitrogen":    "CKD Risk",
    "Urine Albumin":          "CKD Risk",
    "Systolic BP":            "Hypertension Risk",
    "Diastolic BP":           "Hypertension Risk",
    "Total Cholesterol":      "Cardiovascular Risk",
    "LDL Cholesterol":        "Cardiovascular Risk",
    "HDL Cholesterol":        "Cardiovascular Risk",
    "Triglycerides":          "Cardiovascular Risk",
    "Serum Potassium":        "Electrolyte Imbalance Risk",
    "Serum Sodium":           "Electrolyte Imbalance Risk",
    "TSH":                    "Thyroid Risk",
    "BMI":                    "Metabolic Risk",
}

def get_full_catalog(db: Session) -> dict:
    """Returns merged dict of built-in + custom tests by name."""
    catalog = {t["name"]: t for t in BUILTIN_TESTS}
    for c in db.query(CustomTestDB).all():
        catalog[str(c.name)] = {
            "name": str(c.name),
            "unit": str(c.unit),
            "reference_range": str(c.reference_range),
        }
    return catalog

def evaluate_bp(test_name: str, value: float, unit: str):
    """
    Implements clinical BP staging per AHA guidelines.
    Systolic:  <120 Normal, 120-129 Elevated, 130-139 Stage1, >=140 Stage2, >=180 Crisis
    Diastolic: <80  Normal, 80-89   Stage1,   >=90    Stage2, >=120 Crisis
    Low BP:    Systolic <90 or Diastolic <60 = Hypotension
    """
    if test_name == "Systolic BP":
        if value >= 180:
            return "High",   f"Systolic BP at {value} mmHg — Hypertensive Crisis (≥180 mmHg), immediate medical attention required"
        elif value >= 140:
            return "High",   f"Systolic BP at {value} mmHg — Stage 2 Hypertension (≥140 mmHg), medical management required"
        elif value >= 130:
            return "Medium", f"Systolic BP at {value} mmHg — Stage 1 Hypertension (130–139 mmHg), lifestyle changes advised"
        elif value > 120:
            return "Medium", f"Systolic BP at {value} mmHg — Elevated BP (120–129 mmHg), lifestyle changes recommended"
        elif value < 90:
            return "Medium", f"Systolic BP at {value} mmHg — Hypotension (<90 mmHg), may indicate low blood pressure"
        else:
            return "Low",    f"Systolic BP at {value} mmHg — Normal (<120 mmHg)"

    elif test_name == "Diastolic BP":
        if value >= 120:
            return "High",   f"Diastolic BP at {value} mmHg — Hypertensive Crisis (≥120 mmHg), immediate medical attention required"
        elif value >= 90:
            return "High",   f"Diastolic BP at {value} mmHg — Stage 2 Hypertension (≥90 mmHg), medical management required"
        elif value > 80:
            return "Medium", f"Diastolic BP at {value} mmHg — Stage 1 Hypertension (80–89 mmHg), lifestyle changes advised"
        elif value < 60:
            return "Medium", f"Diastolic BP at {value} mmHg — Hypotension (<60 mmHg), may indicate low blood pressure"
        else:
            return "Low",    f"Diastolic BP at {value} mmHg — Normal (<80 mmHg)"

    return None, None

def evaluate(test_name: str, value: float, unit: str, catalog: dict):
    # BP tests use clinical staging logic
    if test_name in ("Systolic BP", "Diastolic BP"):
        return evaluate_bp(test_name, value, unit)

    t = catalog.get(test_name)
    if not t:
        return None, None
    ref = t["reference_range"]
    try:
        if ref.startswith("<"):
            threshold = float(ref[1:])
            if value >= threshold * 2.0:
                return "High",   f"{test_name} at {value} {unit} significantly exceeds threshold of {ref} {unit}"
            elif value >= threshold:
                return "Medium", f"{test_name} at {value} {unit} exceeds threshold of {ref} {unit}"
            else:
                return "Low",    f"{test_name} at {value} {unit} is within normal range (threshold {ref} {unit})"

        elif ref.startswith(">"):
            threshold = float(ref[1:])
            if value < threshold * 0.75:
                return "High",   f"{test_name} at {value} {unit} is critically below threshold of {ref} {unit}"
            elif value < threshold:
                return "Medium", f"{test_name} at {value} {unit} is below threshold of {ref} {unit}"
            else:
                return "Low",    f"{test_name} at {value} {unit} is within normal range (threshold {ref} {unit})"

        elif "-" in ref:
            lo, hi = map(float, ref.split("-"))
            margin = (hi - lo) * 0.15
            if value > hi + margin or value < lo - margin:
                return "High",   f"{test_name} at {value} {unit} is outside safe range ({ref} {unit})"
            elif value > hi or value < lo:
                return "Medium", f"{test_name} at {value} {unit} is outside normal range ({ref} {unit})"
            else:
                return "Low",    f"{test_name} at {value} {unit} is within normal range ({ref} {unit})"

    except Exception:
        pass
    return None, None

@router.get("/{patient_id}", response_model=RiskAssessment)
def get_risk(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(PatientDB).filter(PatientDB.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    results = db.query(LabResultDB).filter(LabResultDB.patient_id == patient_id).all()
    if not results:
        raise HTTPException(status_code=404, detail="No lab results found for this patient")

    catalog = get_full_catalog(db)

    # Get latest result per test
    latest = {}
    for r in results:
        if r.test_name not in latest or str(r.date) > str(latest[r.test_name].date):
            latest[r.test_name] = r

    # Group by disease
    disease_scores: dict = {}
    for test_name, r in latest.items():
        level, reason = evaluate(str(r.test_name), float(r.result_value), str(r.unit), catalog)
        if not level:
            continue
        disease = DISEASE_MAP.get(str(r.test_name), "Other")
        if disease not in disease_scores:
            disease_scores[disease] = []
        disease_scores[disease].append((level, reason))

    if not disease_scores:
        raise HTTPException(status_code=404, detail="No recognised test results found for risk computation")

    priority = {"High": 2, "Medium": 1, "Low": 0}
    scores = []
    all_levels = []

    for disease, entries in disease_scores.items():
        worst = max(entries, key=lambda e: priority[e[0]])
        scores.append(RiskScore(disease=disease, risk=worst[0], reason=worst[1]))
        all_levels.append(worst[0])

    overall = "High" if "High" in all_levels else "Medium" if "Medium" in all_levels else "Low"

    # ── Persist updated risk back to patient record ──────────
    patient.risk = str(overall) # type: ignore
    db.commit()

    return RiskAssessment(patient=str(patient.name), overall_risk=overall, scores=scores)