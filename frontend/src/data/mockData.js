export const mockPatients = [
  { id: "P001", name: "Arjun Mehta", age: 54, gender: "M", risk: "High" },
  { id: "P002", name: "Kavitha Rajan", age: 47, gender: "F", risk: "Medium" },
  { id: "P003", name: "Samuel Iyer", age: 61, gender: "M", risk: "Low" },
];

export const mockTrendData = [
  { date: "Jan", HbA1c: 6.2, eGFR: 72, SBP: 128 },
  { date: "Feb", HbA1c: 6.5, eGFR: 70, SBP: 132 },
  { date: "Mar", HbA1c: 6.8, eGFR: 68, SBP: 135 },
  { date: "Apr", HbA1c: 7.1, eGFR: 65, SBP: 138 },
  { date: "May", HbA1c: 7.4, eGFR: 63, SBP: 142 },
];

export const mockAlerts = [
  { id: 1, patient: "Arjun Mehta", message: "HbA1c exceeded 7.0 threshold", severity: "High", time: "2h ago" },
  { id: 2, patient: "Kavitha Rajan", message: "eGFR dropping trend detected", severity: "Medium", time: "5h ago" },
  { id: 3, patient: "Samuel Iyer", message: "BP within normal range", severity: "Low", time: "1d ago" },
];

export const mockRiskExplanation = {
  patient: "Arjun Mehta",
  overallRisk: "High",
  scores: [
    { disease: "Type 2 Diabetes Risk", risk: "High", reason: "HbA1c at 7.4% (threshold: 7.0%), Fasting Glucose at 136 mg/dL" },
    { disease: "CKD Risk", risk: "Medium", reason: "eGFR at 63 mL/min (Stage 2), trending downward over 5 months" },
    { disease: "Hypertension Risk", risk: "Medium", reason: "SBP at 142 mmHg (threshold: 140), consistent elevation" },
  ],
};