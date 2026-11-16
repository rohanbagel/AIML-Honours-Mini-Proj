import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';

export default function Results({ results }) {
  if (!results) return <div className="card">Loading results data...</div>;

  const { models = [], best_model = '' } = results;

  // Build unified ROC chart data
  const rocPoints = 50;
  const rocChartData = [];
  for (let step = 0; step <= rocPoints; step++) {
    const targetFpr = Number((step / rocPoints).toFixed(2));
    const entry = {
      fpr: targetFpr,
      'Chance Baseline': targetFpr
    };

    models.forEach(m => {
      const { fpr = [], tpr = [] } = m.roc || {};
      if (fpr.length > 0 && tpr.length > 0) {
        let interpTpr = 0;
        for (let j = 0; j < fpr.length - 1; j++) {
          if (targetFpr >= fpr[j] && targetFpr <= fpr[j + 1]) {
            const span = fpr[j + 1] - fpr[j];
            const weight = span > 0 ? (targetFpr - fpr[j]) / span : 0;
            interpTpr = tpr[j] + weight * (tpr[j + 1] - tpr[j]);
            break;
          }
        }
        if (targetFpr >= fpr[fpr.length - 1]) {
          interpTpr = 1.0;
        }
        entry[m.name] = Number(interpTpr.toFixed(3));
      }
    });

    rocChartData.push(entry);
  }

  // Minimalist monochrome lines with green for deployed Logistic Regression
  const modelColors = {
    'Gradient Boosting': '#09090b',
    'Random Forest': '#71717a',
    'Logistic Regression': '#16a34a'
  };

  const bestRecord = models.find(m => m.name === best_model) || models[0] || {};

  return (
    <div className="tab-pane">
      <div className="section-title">
        <h2>Model Evaluation & Held-Out Test Performance</h2>
        <span className="badge badge-neutral">Test Set N = 154</span>
      </div>

      {/* Benchmark Table */}
      <div className="card">
        <h3>Comprehensive Model Benchmark Table</h3>
        <p className="font-xs text-muted" style={{ marginTop: 4 }}>
          Evaluated on the held-out stratified 20% test partition. The top-performing architecture is highlighted.
        </p>
        <div className="table-responsive" style={{ marginTop: 12 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Model Architecture</th>
                <th>5-Fold CV ROC-AUC</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall (Sensitivity)</th>
                <th>F1-Score</th>
                <th>Test ROC-AUC</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {models.map(m => {
                const isBest = m.name === best_model;
                return (
                  <tr key={m.name} className={isBest ? 'highlight-row' : ''}>
                    <td><strong>{m.name}</strong></td>
                    <td>{m.cv_roc_auc_mean} ± {m.cv_roc_auc_std}</td>
                    <td>{(m.accuracy * 100).toFixed(1)}%</td>
                    <td>{(m.precision * 100).toFixed(1)}%</td>
                    <td><strong>{(m.recall * 100).toFixed(1)}%</strong></td>
                    <td>{(m.f1 * 100).toFixed(1)}%</td>
                    <td><strong className="text-green">{(m.roc_auc).toFixed(4)}</strong></td>
                    <td>
                      {isBest ? (
                        <span className="badge badge-green">Top ROC-AUC</span>
                      ) : m.name === 'Logistic Regression' ? (
                        <span className="badge badge-neutral">Web Deployed</span>
                      ) : (
                        <span className="badge badge-gray">Benchmark</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Semantic Confusion Matrix Cards */}
      <div className="section-title" style={{ marginTop: 25 }}>
        <h3>2x2 Labeled Confusion Matrices</h3>
        <span className="badge badge-neutral">Ground Truth vs Predictions</span>
      </div>

      <div className="three-col-grid">
        {models.map(m => {
          const cm = m.confusion_matrix || [[0, 0], [0, 0]];
          const tn = cm[0][0];
          const fp = cm[0][1];
          const fn = cm[1][0];
          const tp = cm[1][1];
          const total = tn + fp + fn + tp;

          return (
            <div key={m.name} className="card cm-card">
              <div className="cm-title">
                <h4>{m.name}</h4>
                <span className="font-xs text-muted">Total: {total}</span>
              </div>

              <div className="cm-grid">
                <div className="cm-header-cell"></div>
                <div className="cm-header-cell">Pred Neg</div>
                <div className="cm-header-cell">Pred Pos</div>

                <div className="cm-row-label">Actual Neg</div>
                <div className="cm-cell cm-tn" title="True Negatives: Correct non-diabetic (Normal / Green)">
                  <div className="cm-cell-val">{tn}</div>
                  <div className="cm-cell-lbl">TN ({((tn / total) * 100).toFixed(0)}%)</div>
                </div>
                <div className="cm-cell cm-fp" title="False Positives: Non-diabetic incorrectly flagged (Warning / Yellow)">
                  <div className="cm-cell-val">{fp}</div>
                  <div className="cm-cell-lbl">FP ({((fp / total) * 100).toFixed(0)}%)</div>
                </div>

                <div className="cm-row-label">Actual Pos</div>
                <div className="cm-cell cm-fn" title="False Negatives: Diabetic cases missed! (Error / Red)">
                  <div className="cm-cell-val">{fn}</div>
                  <div className="cm-cell-lbl text-red font-bold">FN ({((fn / total) * 100).toFixed(0)}%)</div>
                </div>
                <div className="cm-cell cm-tp" title="True Positives: Correctly detected diabetic cases">
                  <div className="cm-cell-val">{tp}</div>
                  <div className="cm-cell-lbl">TP ({((tp / total) * 100).toFixed(0)}%)</div>
                </div>
              </div>

              <div className="cm-footer">
                <div>Recall: <strong>{(m.recall * 100).toFixed(1)}%</strong></div>
                <div>Accuracy: <strong>{(m.accuracy * 100).toFixed(1)}%</strong></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Combined ROC Curves */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3>Combined Receiver Operating Characteristic (ROC) Curves</h3>
        <p className="font-xs text-muted" style={{ marginTop: 4 }}>
          True Positive Rate (Recall) vs False Positive Rate (1 - Specificity) across decision thresholds.
        </p>

        <div style={{ height: 350, marginTop: 15 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rocChartData} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="fpr"
                type="number"
                domain={[0, 1]}
                tickCount={6}
                label={{ value: 'False Positive Rate (1 - Specificity)', position: 'insideBottom', offset: -15, fill: '#71717a' }}
              />
              <YAxis
                domain={[0, 1]}
                tickCount={6}
                label={{ value: 'True Positive Rate (Sensitivity / Recall)', angle: -90, position: 'insideLeft', fill: '#71717a' }}
              />
              <Tooltip formatter={(val, name) => [val, name]} />
              <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 15 }} />

              <Line
                type="monotone"
                dataKey="Chance Baseline"
                stroke="#a1a1aa"
                strokeDasharray="4 4"
                dot={false}
                strokeWidth={1.5}
              />
              {models.map(m => (
                <Line
                  key={m.name}
                  type="monotone"
                  dataKey={m.name}
                  stroke={modelColors[m.name] || '#09090b'}
                  dot={false}
                  strokeWidth={2.2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Clinical Interpretation */}
      <div className="card interpretation-card">
        <h3>Clinical Interpretation: The Primacy of Recall & Trade-Offs</h3>
        <p className="font-sm" style={{ marginTop: 8 }}>
          In early clinical screening, <strong>Recall (Sensitivity = {bestRecord.recall ? (bestRecord.recall * 100).toFixed(1) + '%' : ''})</strong> is
          the paramount metric. A <em>False Negative (Red)</em> represents a diabetic individual who is mistakenly classified as healthy,
          resulting in delayed diagnosis, missed opportunities for lifestyle intervention, and unmitigated disease progression.
          Conversely, a <em>False Positive (Yellow)</em> results merely in secondary confirmatory blood tests (e.g. HbA1c), which carries
          minimal physical risk.
        </p>
        <p className="font-sm" style={{ marginTop: 8 }}>
          Among candidate pipelines, <strong>{best_model}</strong> attained the highest test discriminative power
          (ROC-AUC = {bestRecord.roc_auc?.toFixed(4)}, Accuracy = {bestRecord.accuracy ? (bestRecord.accuracy * 100).toFixed(1) + '%' : ''}).
          However, <strong>Logistic Regression</strong> was selected for frontend deployment due to its linear interpretability
          (allowing transparent per-feature log-odds decomposition), calibrated probabilities, and zero-latency browser execution.
        </p>
      </div>
    </div>
  );
}
