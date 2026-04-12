from app.database import SessionLocal, AuditLogDB
from datetime import datetime

def add_audit_log(action: str, performed_by: str, details: str):
    db = SessionLocal()
    try:
        log = AuditLogDB(
            action=action,
            performed_by=performed_by,
            details=details,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        db.add(log)
        db.commit()
    finally:
        db.close()