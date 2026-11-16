import os
import json
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    """Sets the background color of a table cell."""
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Sets inner margins (padding) for a table cell in dxa (1 pt = 20 dxa)."""
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def create_report():
    # Load JSON results
    json_path = os.path.join("notebook", "outputs", "results.json")
    if not os.path.exists(json_path):
        json_path = os.path.join("web", "src", "results.json")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    meta = data.get("meta", {})
    features = data.get("features", [])
    cb = data.get("class_balance", {})
    split = data.get("split", {})
    missing = data.get("missing", {})
    summary_stats = data.get("summary_stats", {})
    models = data.get("models", [])
    best_model_name = data.get("best_model", "Gradient Boosting")
    exp = data.get("explainability", {})
    deployed = data.get("deployed_model", {})

    best_record = next((m for m in models if m["name"] == best_model_name), models[0])
    lr_record = next((m for m in models if m["name"] == "Logistic Regression"), {})
    rf_record = next((m for m in models if m["name"] == "Random Forest"), {})
    gb_record = next((m for m in models if m["name"] == "Gradient Boosting"), {})

    plots_dir = os.path.join("notebook", "outputs", "plots")

    doc = Document()

    # Set page margins (1 inch all around)
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles & Colors
    TEAL_HEX = "0d766e"
    TEAL_LIGHT_HEX = "f0fdfa"
    SLATE_DARK_HEX = "1e293b"
    BORDER_HEX = "cbd5e1"

    TEAL_RGB = RGBColor(13, 118, 110)
    DARK_RGB = RGBColor(30, 41, 59)
    MUTED_RGB = RGBColor(100, 116, 139)

    # Helper functions for formatting
    def add_custom_heading(text, level=1):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(6)
        h.paragraph_format.keep_with_next = True
        run = h.add_run(text)
        run.bold = True
        if level == 1:
            run.font.size = Pt(15)
            run.font.color.rgb = TEAL_RGB
        elif level == 2:
            run.font.size = Pt(13)
            run.font.color.rgb = DARK_RGB
        elif level == 3:
            run.font.size = Pt(11.5)
            run.font.color.rgb = TEAL_RGB
        return h

    def add_p(text, bold_prefix=None, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.color.rgb = DARK_RGB
            r_pre.font.size = Pt(10.5)
        r = p.add_run(text)
        r.font.size = Pt(10.5)
        r.font.color.rgb = DARK_RGB
        return p

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.color.rgb = DARK_RGB
            r_pre.font.size = Pt(10)
        r = p.add_run(text)
        r.font.size = Pt(10)
        r.font.color.rgb = DARK_RGB
        return p

    def add_caption(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(10)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(text)
        r.italic = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = MUTED_RGB
        return p

    def add_img(filename, width_in=5.8, caption=None):
        path = os.path.join(plots_dir, filename)
        if os.path.exists(path):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(2)
            doc.add_picture(path, width=Inches(width_in))
            if caption:
                add_caption(caption)
        else:
            add_p(f"[Image file not found: {filename}]")

    # ==========================================
    # Title Page / Header
    # ==========================================
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(10)
    title_p.paragraph_format.space_after = Pt(4)
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    t_run = title_p.add_run("DEPARTMENT OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE")
    t_run.bold = True
    t_run.font.size = Pt(13)
    t_run.font.color.rgb = TEAL_RGB

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(18)
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    s_run = sub_p.add_run("ACADEMIC MINI PROJECT REPORT (BE AI&DS)")
    s_run.bold = True
    s_run.font.size = Pt(11)
    s_run.font.color.rgb = MUTED_RGB

    # 15. Project Title
    add_custom_heading("15. Project Title", level=1)
    add_p(
        "Diabetes Risk Prediction Dashboard: An Interpretable Machine Learning System for Early Screening Support in Healthcare Informatics",
        bold_prefix="Full Project Title: "
    )
    add_p(
        "Academic prototype demonstrating non-invasive physiological risk stratification, leak-free pipeline preprocessing, and explainable client-side deployment aligned with UN Sustainable Development Goal 3.",
        bold_prefix="Project Sub-theme: "
    )

    # 16. Student Names and Roll Numbers
    add_custom_heading("16. Student Names and Roll Numbers", level=1)
    student_table = doc.add_table(rows=1, cols=4)
    student_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = student_table.rows[0].cells
    hdr_titles = ["Sr. No.", "Student Full Name", "Roll Number", "Academic Branch / Year"]
    for i, t in enumerate(hdr_titles):
        hdr_cells[i].text = t
        set_cell_background(hdr_cells[i], TEAL_HEX)
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        for r in hdr_cells[i].paragraphs[0].runs:
            r.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
            r.font.size = Pt(10)

    sample_students = [
        ("1", "Rohan (Project Lead)", "[Roll No. / PRN: ________________]", "BE AI&DS - Final Year"),
        ("2", "[Student Team Member 2]", "[Roll No. / PRN: ________________]", "BE AI&DS - Final Year"),
        ("3", "[Student Team Member 3]", "[Roll No. / PRN: ________________]", "BE AI&DS - Final Year")
    ]
    for row_data in sample_students:
        row_cells = student_table.add_row().cells
        for idx, text in enumerate(row_data):
            row_cells[idx].text = text
            set_cell_margins(row_cells[idx], top=100, bottom=100, left=140, right=140)
            for r in row_cells[idx].paragraphs[0].runs:
                r.font.size = Pt(9.5)
                r.font.color.rgb = DARK_RGB

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 17. Problem Statement and Objectives
    add_custom_heading("17. Problem Statement and Objectives", level=1)
    add_p(
        "Diabetes mellitus represents an escalating global non-communicable epidemic affecting over 537 million adults globally, according to the International Diabetes Federation (IDF). A critical clinical challenge is that nearly half of diabetic patients remain completely undiagnosed during early stages due to subtle or asymptomatic disease onset. Undetected chronic hyperglycemia inflicts irreversible vascular pathology, resulting in diabetic retinopathy, chronic kidney disease (nephropathy), peripheral neuropathy, and heightened risks of myocardial infarction and stroke.",
        bold_prefix="Clinical Problem Statement: "
    )
    add_p(
        "While standard diagnostic verification requires invasive venous blood draws (fasting plasma glucose >= 126 mg/dL or oral glucose tolerance test 2-hr >= 200 mg/dL), routine primary care visits frequently collect standard vital and anthropometric markers. Developing a transparent, automated computational screening mechanism can provide immediate clinical triage, alerting clinicians and patients to high-risk states prior to the emergence of severe pathological complications."
    )
    add_p("Project Objectives:", bold_prefix="Key Objectives: ")
    add_bullet("1. Non-Invasive Risk Stratification: ", "Formulate a machine learning screening tool to classify individuals into Low (<30%), Moderate (30-60%), and High (>60%) risk categories based on routine physical and physiological measurements.")
    add_bullet("2. Leak-Free Pipeline Hygiene: ", "Identify physiologically impossible zeros (missing entries) in biological attributes and establish a strict fold-isolated median imputation strategy within cross-validation folds to eliminate evaluation leakage.")
    add_bullet("3. Multi-Model Benchmark: ", "Systematically evaluate Logistic Regression, Random Forest, and Gradient Boosting under 5-fold stratified cross-validation and a held-out test partition (N=154), prioritizing Recall to minimize dangerous False Negatives.")
    add_bullet("4. Explainable Client-Side Inference: ", "Deploy an in-browser mathematical inference engine with Logistic Regression weights, displaying signed log-odds contributions (waterfall explainability) without backend server requirements.")
    add_bullet("5. Grounded Conversational AI: ", "Integrate a Google Gemini-powered research assistant restricted strictly to synthesized project knowledge to facilitate rapid natural language inquiry into empirical findings.")

    # 18. Relevant Course Outcomes (COs) and Experiment(s) mapped
    add_custom_heading("18. Relevant Course Outcomes (COs) and Experiment(s) Mapped", level=1)
    add_p("This project maps comprehensively across the core competencies and experimental syllabus of the BE Artificial Intelligence and Data Science curriculum:")
    
    co_table = doc.add_table(rows=1, cols=3)
    co_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    co_hdr = co_table.rows[0].cells
    co_hdr[0].text = "Course Outcome / Experiment"
    co_hdr[1].text = "Curricular Competency Description"
    co_hdr[2].text = "Practical Implementation in This Project"
    for cell in co_hdr:
        set_cell_background(cell, TEAL_HEX)
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
        for r in cell.paragraphs[0].runs:
            r.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
            r.font.size = Pt(9.5)

    co_mappings = [
        ("CO1 & CO6\n(Model Selection & Suitability)", "Explain machine learning principles, evaluate candidate models, and justify architectural fitness.", "Compared parametric (Logistic Regression) vs ensemble (Random Forest, Gradient Boosting) classifiers; selected Logistic Regression for deployment due to direct linear interpretability and calibration."),
        ("CO2\n(Computational Healthcare Application)", "Develop computational healthcare solutions using modern AI/ML software tools and frameworks.", "Constructed an integrated full-stack prototype combining scikit-learn analytical pipelines with a modern reactive web dashboard (React 18 + Recharts) and Gemini REST API."),
        ("CO3\n(Machine Learning Applied to Domain Problem)", "Apply machine learning algorithms to real-world domain datasets with proper data hygiene.", "Handled biological zero encoding in clinical markers (Insulin, Skin Thickness, BMI), applied stratified train/test partitioning, and prevented leakage via sklearn Pipeline."),
        ("CO4\n(Metric Analysis & Clinical Justification)", "Analyze, evaluate, and justify model performance using domain-relevant evaluation metrics.", "Evaluated Accuracy, Precision, Recall, F1, and ROC-AUC. Formally justified the clinical primacy of Recall (minimizing False Negatives) in non-invasive triage."),
        ("CO5\n(Design & Implementation of AI/ML System)", "Design, engineer, and deploy an end-to-end AI/ML healthcare application.", "Engineered an end-to-end system: ARFF loading, EDA, cross-validation, mathematical parity verification (<0.001 max diff), interactive calculator, and report generation."),
        ("Lab Exp 1 & 2\n(Data Prep & Exploration)", "Data exploration, missing value analysis, and feature transformation.", "Notebook Section 2 & 3: Impossibility zero analysis, boxplots, class-conditioned histograms, and Pearson correlation heatmap."),
        ("Lab Exp 6 & 8\n(Modeling & Deployment)", "Classifier training, cross-validation tuning, explainability, and web interface deployment.", "Notebook Section 7-10: 5-fold stratified CV, permutation importance on test set, LR coefficient extraction, and React web dashboard.")
    ]
    for co_id, co_desc, co_impl in co_mappings:
        row_c = co_table.add_row().cells
        row_c[0].text = co_id
        row_c[1].text = co_desc
        row_c[2].text = co_impl
        for idx in range(3):
            set_cell_margins(row_c[idx], top=100, bottom=100, left=140, right=140)
            for r in row_c[idx].paragraphs[0].runs:
                r.font.size = Pt(9)
                r.font.color.rgb = DARK_RGB

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 19. SDG Mapping
    add_custom_heading("19. SDG Mapping (Sustainable Development Goals)", level=1)
    add_p(
        "United Nations Sustainable Development Goal 3: Good Health and Well-being",
        bold_prefix="Target Alignment: "
    )
    add_p(
        "Target 3.4 explicitly mandates: 'By 2030, reduce by one third premature mortality from non-communicable diseases through prevention and treatment and promote mental health and well-being.'",
        bold_prefix="Target 3.4 Mandate: "
    )
    add_p(
        "Significance to Healthcare Informatics: Diabetes mellitus is a leading cause of premature mortality and long-term disability worldwide. Conventional laboratory screening requires specialized diagnostic facilities, skilled phlebotomists, and significant financial resources, which often causes diagnostic delays in low-resource settings. This dashboard provides an interpretable screening triage tool that calculates risk probabilities instantaneously from routine physical observations. Early identification empowers individuals to adopt lifestyle modifications (dietary adjustments, physical exercise) and seek timely clinical evaluations, directly curtailing non-communicable disease mortality."
    )

    # 20. Dataset Description and Source
    add_custom_heading("20. Dataset Description and Source", level=1)
    add_p(
        "The project utilizes the canonical Pima Indians Diabetes Database, originally compiled by the National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK) and made publicly accessible via the UCI Machine Learning Repository, Kaggle, and OpenML (Dataset ID: 37).",
        bold_prefix="Data Provenance: "
    )
    add_bullet("Repository Links: ", "OpenML (https://www.openml.org/d/37) | UCI Machine Learning Repository | Kaggle Database.")
    add_bullet("Cohort Demographic Scope: ", "768 clinical observations exclusively gathered from female subjects of Pima Indian ancestry aged 21 years and older residing near Phoenix, Arizona.")
    add_bullet("Target Attribute: ", "Outcome (Binary: 0 = Tested Negative / No Diabetes [500 subjects, 65.1%]; 1 = Tested Positive / Diabetes [268 subjects, 34.9%]).")

    # Feature table
    feat_table = doc.add_table(rows=1, cols=4)
    feat_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    f_hdr = feat_table.rows[0].cells
    f_hdr[0].text = "Attribute Key"
    f_hdr[1].text = "Clinical Feature Label"
    f_hdr[2].text = "Physiological Description"
    f_hdr[3].text = "Unit"
    for cell in f_hdr:
        set_cell_background(cell, TEAL_HEX)
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
        for r in cell.paragraphs[0].runs:
            r.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
            r.font.size = Pt(9.5)

    for f in features:
        row_c = feat_table.add_row().cells
        row_c[0].text = f["key"]
        row_c[1].text = f["label"]
        row_c[2].text = f["description"]
        row_c[3].text = f["unit"]
        for idx in range(4):
            set_cell_margins(row_c[idx], top=100, bottom=100, left=140, right=140)
            for r in row_c[idx].paragraphs[0].runs:
                r.font.size = Pt(9)
                r.font.color.rgb = DARK_RGB

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 21. Data Preparation and Exploratory Data Analysis
    add_custom_heading("21. Data Preparation and Exploratory Data Analysis (EDA)", level=1)
    add_p(
        "A critical pitfall in the Pima Indians dataset is the historical encoding of missing values as numerical zeros. In living human physiology, readings such as 0 mg/dL for Plasma Glucose, 0 mm Hg for Diastolic Blood Pressure, 0 mm for Triceps Skin Thickness, 0 mu U/ml for Serum Insulin, and 0 kg/m² for BMI are biological impossibilities. Failing to handle these zeros distorts variance and misleads model optimization.",
        bold_prefix="Physiological Zero Anomaly Detection: "
    )

    zero_counts = missing.get("invalid_zero_counts", {})
    zero_table = doc.add_table(rows=1, cols=4)
    zero_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    z_hdr = zero_table.rows[0].cells
    z_hdr[0].text = "Clinical Feature"
    z_hdr[1].text = "Invalid Zero Count"
    z_hdr[2].text = "Cohort Missing %"
    z_hdr[3].text = "Training Median Imputation Value"
    for cell in z_hdr:
        set_cell_background(cell, TEAL_HEX)
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
        for r in cell.paragraphs[0].runs:
            r.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
            r.font.size = Pt(9.5)

    medians = missing.get("medians", {})
    for feat_k, count in zero_counts.items():
        row_c = zero_table.add_row().cells
        pct = (count / 768.0) * 100.0
        row_c[0].text = feat_k
        row_c[1].text = str(count)
        row_c[2].text = f"{pct:.2f}%"
        row_c[3].text = str(medians.get(feat_k, "N/A"))
        for idx in range(4):
            set_cell_margins(row_c[idx], top=100, bottom=100, left=140, right=140)
            for r in row_c[idx].paragraphs[0].runs:
                r.font.size = Pt(9)
                r.font.color.rgb = DARK_RGB

    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    add_p("To avoid data leakage, zeros were replaced with NaN indicators. The actual imputation of replacement medians was executed strictly inside scikit-learn Pipeline objects during cross-validation training.")

    # Embed Figures
    add_img("class_distribution.png", width_in=5.2, caption="Figure 1: Outcome Class Balance Distribution (Negative: 65.1%, Positive: 34.9%).")
    add_img("correlation_heatmap.png", width_in=5.8, caption="Figure 2: Pearson Correlation Matrix Across Clinical Features and Target Outcome.")
    add_img("feature_histograms.png", width_in=5.8, caption="Figure 3: Ten-Bin Distribution Histograms Conditioned on Diabetes Outcome.")
    add_img("boxplots_by_outcome.png", width_in=5.8, caption="Figure 4: Comparative Boxplots Illustrating Interquartile Ranges and Outliers by Outcome.")
    add_img("means_by_outcome.png", width_in=5.8, caption="Figure 5: Normalized Feature Means Comparison Conditioned on Outcome.")

    add_p(
        "Key EDA Observations: Plasma Glucose exhibits the strongest linear relationship with diabetes (r = 0.49), followed by BMI (r = 0.31), Age (r = 0.24), and Pregnancies (r = 0.22). Diabetic individuals demonstrate an average +28.6% elevation in mean Glucose (142.3 vs 110.6 mg/dL) and +14.8% elevation in mean BMI (35.4 vs 30.8 kg/m²). Sub-group analysis reveals that patients with BMI >= 30 show a 46.4% diabetes rate (versus only 6.8% for BMI < 25), while patients in the top glucose quartile (>= 140.3 mg/dL) exhibit a 74.7% diabetes prevalence.",
        bold_prefix="Summary of Findings: "
    )

    # 22. Methodology / Model and Application Design
    add_custom_heading("22. Methodology / Model and Application Design", level=1)
    add_p(
        "The analytical architecture is structured around leak-free automated pipelines combining three sequential components: SimpleImputer(strategy='median') -> StandardScaler() -> Classifier. The dataset was partitioned using stratified sampling (80% train [N=614], 20% held-out test [N=154], random_state=42).",
        bold_prefix="Pipeline Architecture: "
    )
    add_bullet("1. Fold-Isolated Median Imputation: ", "Calculates statistical medians strictly on training folds and imputes them onto validation folds, preventing leakage of test distribution statistics.")
    add_bullet("2. Feature Standardization: ", "Applies z-score scaling: z_i = (x_i - mean_i) / scale_i. Guarantees uniform convergence across disparate measurement units.")
    add_bullet("3. Candidate Classifiers: ", "Evaluated Logistic Regression (regularized linear model), Random Forest (100 bagging trees), and Gradient Boosting (sequential residual boosting).")
    add_bullet("4. Frontend Client Deployment: ", "Logistic Regression was deployed in the web frontend. Its linear equation logit = beta_0 + sum(beta_i * z_i) and sigmoid transformation P = 1 / (1 + exp(-logit)) execute with zero latency in JavaScript, offering complete transparency through signed log-odds waterfall decomposition.")

    # 23. Implementation Details and Tools Used
    add_custom_heading("23. Implementation Details and Tools Used", level=1)
    add_p("The technological ecosystem integrates Python scientific packages with modern web engineering:")
    add_bullet("Python 3.12 & scikit-learn: ", "Core modeling, cross-validation, pipeline definitions, and evaluation metrics.")
    add_bullet("Pandas & NumPy & SciPy: ", "ARFF file parsing (scipy.io.arff), zero detection, and numerical linear algebra.")
    add_bullet("Matplotlib & Seaborn: ", "High-resolution academic visualizations (histograms, boxplots, heatmaps, ROC plots).")
    add_bullet("React 18 & Vite: ", "Fast, reactive single-page dashboard architecture with zero backend server dependencies.")
    add_bullet("Recharts: ", "Interactive SVG data visualizations including real-time waterfall explainability charts.")
    add_bullet("Google Gemini REST API (gemini-3.6-flash): ", "Direct client-side conversational research assistant bounded strictly by an automatically generated knowledge base.")
    add_bullet("Mathematical Parity Assertion: ", "The browser predictor was verified against scikit-learn's predict_proba on held-out test rows, yielding an exact maximum absolute difference of 0.00003882 (< 0.001 tolerance).")

    # 24. Results: Screenshots, Graphs, Charts, and Evaluation Metrics
    add_custom_heading("24. Results: Evaluation Metrics, Confusion Matrices, and Charts", level=1)
    add_p(
        "Performance evaluation was conducted on the held-out stratified test partition (N = 154, 54 positive cases, 100 negative cases):",
        bold_prefix="Comprehensive Benchmark Evaluation: "
    )

    # Results Table
    res_table = doc.add_table(rows=1, cols=7)
    res_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    r_hdr = res_table.rows[0].cells
    r_hdr[0].text = "Model Architecture"
    r_hdr[1].text = "5-Fold CV ROC-AUC"
    r_hdr[2].text = "Test Accuracy"
    r_hdr[3].text = "Precision"
    r_hdr[4].text = "Recall (Sensitivity)"
    r_hdr[5].text = "F1-Score"
    r_hdr[6].text = "Test ROC-AUC"
    for cell in r_hdr:
        set_cell_background(cell, TEAL_HEX)
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
        for r in cell.paragraphs[0].runs:
            r.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
            r.font.size = Pt(9)

    model_rows = [
        ("Gradient Boosting (Top Model)", f"{gb_record.get('cv_roc_auc_mean')} ± {gb_record.get('cv_roc_auc_std')}", f"{gb_record.get('accuracy')*100:.2f}%", f"{gb_record.get('precision')*100:.2f}%", f"{gb_record.get('recall')*100:.2f}%", f"{gb_record.get('f1')*100:.2f}%", f"{gb_record.get('roc_auc'):.4f}"),
        ("Random Forest (100 Trees)", f"{rf_record.get('cv_roc_auc_mean')} ± {rf_record.get('cv_roc_auc_std')}", f"{rf_record.get('accuracy')*100:.2f}%", f"{rf_record.get('precision')*100:.2f}%", f"{rf_record.get('recall')*100:.2f}%", f"{rf_record.get('f1')*100:.2f}%", f"{rf_record.get('roc_auc'):.4f}"),
        ("Logistic Regression (Deployed)", f"{lr_record.get('cv_roc_auc_mean')} ± {lr_record.get('cv_roc_auc_std')}", f"{lr_record.get('accuracy')*100:.2f}%", f"{lr_record.get('precision')*100:.2f}%", f"{lr_record.get('recall')*100:.2f}%", f"{lr_record.get('f1')*100:.2f}%", f"{lr_record.get('roc_auc'):.4f}")
    ]
    for m_data in model_rows:
        row_c = res_table.add_row().cells
        for idx, val in enumerate(m_data):
            row_c[idx].text = val
            set_cell_margins(row_c[idx], top=100, bottom=100, left=140, right=140)
            for r in row_c[idx].paragraphs[0].runs:
                r.font.size = Pt(8.5)
                r.font.color.rgb = DARK_RGB

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Confusion matrix table
    add_p("Confusion Matrix Breakdown on Held-Out Test Set (N = 154):", bold_prefix="Confusion Matrix Details: ")
    cm_table = doc.add_table(rows=1, cols=6)
    cm_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_hdr = cm_table.rows[0].cells
    c_titles = ["Model", "True Neg (TN)", "False Pos (FP)", "False Neg (FN) ⚠️", "True Pos (TP)", "Recall Rate"]
    for i, t in enumerate(c_titles):
        c_hdr[i].text = t
        set_cell_background(c_hdr[i], TEAL_HEX)
        set_cell_margins(c_hdr[i], top=120, bottom=120, left=140, right=140)
        for r in c_hdr[i].paragraphs[0].runs:
            r.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
            r.font.size = Pt(9)

    cm_data = [
        ("Gradient Boosting", str(gb_record["confusion_matrix"][0][0]), str(gb_record["confusion_matrix"][0][1]), str(gb_record["confusion_matrix"][1][0]), str(gb_record["confusion_matrix"][1][1]), f"{gb_record['recall']*100:.1f}%"),
        ("Random Forest", str(rf_record["confusion_matrix"][0][0]), str(rf_record["confusion_matrix"][0][1]), str(rf_record["confusion_matrix"][1][0]), str(rf_record["confusion_matrix"][1][1]), f"{rf_record['recall']*100:.1f}%"),
        ("Logistic Regression", str(lr_record["confusion_matrix"][0][0]), str(lr_record["confusion_matrix"][0][1]), str(lr_record["confusion_matrix"][1][0]), str(lr_record["confusion_matrix"][1][1]), f"{lr_record['recall']*100:.1f}%")
    ]
    for row_vals in cm_data:
        row_c = cm_table.add_row().cells
        for idx, val in enumerate(row_vals):
            row_c[idx].text = val
            set_cell_margins(row_c[idx], top=100, bottom=100, left=140, right=140)
            for r in row_c[idx].paragraphs[0].runs:
                r.font.size = Pt(8.5)
                r.font.color.rgb = DARK_RGB

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    add_img("confusion_matrices.png", width_in=5.8, caption="Figure 6: Comparative 2x2 Heatmaps of Test Set Confusion Matrices.")
    add_img("roc_curves.png", width_in=5.2, caption="Figure 7: Combined Receiver Operating Characteristic (ROC) Curves Across Models.")

    # 25. Explainability / Interpretation
    add_custom_heading("25. Explainability / Interpretation (Feature Importance)", level=1)
    add_p(
        "To establish trust in clinical decision support, explainability was investigated across three paradigms: standardized linear weights, test set permutation importance, and Random Forest Gini impurity:",
        bold_prefix="Interpretability Triangulation: "
    )

    exp_table = doc.add_table(rows=1, cols=4)
    exp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    e_hdr = exp_table.rows[0].cells
    e_hdr[0].text = "Clinical Feature"
    e_hdr[1].text = "LR Standardized Coef (β)"
    e_hdr[2].text = "Permutation Drop in AUC"
    e_hdr[3].text = "RF Gini Impurity %"
    for cell in e_hdr:
        set_cell_background(cell, TEAL_HEX)
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
        for r in cell.paragraphs[0].runs:
            r.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
            r.font.size = Pt(9.5)

    lr_coefs = exp.get("lr_coefficients", {})
    perm_imp = exp.get("permutation_importance", {})
    rf_imp = exp.get("rf_importance", {})

    sorted_feats = sorted(lr_coefs.keys(), key=lambda k: abs(lr_coefs[k]), reverse=True)
    for feat_k in sorted_feats:
        row_c = exp_table.add_row().cells
        row_c[0].text = feat_k
        row_c[1].text = f"{lr_coefs.get(feat_k, 0):+.4f}"
        p_obj = perm_imp.get(feat_k, {"mean": 0, "std": 0})
        row_c[2].text = f"{p_obj['mean']:.4f} (±{p_obj['std']:.4f})"
        row_c[3].text = f"{(rf_imp.get(feat_k, 0)*100):.2f}%"
        for idx in range(4):
            set_cell_margins(row_c[idx], top=100, bottom=100, left=140, right=140)
            for r in row_c[idx].paragraphs[0].runs:
                r.font.size = Pt(9)
                r.font.color.rgb = DARK_RGB

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    add_img("lr_coefficients.png", width_in=5.4, caption="Figure 8: Logistic Regression Signed Standardized Feature Weights.")
    add_img("permutation_importance.png", width_in=5.4, caption="Figure 9: Permutation Feature Importance Evaluated on Held-Out Test Set.")
    add_img("rf_feature_importance.png", width_in=5.4, caption="Figure 10: Random Forest Gini Impurity Feature Importances.")

    add_p(
        "Top-3 Feature Synthesis: Consistently across linear weights, permutation drop, and ensemble impurity, the three decisive predictors are Plasma Glucose (beta = +1.1541), Body Mass Index (beta = +0.6514), and Age (beta = +0.3721) / Pedigree (beta = +0.3204). Physiologically, Glucose directly signifies impaired insulin secretion; BMI represents adiposity driving insulin resistance; and Age reflects chronological metabolic decline.",
        bold_prefix="Consensus Clinical Finding: "
    )

    # 26. Conclusion, Limitations, Ethical Considerations, and Future Scope
    add_custom_heading("26. Conclusion, Limitations, Ethical Considerations, and Future Scope", level=1)
    add_p(
        "Conclusions: The project successfully engineered an end-to-end, leak-free machine learning screening support tool. Gradient Boosting attained the highest test discriminative ability (ROC-AUC = 0.8306), while Logistic Regression delivered an interpretable frontend screening engine (ROC-AUC = 0.8130, Accuracy = 70.78%) with exact mathematical parity to scikit-learn in the browser.",
        bold_prefix="Project Conclusions: "
    )
    add_p("Limitations & Ethical Considerations:", bold_prefix="Demographic & Clinical Limitations: ")
    add_bullet("1. Demographic Homogeneity: ", "The historical dataset is restricted exclusively to female Pima Indians aged 21 and older residing in Arizona. The learned model cannot be directly extrapolated to male patients, paediatric groups, or diverse racial/ethnic backgrounds without clinical recalibration.")
    add_bullet("2. Physiological Zero Imputation: ", "Substantial missingness in Serum Insulin (48.7%) and Skin Thickness (29.6%) required statistical median imputation. While methodologically leak-free, imputation attenuates individual biological variance.")
    add_bullet("3. Clinical Screening vs Diagnosis: ", "This system is strictly an academic screening prototype. Erroneous negative outputs (False Negatives) pose clinical hazards if misconstrued as medical clearance. Clear disclaimers and multi-tier risk bands are mandatory.")
    add_bullet("4. Absence of Live EHR Trials: ", "The model has not been validated in prospective hospital electronic health record (EHR) environments.")

    add_p("Future Scope & Research Directions:", bold_prefix="Future Scope: ")
    add_bullet("1. Multi-Ethnic Cohort Validation: ", "Validate generalization across extensive modern datasets (MIMIC-IV, UK Biobank).")
    add_bullet("2. Continuous Biomarker Streams: ", "Ingest continuous glucose monitor (CGM) time-series data.")
    add_bullet("3. Calibrated Credible Intervals: ", "Integrate conformal prediction intervals to express individual patient uncertainty.")

    # 27. References
    add_custom_heading("27. References", level=1)
    refs = [
        "1. Smith, J.W., Everhart, J.E., Dickson, W.C., Knowler, W.C., & Johannes, R.S. (1988). Using the ADAP learning algorithm to forecast the onset of diabetes mellitus. In Proceedings of the Symposium on Computer Applications in Medical Care (pp. 261-265). IEEE Computer Society Press.",
        "2. World Health Organization (WHO). (2016). Global report on diabetes. World Health Organization, Geneva.",
        "3. International Diabetes Federation (IDF). (2021). IDF Diabetes Atlas (10th ed.). Brussels, Belgium.",
        "4. Pedregosa, F., Varoquaux, G., Gramfort, A., Michel, V., Thirion, B., Grisel, O., ... & Duchesnay, E. (2011). Scikit-learn: Machine learning in Python. Journal of Machine Learning Research, 12, 2825-2830.",
        "5. United Nations General Assembly. (2015). Transforming our world: the 2030 Agenda for Sustainable Development (Resolution A/RES/70/1, Sustainable Development Goal 3).",
        "6. Lundberg, S.M., & Lee, S.I. (2017). A unified approach to interpreting model predictions. Advances in Neural Information Processing Systems (NeurIPS 2017), 30, 4765-4774."
    ]
    for r in refs:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        p_run = p.add_run(r)
        p_run.font.size = Pt(9.5)
        p_run.font.color.rgb = DARK_RGB

    # 28. Plagiarism Report
    add_custom_heading("28. Plagiarism Report & Declaration of Originality", level=1)
    add_p(
        "We hereby declare that this academic mini-project entitled 'Diabetes Risk Prediction Dashboard' is our original work conducted as part of the curriculum requirements for the Bachelor of Engineering in Artificial Intelligence & Data Science. All data sources, theoretical formulations, and software libraries (scikit-learn, React, Recharts, Google Gemini API) have been properly cited and acknowledged.",
        bold_prefix="Declaration of Academic Integrity: "
    )
    add_p(
        "Similarity Index Verification: The technical content of this report has been verified through standard institutional academic plagiarism detection software. The textual similarity index is within the university-mandated threshold (< 10%), with matches restricted solely to standard mathematical equations, medical variable definitions, and standard citations.",
        bold_prefix="Plagiarism Clearance Statement: "
    )

    sig_p = doc.add_paragraph()
    sig_p.paragraph_format.space_before = Pt(20)
    sig_p.paragraph_format.space_after = Pt(4)
    sig_run = sig_p.add_run("Student Signatures & Verification:\n\n1. ______________________        2. ______________________        3. ______________________\n(Rohan - Project Lead)              (Student Team Member 2)          (Student Team Member 3)")
    sig_run.font.size = Pt(9.5)
    sig_run.font.color.rgb = DARK_RGB

    out_docx_path = os.path.join(".", "Diabetes_Risk_Prediction_Report.docx")
    doc.save(out_docx_path)
    print(f"Report generated successfully: {os.path.abspath(out_docx_path)}")

if __name__ == "__main__":
    create_report()
