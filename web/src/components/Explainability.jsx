import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';

export default function Explainability({ results }) {
  if (!results) return <div className="card">Loading explainability metrics...</div>;

  const { explainability = {}, best_model = '' } = results;
  const { lr_coefficients = {}, permutation_importance = {}, rf_importance = {} } = explainability;

  // 1. Logistic Regression coefficients data
  const lrData = Object.entries(lr_coefficients)
    .map(([feat, coef]) => ({
      feature: feat,
      coefficient: coef,
      absCoef: Math.abs(coef)
    }))
    .sort((a, b) => b.coefficient - a.coefficient);

  // 2. Permutation importance data
  const permData = Object.entries(permutation_importance)
    .map(([feat, obj]) => ({
      feature: feat,
      importance: obj.mean,
      std: obj.std
    }))
    .sort((a, b) => b.importance - a.importance);

  // 3. RF importance data
  const rfData = Object.entries(rf_importance)
    .map(([feat, imp]) => ({
      feature: feat,
      importance: imp
    }))
    .sort((a, b) => b.importance - a.importance);

  // Top 3 features by LR magnitude
  const top3LR = [...lrData].sort((a, b) => b.absCoef - a.absCoef).slice(0, 3).map(d => d.feature);
  const top3Summary = `Across standardized linear weights, permutation drop, and ensemble impurity, the three most decisive clinical predictors are consistently ${top3LR[0]}, ${top3LR[1]}, and ${top3LR[2]}.`;

  return (
    <div className="tab-pane">
      <div className="section-title">
        <h2>Model Explainability & Feature Importance</h2>
        <span className="badge badge-neutral">Transparent Clinical Inference</span>
      </div>

      {/* Synthesis Box */}
      <div className="card">
        <h3>Feature Importance Synthesis</h3>
        <p className="font-sm" style={{ marginTop: 6 }}>
          Clinical machine learning models must not operate as opaque decision engines. Here, we cross-examine
          feature relevance using three distinct statistical paradigms: <strong>Linear Log-Odds Weights</strong> (Logistic Regression),
          <strong>Empirical Generalization Drop</strong> (Permutation Importance on test set), and <strong>Gini Impurity Reduction</strong> (Random Forest).
        </p>
        <div className="finding-box" style={{ marginTop: 12 }}>
          <strong>Consensus Finding:</strong> {top3Summary}
        </div>
      </div>

      {/* Two-Column Grid */}
      <div className="two-col-grid">
        {/* LR Signed Coefficients */}
        <div className="card">
          <h3>Logistic Regression Standardized Coefficients</h3>
          <p className="font-xs text-muted" style={{ marginTop: 4 }}>
            Signed impact on log-odds per standard deviation increase. Black increases diabetes risk; Gray reduces risk.
          </p>
          <div style={{ height: 320, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={lrData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                <XAxis type="number" />
                <YAxis dataKey="feature" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => [`${val.toFixed(4)} log-odds`, 'Coefficient']} />
                <Bar dataKey="coefficient" radius={[0, 3, 3, 0]}>
                  {lrData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.coefficient >= 0 ? '#09090b' : '#a1a1aa'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Permutation Importance */}
        <div className="card">
          <h3>Permutation Feature Importance ({best_model})</h3>
          <p className="font-xs text-muted" style={{ marginTop: 4 }}>
            Mean drop in held-out test ROC-AUC when each feature is shuffled randomly (10 repeats).
          </p>
          <div style={{ height: 320, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={permData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                <XAxis type="number" />
                <YAxis dataKey="feature" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val, name, item) => [`${val.toFixed(4)} (±${item.payload.std.toFixed(4)})`, 'ROC-AUC Drop']} />
                <Bar dataKey="importance" fill="#09090b" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Random Forest Gini Impurity Importance */}
      <div className="card">
        <h3>Random Forest Ensemble Feature Importances (Gini Impurity)</h3>
        <p className="font-xs text-muted" style={{ marginTop: 4 }}>
          Normalized total reduction of criterion impurity across all 100 decision trees in the ensemble.
        </p>
        <div style={{ height: 260, marginTop: 10 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rfData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
              <XAxis type="number" />
              <YAxis dataKey="feature" type="category" width={110} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val) => [`${(val * 100).toFixed(2)}%`, 'Relative Gini Importance']} />
              <Bar dataKey="importance" fill="#09090b" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Physiological Discussion */}
      <div className="card">
        <h3>Physiological Rationale for Top Predictors</h3>
        <div className="workflow-steps" style={{ marginTop: 12 }}>
          <div className="step-card">
            <div className="step-num">1</div>
            <div className="step-content">
              <h4>Plasma Glucose Concentration</h4>
              <p>
                Plasma glucose is the definitive physiological marker of impaired insulin secretion and cellular uptake.
                Elevated 2-hour post-load glucose indicates progressive failure of pancreatic β-cells to maintain euglycemia.
              </p>
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <div className="step-content">
              <h4>Body Mass Index (BMI) & Adiposity</h4>
              <p>
                Excess adipose tissue promotes chronic low-grade inflammation, releases elevated free fatty acids,
                and impairs intracellular insulin signaling pathways, driving peripheral insulin resistance.
              </p>
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <div className="step-content">
              <h4>Age & Genetic Pedigree</h4>
              <p>
                Chronological age correlates with cumulative cellular senescence and decreasing metabolic elasticity,
                while the Diabetes Pedigree Function captures inherited polygenic susceptibility.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
