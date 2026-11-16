// Grounding knowledge base for the Gemini Clinical Q&A assistant
// All metrics and facts derived directly from the 101,766-encounter hospital analysis

export const CLINICAL_KNOWLEDGE_BASE = `
PROJECT & CLINICAL OVERVIEW:
- Project Title: Patient Follow-up & 30-Day Hospital Readmission Prognosis Estimator
- Academic Course: BE Computer Engineering (Honours in AI/ML) | Healthcare AI/ML Mini Project
- PDF Alignment: Track #4 ("Patient Follow-up / Prognosis Estimator"), Experiments 1, 2, 4, 8; Course Outcomes CO1-CO5
- Target Problem: Acute unplanned 30-day hospital readmissions among diabetic inpatients under the US CMS Hospital Readmissions Reduction Program (HRRP).
- Clinical Motivation: Unplanned readmissions cost the US healthcare system over $17 billion annually. They represent major disruptions in patient continuity of care, adverse drug events, and poor transition planning.

DATASET & COHORT SELECTION:
- Source: UCI Machine Learning Repository & OpenML (Diabetes 130-US Hospitals for years 1999-2008).
- Raw Encounters: 101,766 hospital encounters across 130 medical centers in the United States.
- Exclusion Cascade:
  1. Hospice & Expired patients excluded (discharge disposition IDs 11, 13, 14, 19, 20, 21), because deceased or palliative patients cannot logically experience an unplanned acute 30-day readmission.
  2. Multi-encounter deduplication: Kept only the initial admission encounter per unique patient ID to eliminate survival and longitudinal repeat-admission bias.
- Final Clean Cohort: 69,990 unique inpatient encounters.
- Feature Space: 24 clinical features (13 numerical, 11 categorical).
- Target Definition: Binary classification. Class 1 = Readmitted within <30 days (acute unplanned readmission). Class 0 = Readmitted after >30 days or not readmitted.
- Class Prevalence: 8.98% acute readmissions (6,285 patients), 91.02% negative class (63,705 patients).
- Train/Test Split: 80% train (55,992 encounters), 20% test (13,998 encounters) with stratified sampling.

MACHINE LEARNING BENCHMARKS (5-Fold Stratified Cross-Validation & Test Holdout):
1. LightGBM (Gradient Boosted Trees):
   - CV ROC-AUC: 0.6454 +/- 0.0042
   - Test ROC-AUC: 0.6465 (Best discriminative performance)
   - Test PR-AUC: 0.1663
   - Test Recall: 54.57% (Sensitivity to readmissions)
   - Test Accuracy: 65.45%
2. Logistic Regression (L2-Regularized, class_weight='balanced'):
   - CV ROC-AUC: 0.6382 +/- 0.0039
   - Test ROC-AUC: 0.6415 (Selected for web transparency & clinical explainability)
   - Test PR-AUC: 0.1530
   - Test Recall: 54.65%
   - Test Accuracy: 65.50%
3. Random Forest (150 trees, max_depth=12):
   - CV ROC-AUC: 0.6199 +/- 0.0051
   - Test ROC-AUC: 0.6284
   - Test PR-AUC: 0.1417
   - Test Recall: 31.66%
   - Test Accuracy: 79.53%

EXPLAINABILITY & CLINICAL RISK DRIVERS:
- Top Risk Factors Increasing 30-Day Readmission Odds:
  1. Prior Inpatient Hospitalizations: Having 1 or more prior hospitalizations increases readmission odds dramatically (beta = +0.245, odds ratio = 1.28).
  2. Total Prior Encounters: Combined history of outpatient, emergency, and inpatient visits (beta = +0.182).
  3. Length of Hospital Stay (Days): Longer stays correlate with severe, unresolving acute complications (beta = +0.083).
  4. Number of Diagnoses (Comorbidity Index): Patients with 7+ diagnoses have 1.34x higher readmission probability (beta = +0.079).
  5. Insulin Volatility: Patients whose insulin dosage was increased ('Up') during admission had higher readmission rates (beta = +0.138) than those maintained on stable regimens.
  6. Discharge to Home Health or Skilled Nursing Facility: Indicates frail functional status and higher subsequent readmission risk.
- Protective / Risk-Reducing Factors:
  1. Inpatient HbA1c Lab Testing: Patients whose HbA1c was measured during the encounter exhibited lower 30-day readmissions (protective factor).
  2. Stable Medication Regimen: Patients discharged with unchanged or steady insulin regimens had significantly lower readmission odds than patients requiring volatile dose titrations.
  3. Routine Home Discharge: Patients discharged directly home without complex medical support devices had lower readmission likelihood.

CLINICAL REALITY & CEILING:
- In published medical informatics literature (e.g. Strack et al. 2014, Rubin et al. 2018), 30-day hospital readmission models based solely on inpatient EHR data consistently peak between 0.63 and 0.68 ROC-AUC.
- Reason: Key Social Determinants of Health (SDOH)—such as patient food security, pharmacy access, transport availability, health literacy, and family caregiver support—are not captured in hospital billing EHRs. This realism is a core finding for academic review.

POST-DISCHARGE CLINICAL CARE PATHWAYS:
- High Risk (>= 40%): Mandatory 48-hour telehealth medication reconciliation check-in; referral to visiting home health nurse; mandatory diabetes educator consult before discharge; 7-day in-person clinic visit with comprehensive metabolic panel.
- Moderate Risk (25% - 40%): 7-day outpatient follow-up with endocrinologist or primary care; medication reconciliation review; automated 72-hour text/call check.
- Low Risk (< 25%): Routine 14-day outpatient follow-up; quarterly HbA1c testing; self-monitoring glucose log.
`;
