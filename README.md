# Patient Follow-up & 30-Day Hospital Readmission Prognosis Estimator

[![BE AI&DS Mini Project](https://img.shields.io/badge/Course-BE%20AI%26DS%20(Honours)-05668D.svg)](https://github.com)
[![Topic Alignment](https://img.shields.io/badge/Track-%234%20Patient%20Prognosis%20Estimator-028090.svg)](https://github.com)
[![Scale](https://img.shields.io/badge/Cohort-69%2C990%20Patients%20%7C%20101k%20Encounters-00A896.svg)](https://archive.ics.uci.edu/dataset/296/diabetes+130-us+hospitals+for+years+1999-2008)
[![Model Parity](https://img.shields.io/badge/Parity-Verified%20(%3C0.00004)-02C39A.svg)](https://github.com)
[![SDG Alignment](https://img.shields.io/badge/UN%20SDG-Target%203.4%20(NCDs)-F0F3BD.svg)](https://sdgs.un.org/goals/goal3)

An end-to-end, clinically grounded artificial intelligence application designed to predict acute 30-day hospital readmissions among diabetic inpatients under the **US Centers for Medicare & Medicaid Services (CMS) Hospital Readmissions Reduction Program (HRRP)**.

Developed for the **Healthcare AI/ML Mini Project** (BE Artificial Intelligence & Data Science, Department of AI&DS, Fr. Conceicao Rodrigues College of Engineering, University of Mumbai).

---

## 🏥 Clinical Background & Real-World Problem

Unplanned 30-day hospital readmissions impose an annual economic burden of **$17+ billion** on the US healthcare system and frequently signify fragmented transitional care, adverse drug interactions, or unmonitored post-discharge decompensation.

### Why Not a Toy Dataset?
In previous iterations, standard diabetes projects relied on the 768-row Pima Indians dataset. This project replaces that toy dataset with the massive **UCI 130-US Hospitals Diabetes Inpatient Dataset (1999–2008)**:
- **101,766 raw encounters** across 130 medical centers.
- Rigorous **exclusion cascade**: Filtered out deceased and hospice discharges ($N = 2,423$) and deduplicated to the initial admission per patient to eliminate longitudinal survival bias.
- **Analytical Study Cohort:** **69,990 unique patients** across 24 multi-modal features (13 numerical, 11 categorical).
- **Target Class:** Binary acute 30-day readmission ($8.98\%$ positive prevalence, $1:10.1$ imbalance).

---

## 📊 Benchmark Model Performance

Evaluated via 5-fold stratified cross-validation on the training set ($N = 55,992$) and holdout testing on $N = 13,998$ encounters:

| Model Architecture | 5-Fold CV ROC-AUC | Test ROC-AUC | Test PR-AUC | Accuracy | Precision | Recall (Sensitivity) | F1-Score | Role |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **LightGBM** | **0.6454 ± 0.0042** | **0.6465** | **0.1663** | 65.45% | 13.86% | 54.57% | 0.2210 | **Benchmark Champion** |
| **Logistic Regression** | 0.6382 ± 0.0039 | **0.6415** | 0.1530 | 65.50% | 13.91% | **54.65%** | **0.2217** | **Deployed Web Engine** |
| **Random Forest** | 0.6199 ± 0.0051 | 0.6284 | 0.1417 | 79.53% | 16.38% | 31.66% | 0.2159 | Ensemble Baseline |

> **Medical Informatics Ceiling:** Published clinical literature (Strack et al. 2014, Rubin et al. 2018) demonstrates that 30-day EHR readmission models plateau around ROC-AUC 0.63–0.68 because outpatient Social Determinants of Health (SDOH)—such as medication copay affordability, food security, and home caregiver availability—are absent from hospital billing records. Our models achieve publication-grade discriminative power.

---

## 🎨 Interactive Web Application & Features

Built with **React 18 + Vite + Recharts + Lucide-React** using a minimal medical aesthetic styled via the user-specified [Coolors palette](https://coolors.co/palette/05668d-028090-00a896-02c39a-f0f3bd):

- **Inpatient Discharge Simulator:** Allows clinicians to enter or adjust length of stay, past hospitalizations, lab procedures, ICD-9 diagnostic chapters, and insulin titrations.
- **Interactive "What-If" Counterfactual Engine:** Live toggles to simulate interventions prior to discharge:
  - *Order Inpatient HbA1c Lab Before Discharge*
  - *Stabilize Insulin Maintenance Regimen*
  - *Discharge 2 Days Earlier (Safe Ambulatory)*
  - Live calculation of absolute $\Delta$ risk and relative risk reduction percentage!
- **Signed Waterfall Risk Attribution:** Decomposes patient logit scores into specific positive risk drivers (red) vs protective factors (mint).
- **Automated Post-Discharge Care Pathways:** Generates prioritized clinical orders (48-hr telehealth check-in, home health nurse referral, diabetes educator consult).
- **Grounded Clinical AI Assistant:** Powered by **Google Gemini 2.5 Flash** with the 101,766-encounter empirical findings injected into session memory.
- **Live Mathematical Parity Verification:** Real-time client-side audit proving browser JS predictions match offline Python scikit-learn within **$\Delta < 0.00004$** tolerance.

---

## 📁 Repository Structure

```
AIML-Honours-Mini-Proj/
├── Healthcare_AI_ML_Mini_Project_Implementation.docx.pdf # Official college syllabus & rubric
├── Patient_Followup_Readmission_Prognosis_Report.docx     # 1.34 MB academic Word report (all 28 sections)
├── generate_report_docx.py                               # Word report generator with 8 embedded plots
├── README.md                                             # Project documentation
├── .gitignore
├── data/
│   ├── diabetic_data.csv                                 # 101,766 rows x 50 columns
│   └── IDS_mapping.csv                                   # Admission & discharge code dictionary
├── notebook/
│   ├── patient_prognosis_analysis.ipynb                  # Executed Jupyter notebook (all 12 sections)
│   └── outputs/
│       ├── results.json                                  # Serialized metrics, weights, and parity checks
│       └── plots/                                        # 8 High-resolution PNG figures
│           ├── confusion_matrices.png
│           ├── correlation_heatmap.png
│           ├── lgbm_feature_importance.png
│           ├── lr_coefficients.png
│           ├── readmission_by_diagnosis.png
│           ├── readmission_by_prior_inpatient.png
│           ├── readmission_class_balance.png
│           └── roc_curves.png
└── web/                                                  # Interactive Web Application
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                                       # Clinical header, context bar, tab routing
        ├── styles.css                                    # Minimal medical theme with Coolors palette
        ├── predict.js                                    # Deterministic client-side inference engine
        ├── gemini.js                                     # Gemini 2.5 Flash REST client
        ├── knowledge.js                                  # Grounded dataset knowledge base
        ├── results.json                                  # Synced weights & metadata
        └── components/
            ├── Overview.jsx                              # Problem context, KPI cards, SDG 3 Target 3.4
            ├── DatasetPrep.jsx                           # 101k -> 70k exclusion cascade, ICD-9 mapping
            ├── EDA.jsx                                   # Risk escalation by stay, visits, insulin
            ├── Results.jsx                               # Benchmark tables, ROC curves, confusion matrices
            ├── Explainability.jsx                        # Log-odds, LightGBM gain, modifiable vs fixed
            ├── Predict.jsx                               # Inpatient simulator & What-If counterfactuals
            ├── AskData.jsx                               # Grounded clinical Q&A assistant
            ├── AboutLimitations.jsx                      # Live parity audit & SDOH discussion
            └── ReportNotes.jsx                           # Submission-ready report texts
```

---

## 🚀 Getting Started

### 1. Run the Interactive Web Application

```bash
cd web
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

To build for production:
```bash
npm run build
npm run preview
```

### 2. Run the Machine Learning Pipeline

```bash
python -m jupyter notebook notebook/patient_prognosis_analysis.ipynb
```
Or execute headless:
```bash
python -m nbconvert --to notebook --execute notebook/patient_prognosis_analysis.ipynb --inplace
```

### 3. Generate the Academic Word Report

```bash
python generate_report_docx.py
```
Outputs `Patient_Followup_Readmission_Prognosis_Report.docx` with all 28 rubric headings and 8 high-res PNG plots embedded.

---

## 🎯 Curriculum & SDG Mapping

- **University Track:** Topic #4 — *"Patient Follow-up / Prognosis Estimator"*
- **Course Experiments:** Exp 1 (Preprocessing), Exp 2 (EDA), Exp 4 (Supervised Classification), Exp 8 (Evaluation & Benchmarks).
- **Course Outcomes:** CO1, CO2, CO3, CO4, CO5 fully satisfied.
- **Global Health Impact:** UN Sustainable Development Goal 3 (Good Health and Well-Being), Target 3.4 (Reduction of premature mortality from non-communicable diseases).
