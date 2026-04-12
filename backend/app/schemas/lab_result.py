from pydantic import BaseModel
from typing import Optional, List

class LabResultCreate(BaseModel):
    patient_id: str
    test_name: str
    result_value: float
    unit: str
    reference_range: str
    date: str

class LabResult(LabResultCreate):
    id: str

class BulkLabResultRequest(BaseModel):
    records: List[LabResultCreate]

class BulkLabResultResponse(BaseModel):
    saved: int
    skipped: int
    errors: List[str]