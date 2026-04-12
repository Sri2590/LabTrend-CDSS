from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db, PatientDB, LabResultDB, CustomTestDB
from app.routers.tests import BUILTIN_TESTS

router = APIRouter()

def get_full_catalog(db: Session) -> dict:
    catalog = {t["name"]: t for t in BUILTIN_TESTS}
    for c in db.query(CustomTestDB).all():
        catalog[str(c.name)] = {
            "name": str(c.name),
            "unit": str(c.unit),
            "reference_range": str(c.reference_range),
        }
    return catalog

def severity_for_bp(test_name: str, value: float):
    if test_name == "Systolic BP":
        if value >= 180: return "High"
        if value >= 140: return "High"
        if value >= 120: return "Medium"
        if value < 90:   return "Medium"
        return None
    elif test_name == "Diastolic BP":
        if value >= 120: return "High"
        if value >= 90:  return "High"
        if value >= 80:  return "Medium"
        if value < 60:   return "Medium"
        return None
    return None

def severity_for(test_name: str, value: float, catalog: dict):
    # Route BP through dedicated staging
    if test_name in ("Systolic BP", "Diastolic BP"):
        return severity_for_bp(test_name, value)

    t = catalog.get(test_name)
    if not t:
        return None
    ref = t["reference_range"]
    try:
        if ref.startswith("<"):
            threshold = float(ref[1:])
            if value >= threshold * 1.15: return "High"
            if value >= threshold:        return "Medium"
        elif ref.startswith(">"):
            threshold = float(ref[1:])
            if value < threshold * 0.75:  return "High"
            if value < threshold:         return "Medium"
        elif "-" in ref:
            lo, hi = map(float, ref.split("-"))
            margin = (hi - lo) * 0.15
            if value > hi + margin or value < lo - margin: return "High"
            if value > hi or value < lo:                   return "Medium"
    except Exception:
        pass
    return None

@router.get("/")
def get_alerts(db: Session = Depends(get_db)):
    catalog = get_full_catalog(db)
    alerts = []
    alert_id = 1

    for patient in db.query(PatientDB).all():
        results = db.query(LabResultDB).filter(LabResultDB.patient_id == patient.id).all()
        latest = {}
        for r in results:
            if r.test_name not in latest or str(r.date) > str(latest[r.test_name].date):
                latest[r.test_name] = r

        for test_name, r in latest.items():
            sev = severity_for(str(r.test_name), float(r.result_value), catalog)
            if sev:
                alerts.append({
                    "id": alert_id,
                    "patient": str(patient.name),
                    "patient_id": str(patient.id),
                    "message": f"{r.test_name} at {r.result_value} {r.unit} — {sev.lower()} risk threshold",
                    "severity": sev,
                    "time": str(r.date),
                })
                alert_id += 1

    alerts.sort(key=lambda a: ["Low", "Medium", "High"].index(a["severity"]), reverse=True)
    return alerts