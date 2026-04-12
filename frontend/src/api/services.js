import axiosClient from "./axiosClient";

export const loginUser             = (username, password) => 
  axiosClient.post("/auth/login", { username, password });

export const fetchPatients         = (search = "") => 
  axiosClient.get(`/patients/?search=${search}`);

export const fetchPatientById      = (id) => 
  axiosClient.get(`/patients/${id}`);

export const createPatient         = (data) => 
  axiosClient.post("/patients/", data);

export const updatePatient         = (id, data) => 
  axiosClient.put(`/patients/${id}`, data);

export const fetchNextPatientId    = () => 
  axiosClient.get("/patients/next-id");

export const fetchLabResults       = (patientId) => 
  axiosClient.get(`/lab-results/${patientId}`);

export const createLabResult       = (data) => 
  axiosClient.post("/lab-results/", data);

export const updateLabResult       = (id, data) => 
  axiosClient.put(`/lab-results/${id}`, data);

export const bulkUploadLabResults  = (records) => 
  axiosClient.post("/lab-results/bulk", { records });

export const fetchRisk             = (patientId) => 
  axiosClient.get(`/risk/${patientId}`);

export const fetchAlerts           = () => 
  axiosClient.get("/alerts/");

export const fetchAuditLogs        = () => 
  axiosClient.get("/audit/");

export const fetchTestCatalog      = () => 
  axiosClient.get("/tests/");

export const addCustomTest         = (data) => 
  axiosClient.post("/tests/", data);

export const exportPatientReport   = (patientId) => 
  axiosClient.get(`/patients/${patientId}/report`, { responseType: "blob" });

export const updateCustomTest = (name, data) =>
  axiosClient.put(`/tests/${encodeURIComponent(name)}`, data);