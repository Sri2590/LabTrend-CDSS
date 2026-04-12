from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str

# Mock credentials
MOCK_USERS = {
    "clinician": {"password": "clinic123", "role": "clinician"},
    "labtech":   {"password": "lab123",    "role": "lab_technician"},
    "admin":     {"password": "admin123",  "role": "admin"},
}

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest):
    user = MOCK_USERS.get(data.username)
    if not user or user["password"] != data.password:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "access_token": f"mock-token-{data.username}",
        "token_type": "bearer",
        "role": user["role"],
    }