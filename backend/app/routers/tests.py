from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, CustomTestDB, Base, engine
from pydantic import BaseModel

Base.metadata.create_all(bind=engine)

router = APIRouter()

BUILTIN_TESTS = [
    {"name": "HbA1c",                "unit": "%",       "reference_range": "<5.7"},
    {"name": "Fasting Glucose",       "unit": "mg/dL",   "reference_range": "70-100"},
    {"name": "Post-Prandial Glucose", "unit": "mg/dL",   "reference_range": "<140"},
    {"name": "eGFR",                  "unit": "mL/min",  "reference_range": ">60"},
    {"name": "Serum Creatinine",      "unit": "mg/dL",   "reference_range": "0.6-1.2"},
    {"name": "Blood Urea Nitrogen",   "unit": "mg/dL",   "reference_range": "7-20"},
    {"name": "Urine Albumin",         "unit": "mg/g",    "reference_range": "<30"},
    {"name": "Systolic BP",           "unit": "mmHg",    "reference_range": "<120"},
    {"name": "Diastolic BP",          "unit": "mmHg",    "reference_range": "<80"},
    {"name": "Total Cholesterol",     "unit": "mg/dL",   "reference_range": "<200"},
    {"name": "LDL Cholesterol",       "unit": "mg/dL",   "reference_range": "<100"},
    {"name": "HDL Cholesterol",       "unit": "mg/dL",   "reference_range": ">40"},
    {"name": "Triglycerides",         "unit": "mg/dL",   "reference_range": "<150"},
    {"name": "Serum Potassium",       "unit": "mEq/L",   "reference_range": "3.5-5.0"},
    {"name": "Serum Sodium",          "unit": "mEq/L",   "reference_range": "136-145"},
    {"name": "TSH",                   "unit": "mIU/L",   "reference_range": "0.4-4.0"},
    {"name": "BMI",                   "unit": "kg/m²",   "reference_range": "18.5-24.9"},
]

BUILTIN_NAMES = {t["name"] for t in BUILTIN_TESTS}

class CustomTestIn(BaseModel):
    name:            str
    unit:            str
    reference_range: str

@router.get("/")
def get_tests(db: Session = Depends(get_db)):
    custom = db.query(CustomTestDB).all()
    builtin = [
        {"name": t["name"], "unit": t["unit"],
         "reference_range": t["reference_range"], "is_custom": False}
        for t in BUILTIN_TESTS
    ]
    custom_list = [
        {"name": str(c.name), "unit": str(c.unit),
         "reference_range": str(c.reference_range), "is_custom": True}
        for c in custom
    ]
    return builtin + custom_list

@router.post("/")
def add_custom_test(data: CustomTestIn, db: Session = Depends(get_db)):
    if data.name in BUILTIN_NAMES:
        return {"status": "exists", "message": "Built-in test already exists"}
    existing = db.query(CustomTestDB).filter(CustomTestDB.name == data.name).first()
    if existing:
        return {"status": "exists", "message": "Custom test already exists"}
    db.add(CustomTestDB(name=data.name, unit=data.unit, reference_range=data.reference_range))
    db.commit()
    return {"status": "added", "message": f"Custom test '{data.name}' added"}

@router.put("/{test_name}")
def update_custom_test(test_name: str, data: CustomTestIn, db: Session = Depends(get_db)):
    if test_name in BUILTIN_NAMES:
        raise HTTPException(status_code=400, detail="Built-in tests cannot be edited")
    t = db.query(CustomTestDB).filter(CustomTestDB.name == test_name).first()
    if not t:
        raise HTTPException(status_code=404, detail="Custom test not found")
    t.unit            = data.unit # type: ignore
    t.reference_range = data.reference_range # type: ignore
    db.commit()
    return {"status": "updated"}