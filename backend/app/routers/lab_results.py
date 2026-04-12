from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from app.schemas.lab_result import LabResult, LabResultCreate, BulkLabResultRequest, BulkLabResultResponse
from app.database import get_db, PatientDB, LabResultDB
from app import store
import uuid

router = APIRouter()

def recompute_patient_risk(patient_id: str, db: Session):
    """Recomputes and persists risk for a patient after new lab results are added."""
    from app.routers.risk import get_full_catalog, evaluate, DISEASE_MAP
    
    patient = db.query(PatientDB).filter(PatientDB.id == patient_id).first()
    if not patient:
        return

    results = db.query(LabResultDB).filter(LabResultDB.patient_id == patient_id).all()
    if not results:
        return

    catalog = get_full_catalog(db)

    latest = {}
    for r in results:
        if r.test_name not in latest or str(r.date) > str(latest[r.test_name].date):
            latest[r.test_name] = r

    all_levels = []
    for test_name, r in latest.items():
        level, _ = evaluate(str(r.test_name), float(r.result_value), str(r.unit), catalog)
        if level:
            all_levels.append(level)

    if not all_levels:
        return

    overall = "High" if "High" in all_levels else "Medium" if "Medium" in all_levels else "Low"
    patient.risk = overall  # type: ignore
    db.commit()

def ensure_patient_exists(patient_id: str, db: Session):
    if not db.query(PatientDB).filter(PatientDB.id == patient_id).first():
        db.add(PatientDB(id=patient_id, name=f"Patient {patient_id}", age=0, gender="U", risk="Unknown"))
        db.commit()

@router.get("/{patient_id}", response_model=List[LabResult])
def get_lab_results(patient_id: str, db: Session = Depends(get_db)):
    return db.query(LabResultDB).filter(LabResultDB.patient_id == patient_id).all()

@router.post("/", response_model=LabResult)
def create_lab_result(data: LabResultCreate, db: Session = Depends(get_db)):
    ensure_patient_exists(data.patient_id, db)
    r = LabResultDB(id=str(uuid.uuid4())[:8].upper(), **data.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    recompute_patient_risk(data.patient_id, db)
    store.add_audit_log("ADD_LAB_RESULT", "lab_technician", f"Added {data.test_name} for {data.patient_id}")
    return r

@router.put("/{result_id}", response_model=LabResult)
def update_lab_result(result_id: str, data: LabResultCreate, db: Session = Depends(get_db)):
    r = db.query(LabResultDB).filter(LabResultDB.id == result_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Lab result not found")
    for key, value in data.model_dump().items():
        setattr(r, key, value)
    db.commit()
    db.refresh(r)
    store.add_audit_log("EDIT_LAB_RESULT", "lab_technician", f"Edited {data.test_name} for {data.patient_id}")
    return r

@router.post("/bulk", response_model=BulkLabResultResponse)
def bulk_create_lab_results(payload: BulkLabResultRequest, db: Session = Depends(get_db)):
    saved, skipped, errors = 0, 0, []
    affected_patients = set()
    for record in payload.records:
        try:
            ensure_patient_exists(record.patient_id, db)
            r = LabResultDB(id=str(uuid.uuid4())[:8].upper(), **record.model_dump())
            db.add(r)
            affected_patients.add(record.patient_id)
            saved += 1
        except Exception as e:
            skipped += 1
            errors.append(str(e))
    db.commit()
    for pid in affected_patients:
        recompute_patient_risk(pid, db)
    store.add_audit_log("BULK_UPLOAD", "lab_technician", f"Bulk upload: {saved} saved, {skipped} skipped")
    return BulkLabResultResponse(saved=saved, skipped=skipped, errors=errors)