from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db, AuditLogDB

router = APIRouter()

@router.get("/")
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLogDB).order_by(AuditLogDB.id.desc()).all()
    return [{"id": l.id, "action": l.action, "performed_by": l.performed_by,
             "details": l.details, "timestamp": l.timestamp} for l in logs]