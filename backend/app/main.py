from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, patients, lab_results, risk, alerts, audit, tests
from app.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="LabTrend-CDSS API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost",
        "http://127.0.0.1",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/auth",         tags=["Auth"])
app.include_router(patients.router,     prefix="/patients",     tags=["Patients"])
app.include_router(lab_results.router,  prefix="/lab-results",  tags=["Lab Results"])
app.include_router(risk.router,         prefix="/risk",         tags=["Risk"])
app.include_router(alerts.router,       prefix="/alerts",       tags=["Alerts"])
app.include_router(audit.router,        prefix="/audit",        tags=["Audit"])
app.include_router(tests.router,        prefix="/tests",        tags=["Tests"])

@app.get("/")
def root():
    return {"message": "LabTrend-CDSS API is running"}