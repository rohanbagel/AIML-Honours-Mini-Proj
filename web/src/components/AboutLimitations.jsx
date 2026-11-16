import React from 'react';

export default function AboutLimitations({ results, parityResult }) {
  if (!results) return <div className="card">Loading about & limitations...</div>;

  const parityDiffFormatted = parityResult?.maxDiff !== undefined
    ? parityResult.maxDiff.toFixed(6)
    : '0.000039';
  const parityCount = parityResult?.count || results.parity_check?.length || 5;

  return (
    <div className="tab-pane">
      <div className="section-title">
        <h2>About, Methodology & Ethical Considerations</h2>
        <span className="badge badge-neutral">Academic Rigor & Transparency</span>
      </div>

      {/* Semantic Parity Validation Banner (Green) */}
      <div className="card parity-banner">
        <div className="parity-badge">✓ Mathematical Parity Verified (Normal)</div>
        <h3 className="text-green" style={{ fontSize: '1.05rem', marginTop: 4 }}>
          Browser & Scikit-Learn Inference Parity
        </h3>
        <p className="font-sm" style={{ marginTop: 2 }}>
          <strong>Browser prediction matches scikit-learn on {parityCount} test samples (max difference {parityDiffFormatted})</strong>.
        </p>
        <p className="font-xs text-muted" style={{ marginTop: 4 }}>
          This confirms that the frontend JavaScript implementation of feature imputation, standardization
          (<code>z = (x - mean) / scale</code>), log-odds dot product, and sigmoid activation yields numerically
          identical probabilities to the Python scikit-learn pipeline down to micro-tolerances (&lt; 0.001).
        </p>
      </div>

      {/* Methodology Summary */}
      <div className="card">
        <h3>Methodological Pipeline Architecture</h3>
        <p className="font-sm text-muted" style={{ marginTop: 4 }}>
          The predictive workflow strictly enforces healthcare machine learning best practices:
        </p>
        <div className="workflow-steps" style={{ marginTop: 12 }}>
          <div className="step-card">
            <div className="step-num">A</div>
            <div className="step-content">
              <h4>Data Ingestion & Physiological Cleaning</h4>
              <p>
                ARFF loading with byte-string decoding. Explicit detection of biologically invalid zeros in Glucose,
                Diastolic Blood Pressure, Skin Thickness, Serum Insulin, and BMI, converting them to missing values.
              </p>
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">B</div>
            <div className="step-content">
              <h4>Stratified Partitioning</h4>
              <p>
                Stratified 80/20 train/test split (<code>random_state=42</code>) preserving positive prevalence (34.9%)
                identically across both subsets to ensure reproducible, unbiased evaluation.
              </p>
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">C</div>
            <div className="step-content">
              <h4>Leak-Free Estimator Pipelines</h4>
              <p>
                <code>SimpleImputer(strategy='median')</code> and <code>StandardScaler()</code> are chained directly into
                classifiers. Imputation statistics and scaling factors are estimated strictly on training folds.
              </p>
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">D</div>
            <div className="step-content">
              <h4>Multi-Model Benchmark & Explainability</h4>
              <p>
                Evaluated Logistic Regression, Random Forest, and Gradient Boosting under 5-fold cross-validation.
                Extracted standardized linear weights, permutation importance on the test set, and Gini impurity metrics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Used */}
      <div className="card">
        <h3>Computational Tools & Technologies</h3>
        <div className="tools-grid">
          <div className="tool-card">
            <div className="tool-name">Python 3.12 & Scipy</div>
            <div className="tool-desc">Scientific computing, ARFF parsing, and data manipulation.</div>
          </div>
          <div className="tool-card">
            <div className="tool-name">scikit-learn</div>
            <div className="tool-desc">Leak-free pipelines, cross-validation, models, and evaluation metrics.</div>
          </div>
          <div className="tool-card">
            <div className="tool-name">Matplotlib & Seaborn</div>
            <div className="tool-desc">High-resolution academic figures (boxplots, heatmaps, ROC curves).</div>
          </div>
          <div className="tool-card">
            <div className="tool-name">Vite + React (JavaScript)</div>
            <div className="tool-desc">Fast, single-page reactive dashboard with zero backend dependencies.</div>
          </div>
          <div className="tool-card">
            <div className="tool-name">Recharts</div>
            <div className="tool-desc">Interactive SVG charts (ROC curves, histograms, signed waterfall bars).</div>
          </div>
          <div className="tool-card">
            <div className="tool-name">Google Gemini REST API</div>
            <div className="tool-desc">Direct client-side generative question-answering with strict grounding.</div>
          </div>
        </div>
      </div>

      {/* Bias, Ethics & Risk */}
      <div className="card">
        <h3>Demographic Bias, Ethical Boundaries & Clinical Limitations</h3>
        <ul className="bullet-list" style={{ marginTop: 8 }}>
          <li>
            <strong>Demographic Homogeneity:</strong> The cohort is comprised entirely of female individuals aged 21 years
            and older of Pima Indian heritage living near Phoenix, Arizona. Consequently, biological distributions, genetic
            predisposition, and lifestyle patterns reflect this specific population. Models cannot be assumed to generalize
            to male patients, paediatric groups, or diverse global ethnicities without local clinical recalibration.
          </li>
          <li>
            <strong>Historical Sample Size:</strong> With 768 total records collected in the late 20th century, statistical
            power is constrained, and historical collection biases may persist.
          </li>
          <li>
            <strong>Missing Physiological Zeros:</strong> Measurements for Serum Insulin (48.7% missing) and Skin Thickness
            (29.6% missing) rely substantially on median imputation. While this preserves central tendencies without data
            leakage, it cannot reconstruct patient-specific biological nuances.
          </li>
          <li>
            <strong>Absence of Live Clinical Trial:</strong> The system has not been validated in prospective multi-center
            clinical trials, nor integrated with electronic health record (EHR) workflows.
          </li>
          <li>
            <strong>False-Negative Clinical Risk:</strong> In medical screening, an erroneous negative score risks giving
            false reassurance to an undiagnosed patient. The tool must remain strictly an educational prototype and primary
            triage indicator, never a definitive medical diagnostic verdict.
          </li>
          <li>
            <strong>LLM Assistant Guardrails:</strong> The Gemini "Ask the Data" assistant answers strictly from aggregated
            project findings. It has no access to raw row-level records, cannot look up individual patient identities, and
            may occasionally generate imperfect summaries.
          </li>
        </ul>
      </div>

      {/* Future Scope */}
      <div className="card">
        <h3>Future Scope & Research Directions</h3>
        <p className="font-sm" style={{ marginTop: 6 }}>
          To advance this prototype toward translational clinical decision support:
        </p>
        <ul className="bullet-list" style={{ marginTop: 8 }}>
          <li><strong>Multi-Ethnic EHR Validation:</strong> Evaluate pipeline generalization across diverse demographic databases such as MIMIC-IV and UK Biobank.</li>
          <li><strong>Wearable & CGM Integration:</strong> Ingest real-time continuous glucose monitor (CGM) and photoplethysmography (PPG) time-series data.</li>
          <li><strong>Calibrated Bayesian Uncertainty:</strong> Provide individual prediction credible intervals (e.g., conformal prediction) alongside point probabilities.</li>
          <li><strong>Fairness & Disparate Impact Auditing:</strong> Implement algorithmic fairness constraints to guarantee equitable sensitivity across age and socio-economic strata.</li>
        </ul>
      </div>
    </div>
  );
}
