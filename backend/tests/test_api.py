from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200

def test_login_valid():
    response = client.post("/auth/login", json={"username": "clinician", "password": "clinic123"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid():
    response = client.post("/auth/login", json={"username": "wrong", "password": "wrong"})
    assert response.status_code == 401

def test_get_patients():
    response = client.get("/patients/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_patient_not_found():
    response = client.get("/patients/P999")
    assert response.status_code == 404

def test_create_patient():
    response = client.post("/patients/", json={
        "name": "Test Patient", "age": 30, "gender": "M"
    })
    assert response.status_code == 200
    assert response.json()["name"] == "Test Patient"

def test_get_tests_catalog():
    response = client.get("/tests/")
    assert response.status_code == 200
    assert len(response.json()) >= 17

def test_get_alerts():
    response = client.get("/alerts/")
    assert response.status_code == 200

def test_risk_no_results():
    response = client.get("/risk/P999")
    assert response.status_code == 404

def test_create_lab_result():
    response = client.post("/lab-results/", json={
        "patient_id": "P001",
        "test_name": "HbA1c",
        "result_value": 7.5,
        "unit": "%",
        "reference_range": "<5.7",
        "date": "2024-06-01"
    })
    assert response.status_code == 200
    assert response.json()["test_name"] == "HbA1c"

def test_risk_computation():
    response = client.get("/risk/P001")
    assert response.status_code == 200
    data = response.json()
    assert "overall_risk" in data
    assert data["overall_risk"] == "High"  # P001 has HbA1c 7.4% which must be High risk
    assert len(data["scores"]) > 0
    diseases = [s["disease"] for s in data["scores"]]
    assert "Type 2 Diabetes Risk" in diseases

def test_bulk_upload():
    response = client.post("/lab-results/bulk", json={"records": [
        {"patient_id": "P001", "test_name": "eGFR", "result_value": 55.0,
         "unit": "mL/min", "reference_range": ">60", "date": "2024-06-01"}
    ]})
    assert response.status_code == 200
    assert response.json()["saved"] == 1

def test_audit_log():
    response = client.get("/audit/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)