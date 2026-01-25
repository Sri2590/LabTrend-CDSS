# LabTrend-CDSS
AI-Assisted Lab Trend Analyzer & Clinical Decision Support System

## Project Overview
LabTrend-CDSS is a web-based Clinical Decision Support System (CDSS) designed to help clinicians interpret longitudinal laboratory data, identify abnormal trends, and generate early disease risk stratification using transparent, rule-based logic. The system focuses on trend analysis, explainability, and decision support rather than diagnosis or treatment recommendation.

## Problem It Solves
In many healthcare environments, laboratory reports are reviewed as isolated values rather than as time-based trends. This can result in missed early warning signs, delayed intervention, and inconsistent follow-ups. Existing enterprise systems are often expensive, complex, and unsuitable for academic or small-scale deployments. LabTrend-CDSS addresses this gap by providing a lightweight, explainable, and role-based platform for lab trend interpretation and early risk screening.

## Target Users (Personas)

### Clinician
- Reviews patient lab trends and risk indicators
- Needs explainable, non-diagnostic decision support
- Uses the system for screening and prioritization

### Lab Technician
- Enters and uploads lab results
- Corrects data entry errors
- Ensures data quality and consistency

### System Admin
- Manages users and roles
- Configures lab tests, units, and thresholds
- Maintains audit and governance controls

## Vision Statement
To provide a professional yet accessible clinical decision support platform that transforms raw laboratory data into meaningful, explainable insights for early disease risk identification.

## Key Features / Goals
- Secure role-based login
- Patient profile management
- Manual and CSV-based lab data entry
- Lab input validation
- Time-series lab trend visualization
- Rule-based early disease risk stratification
- Explainable risk outputs
- Alerts for abnormal labs and high-risk cases
- Audit logging and traceability
- Exportable patient summary reports

## System Architecture

The LabTrend-CDSS follows a layered web-based architecture with a browser-based frontend, a backend REST API, persistent data storage, and containerized deployment.

![System Architecture](docs/architecture/SWE%20DA%201%20-%20LabTrend%20CDSS%20-%20Architecture%20Diagram.jpg)

## Wireframes

Low-fidelity wireframes for the LabTrend-CDSS were designed using Figma to represent the key user workflows and screens.

### Figma Design Link
[View Wireframes in Figma](https://www.figma.com/design/vWc7Mvyj4swaERw5jIVzfU/SWE-DA-1---LabTrend-CDSS---Figma-Frames?node-id=0-1&t=ihGUmnnwFzGDxQsj-1)

### Exported Screens
![01 - Login](docs/wireframes/01%20-%20Login.png)
![02 - Clinician Dashboard](docs/wireframes/02%20-%20Clinician%20Dashboard.png)
![03 - Patient Summary](docs/wireframes/03%20-%20Patient%20Summary.png)
![04 - Lab Entry and CSV Upload](docs/wireframes/04%20-%20Lab%20Entry%20and%20CSV%20Upload.png)
![05 - Lab Trends](docs/wireframes/05%20-%20Lab%20Trends.png)
![06 - Risk Explanation](docs/wireframes/06%20-%20Risk%20Explanation.png)

## Branching Strategy

This project follows **GitHub Flow**.  
- The `main` branch contains stable code.
- Feature development is done in separate branches.
- Changes are merged back into `main` via pull requests.

Example feature branches:
- `feature/docker-setup`

## Success Metrics
- End-to-end workflow completion without errors
- Accurate lab trend visualization
- Risk outputs consistent with configured rules
- At least 80% usability success in test users
- Successful demo using synthetic datasets

## Assumptions
- Data used is synthetic or non-sensitive
- Users have access to a modern web browser
- Lab units and reference ranges are standardized
- System is used for decision support only

## Constraints
- Academic timeline (8–12 weeks)
- Open-source technologies only
- No diagnostic or treatment claims
- Student-level development resources
