# Diabetes Risk Prediction Dashboard
### BE AI&DS Healthcare AI/ML Mini Project &bull; UN SDG 3 (Good Health and Well-being)

An interpretable, evidence-based machine learning pipeline and interactive web dashboard for early diabetes risk screening support. Developed as an academic prototype using the **Pima Indians Diabetes Database** (National Institute of Diabetes and Digestive and Kidney Diseases; OpenML ID: 37).

---

## Benchmark Model Performance & Evaluation Metrics

All models were evaluated using **5-Fold Stratified Cross-Validation** on the training partition ($N = 614$) and tested on a held-out stratified test set ($N = 154$, 35.1% positive prevalence) with `random_state=42`.

### Comprehensive Performance Table

| Model Architecture | 5-Fold CV ROC-AUC | Test Accuracy | Test Precision | Test Recall (Sensitivity) | Test F1-Score | Test ROC-AUC | Deployment Role |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Gradient Boosting** | **0.8205 ± 0.0155** | **75.97%** (0.7597) | **68.89%** (0.6889) | **57.41%** (0.5741) | **62.63%** (0.6263) | **0.8306** | **Best Overall Model** (Highest Test ROC-AUC) |
| **Random Forest** (100 Trees) | 0.8154 ± 0.0230 | 77.27% (0.7727) | 70.21% (0.7021) | 61.11% (0.6111) | 65.35% (0.6535) | 0.8181 | Non-linear ensemble benchmark |
| **Logistic Regression** | 0.8434 ± 0.0185 | 70.78% (0.7078) | 60.00% (0.6000) | 50.00% (0.5000) | 54.55% (0.5455) | 0.8130 | **Web Deployed Engine** (Linear interpretability) |

---

### Detailed Confusion Matrix Breakdown (Test Set N = 154)

| Model Architecture | True Negatives (TN) | False Positives (FP) | False Negatives (FN) ⚠️ | True Positives (TP) | Specificity | Sensitivity (Recall) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Gradient Boosting** | 86 (55.8%) | 14 (9.1%) | 23 (14.9%) | 31 (20.1%) | 86.00% | **57.41%** |
| **Random Forest** | 86 (55.8%) | 14 (9.1%) | 21 (13.6%) | 33 (21.4%) | 86.00% | **61.11%** |
| **Logistic Regression** | 82 (53.2%) | 18 (11.7%) | 27 (17.5%) | 27 (17.5%) | 82.00% | **50.00%** |

> **Clinical Significance of Recall**: In diabetes screening, **Recall** is prioritized over Precision. A **False Negative (FN)** denotes an individual with undiagnosed diabetes who is mistakenly classified as low risk, delaying therapeutic lifestyle and pharmacological interventions. A **False Positive (FP)** merely triggers confirmatory diagnostic blood testing (e.g. HbA1c), which carries minimal physical risk.

---

## Explainability & Feature Importance Rankings

Standardized coefficients and feature importance scores across models identify the clinical drivers of diabetes risk:

| Clinical Feature | LR Standardized Coef ($\beta_i$) | Permutation Importance (ROC-AUC drop) | RF Gini Impurity (%) | Clinical Interpretation |
| :--- | :---: | :---: | :---: | :--- |
| **Plasma Glucose** | **+1.1541** | **0.0682 ± 0.0210** | **28.4%** | Primary marker of impaired glucose tolerance and pancreatic $\beta$-cell exhaustion |
| **Body Mass Index (BMI)** | **+0.6514** | **0.0354 ± 0.0142** | **18.7%** | Excess adiposity driving peripheral insulin resistance |
| **Age** | **+0.3721** | **0.0191 ± 0.0095** | **14.2%** | Chronological metabolic senescence |
| **Diabetes Pedigree** | **+0.3204** | **0.0152 ± 0.0081** | **12.5%** | Inherited polygenic hereditary predisposition |
| **Pregnancies** | **+0.2185** | **0.0084 ± 0.0062** | **8.1%** | History of gestational metabolic stress |
| **Diastolic BP** | **-0.0842** | **0.0041 ± 0.0035** | **6.8%** | Vascular pressure marker |
| **Skin Thickness** | **+0.0315** | **0.0022 ± 0.0028** | **5.9%** | Triceps subcutaneous fat store |
| **Serum Insulin** | **-0.0210** | **0.0019 ± 0.0021** | **5.4%** | Fasting/stimulated pancreatic hormone level |

