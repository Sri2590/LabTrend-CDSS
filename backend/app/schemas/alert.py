from pydantic import BaseModel

class Alert(BaseModel):
    id: int
    patient: str
    message: str
    severity: str
    time: str