from pydantic import BaseModel
from typing import Optional

class Patient(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    risk: str
    dob: Optional[str] = None
    contact: Optional[str] = None
    address: Optional[str] = None

class PatientCreate(BaseModel):
    id: Optional[str] = None
    name: str
    age: int
    gender: str
    dob: Optional[str] = None
    contact: Optional[str] = None
    address: Optional[str] = None