from pydantic import BaseModel
from typing import List

class RiskScore(BaseModel):
    disease: str
    risk: str
    reason: str

class RiskAssessment(BaseModel):
    patient: str
    overall_risk: str
    scores: List[RiskScore]