---

## Repository Structure

```text
AIML-Honours-Mini-Proj/
├── data/
│   └── dataset_37_diabetes.arff       # Canonical ARFF dataset
├── Dataset/
│   └── dataset_37_diabetes.arff       # Preserved original dataset copy
├── notebook/
│   ├── diabetes_analysis.ipynb        # Fully executed Jupyter notebook with all 12 sections
│   └── outputs/
│       ├── plots/                     # 10 High-resolution saved PNG figures
│       │   ├── boxplots_by_outcome.png
│       │   ├── class_distribution.png
│       │   ├── confusion_matrices.png
│       │   ├── correlation_heatmap.png
│       │   ├── feature_histograms.png
│       │   ├── lr_coefficients.png
│       │   ├── means_by_outcome.png
│       │   ├── permutation_importance.png
│       │   ├── rf_feature_importance.png
│       │   └── roc_curves.png
│       └── results.json               # Serialized experimental metrics
├── web/
│   ├── src/
│   │   ├── components/                # 9 Modular tab components
│   │   │   ├── Overview.jsx           # Problem statement, SDG 3, headline cards
│   │   │   ├── DatasetPrep.jsx        # Data provenance, invalid zeros, pipeline steps
│   │   │   ├── EDA.jsx                # Histograms, heatmap, group rates, summary stats
│   │   │   ├── Results.jsx            # Multi-model table, 2x2 confusion matrices, ROC
│   │   │   ├── Explainability.jsx     # LR weights, permutation importance, RF Gini
│   │   │   ├── Predict.jsx            # Interactive calculator, waterfall chart, samples
│   │   │   ├── AskData.jsx            # Gemini assistant with session key storage
│   │   │   ├── AboutLimitations.jsx   # Ethics, parity badge, limitations, future scope
│   │   │   └── ReportNotes.jsx        # Copy-ready academic report sections + Print/PDF
│   │   ├── predict.js                 # Pure JS client inference engine
│   │   ├── knowledge.js               # Dynamic knowledge base synthesizer
│   │   ├── gemini.js                  # Gemini REST client (gemini-3.6-flash)
│   │   ├── results.json               # Synced pipeline metrics
│   │   ├── styles.css                 # Clean White + Teal styling
│   │   ├── App.jsx                    # Root tab controller
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── README.md
└── README.md
```

---

## How to Run Everything

### Step 1: Execute the Jupyter Notebook (Python)
The notebook runs leak-free preprocessing, exploratory data analysis, 5-fold cross-validation across three candidate pipelines, test evaluation, explainability extraction, and generates `results.json`.

Execute top-to-bottom in-place:
```bash
python -m nbconvert --to notebook --execute --inplace notebook/diabetes_analysis.ipynb
```
*Outputs generated:*
- 10 publication-quality figures in `notebook/outputs/plots/`.
- Complete serialized results in `notebook/outputs/results.json` and `web/src/results.json`.

---

### Step 2: Run the Web Application (React + Vite)
The web application is a single-page reactive dashboard with zero backend dependencies. All data is driven dynamically by `src/results.json`.

```bash
cd web
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Key Highlights & Verification

1. **Leak-Free ML Protocol**:
   - Explicit detection of biologically impossible zeros in Glucose (5), Diastolic BP (35), Skin Thickness (227), Serum Insulin (374), and BMI (11).
   - Fold-isolated median imputation via scikit-learn `Pipeline` objects to prevent evaluation leakage.

2. **Mathematical Parity Verification**:
   - The browser evaluates Logistic Regression directly in JavaScript (`src/predict.js`).
   - Automatically verified on mount against scikit-learn's `predict_proba` on held-out test rows:
     $$\max |P_{\text{browser}} - P_{\text{sklearn}}| = 0.00003882 \ll 0.001$$

3. **Grounded AI Research Assistant**:
   - Interactive Q&A powered by Google Gemini (`gemini-3.6-flash`).
   - Grounded strictly by a dynamic knowledge base synthesized from `results.json`.
   - API key is stored only in the browser's `sessionStorage` and never logged or written to disk.

---

## Academic Disclaimer
> **Academic Prototype**: This software is an educational prototype developed for a BE AI&DS mini-project. It is **not** certified medical software, does not provide clinical diagnoses, and must not replace professional clinical judgment.
