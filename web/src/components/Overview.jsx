import React from 'react';

export default function Overview({ results }) {
  if (!results) return <div className="card">Loading overview data...</div>;

  const { meta = {}, best_model = '', models = [] } = results;
  const bestRecord = models.find(m => m.name === best_model) || models[0] || {};

  return (
    <div className="tab-pane">
      {/* Minimalist Hero Banner */}
      <div className="hero-banner card">
        <div className="hero-badge">BE AI&DS Healthcare AI/ML Mini Project</div>
        <h1 className="hero-title">{meta.title || 'Diabetes Risk Prediction Dashboard'}</h1>
        <p className="hero-subtitle">
          An interpretable, evidence-based machine learning screening support tool designed to stratify
          diabetes risk using routine physiological markers, promoting preventive healthcare under UN SDG 3.
        </p>
      </div>

      {/* Top-Performing Pipeline Headline */}
      <div className="section-title">
        <h2>Top-Performing Pipeline: {best_model}</h2>
        <span className="badge badge-green">Highest Test ROC-AUC</span>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Model Architecture</div>
          <div className="metric-value font-sm">{best_model}</div>
          <div className="metric-sub">5-Fold CV: {bestRecord.cv_roc_auc_mean} ± {bestRecord.cv_roc_auc_std}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Test ROC-AUC</div>
          <div className="metric-value text-green">{bestRecord.roc_auc ? (bestRecord.roc_auc).toFixed(4) : 'N/A'}</div>
          <div className="metric-sub">Discriminative capability</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Test Accuracy</div>
          <div className="metric-value">{bestRecord.accuracy ? (bestRecord.accuracy * 100).toFixed(1) + '%' : 'N/A'}</div>
          <div className="metric-sub">Overall correct classifications</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Test Recall (Sensitivity)</div>
          <div className="metric-value text-yellow">{bestRecord.recall ? (bestRecord.recall * 100).toFixed(1) + '%' : 'N/A'}</div>
          <div className="metric-sub">Key screening metric (minimize FN)</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Test Precision</div>
          <div className="metric-value">{bestRecord.precision ? (bestRecord.precision * 100).toFixed(1) + '%' : 'N/A'}</div>
          <div className="metric-sub">Positive predictive value</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Test F1-Score</div>
          <div className="metric-value">{bestRecord.f1 ? (bestRecord.f1 * 100).toFixed(1) + '%' : 'N/A'}</div>
          <div className="metric-sub">Harmonic mean (Prec & Rec)</div>
        </div>
      </div>

      {/* Narrative Two Column Grid */}
      <div className="two-col-grid">
        <div className="card">
          <h3>Clinical Problem Statement</h3>
          <p className="font-sm" style={{ marginTop: 8 }}>
            Diabetes mellitus is a pervasive global metabolic condition characterized by persistent hyperglycemia.
            According to the International Diabetes Federation, over 500 million adults currently live with diabetes,
            with nearly half unaware of their status during early onset. Undetected chronic hyperglycemia leads to
            irreversible microvascular complications (retinopathy, nephropathy, neuropathy) and macrovascular events
            (cardiovascular disease, stroke).
          </p>
          <p className="font-sm" style={{ marginTop: 8 }}>
            Traditional diagnostic workflows rely on fasting plasma glucose or oral glucose tolerance tests requiring
            laboratory infrastructure. This project evaluates non-invasive and minimally invasive clinical features
            (glucose, BMI, age, blood pressure, pedigree) to provide immediate, interpretable risk stratification.
          </p>
        </div>

        <div className="card">
          <h3>Core Objectives & Deployment Philosophy</h3>
          <ul className="bullet-list" style={{ marginTop: 8 }}>
            <li>
              <strong>Leak-Free Pipeline Design:</strong> Biological zero identification and median imputation inside
              cross-validation folds to prevent evaluation bias.
            </li>
            <li>
              <strong>Rigorous Multi-Model Comparison:</strong> Benchmarking Logistic Regression, Random Forest, and
              Gradient Boosting with 5-fold cross-validation and held-out test evaluation.
            </li>
            <li>
              <strong>Transparent Client-Side Deployment:</strong> Deploying Logistic Regression on the frontend to provide
              instant, zero-latency inference with direct signed per-feature log-odds contributions (waterfall explainability).
            </li>
            <li>
              <strong>AI-Assisted Knowledge Discovery:</strong> Integrating a grounded Gemini-powered conversational assistant
              strictly bounded to empirical findings from the analytical pipeline.
            </li>
          </ul>
        </div>
      </div>

      {/* SDG 3 Banner (Minimalist Black & White) */}
      <div className="card sdg-card">
        <div className="sdg-icon">3</div>
        <div className="sdg-content">
          <h4>United Nations SDG 3: Good Health and Well-being</h4>
          <p className="font-sm">
            <strong>Target 3.4 Alignment:</strong> <em>"By 2030, reduce by one third premature mortality from
            non-communicable diseases through prevention and treatment and promote mental health and well-being."</em>
          </p>
          <p className="font-xs text-muted" style={{ marginTop: 4 }}>
            This dashboard demonstrates how computational tools and explainable AI can assist primary screening triage,
            enabling timely lifestyle modifications and clinical follow-ups before severe clinical complications develop.
          </p>
        </div>
      </div>
    </div>
  );
}
