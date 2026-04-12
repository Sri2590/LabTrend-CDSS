from sqlalchemy import create_engine, Column, String, Float, Integer, Text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DB_PATH = os.getenv("DATABASE_URL", "sqlite:///./labtrend.db")

engine = create_engine(
    DB_PATH,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ── ORM Models ────────────────────────────────────────────────

class PatientDB(Base):
    __tablename__ = "patients"
    id         = Column(String, primary_key=True)
    name       = Column(String, nullable=False)
    age        = Column(Integer, nullable=False)
    gender     = Column(String, nullable=False)
    risk       = Column(String, default="Unknown")
    dob        = Column(String, nullable=True)
    contact    = Column(String, nullable=True)
    address    = Column(String, nullable=True)

class LabResultDB(Base):
    __tablename__ = "lab_results"
    id              = Column(String, primary_key=True)
    patient_id      = Column(String, nullable=False)
    test_name       = Column(String, nullable=False)
    result_value    = Column(Float, nullable=False)
    unit            = Column(String, nullable=False)
    reference_range = Column(String, nullable=False)
    date            = Column(String, nullable=False)

class AuditLogDB(Base):
    __tablename__ = "audit_logs"
    id           = Column(Integer, primary_key=True, autoincrement=True)
    action       = Column(String, nullable=False)
    performed_by = Column(String, nullable=False)
    details      = Column(Text, nullable=False)
    timestamp    = Column(String, nullable=False)

class CustomTestDB(Base):
    __tablename__ = "custom_tests"
    name            = Column(String, primary_key=True)
    unit            = Column(String, nullable=False)
    reference_range = Column(String, nullable=False)

# ── DB Utilities ──────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    _seed_data()

def _seed_data():
    db = SessionLocal()
    try:
        if db.query(PatientDB).count() == 0:
            db.add_all([
                PatientDB(id="P001", name="Arjun Mehta",   age=54, gender="M", risk="High"),
                PatientDB(id="P002", name="Kavitha Rajan", age=47, gender="F", risk="Medium"),
                PatientDB(id="P003", name="Samuel Iyer",   age=61, gender="M", risk="Low"),
            ])
        if db.query(LabResultDB).count() == 0:
            db.add_all([
                LabResultDB(id="L001", patient_id="P001", test_name="HbA1c",      result_value=7.4,   unit="%",      reference_range="<5.7", date="2024-05-01"),
                LabResultDB(id="L002", patient_id="P001", test_name="eGFR",        result_value=63.0,  unit="mL/min", reference_range=">60",  date="2024-05-01"),
                LabResultDB(id="L003", patient_id="P001", test_name="Systolic BP", result_value=142.0, unit="mmHg",   reference_range="<120", date="2024-05-01"),
                LabResultDB(id="L004", patient_id="P002", test_name="HbA1c",       result_value=6.3,   unit="%",      reference_range="<5.7", date="2024-05-01"),
            ])
        db.commit()
    finally:
        db.close()