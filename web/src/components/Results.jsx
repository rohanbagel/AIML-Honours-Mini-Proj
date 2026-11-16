import React, { useState } from 'react';
import { Award, CheckCircle2, FileBarChart, Layers, ShieldCheck, Target, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function Results({ results }) {
  const models = results.models;
  const bestModel = results.best_model;

  // Prepare combined ROC data points (downsampled to 30 points for smooth rendering)
  const rocPoints = [];
  const sampleIndices = [0, 2, 5, 8, 12, 16, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99];
  
  sampleIndices.forEach((idx) => {
    const lgbm = models.find(m => m.name === 'LightGBM');
    const lr = models.find(m => m.name === 'Logistic Regression');
    const rf = models.find(m => m.name === 'Random Forest');

    rocPoints.push({
      fpr: parseFloat((lgbm.roc.fpr[idx]).toFixed(3)),
      diagonal: parseFloat((lgbm.roc.fpr[idx]).toFixed(3)),
      LightGBM: parseFloat((lgbm.roc.tpr[idx]).toFixed(3)),
      LogisticRegression: parseFloat((lr.roc.tpr[idx]).toFixed(3)),
      RandomForest: parseFloat((rf.roc.tpr[idx]).toFixed(3))
    });
  });

  return (
    <div>
      {/* Top Banner: Best Model Highlight */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(5, 102, 141, 0.05), rgba(2, 128, 144, 0.08))', borderLeft: '4px solid var(--navy)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Award size={20} color="var(--navy)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)' }}>
                Discriminative Benchmark Champion: LightGBM Classifier
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              LightGBM achieved the highest test discriminative power with <strong>ROC-AUC = {bestModel.roc_auc.toFixed(4)}</strong> and <strong>PR-AUC = {bestModel.pr_auc.toFixed(4)}</strong>. 
              Logistic Regression (ROC-AUC = <strong>0.6415</strong>) was selected for client-side web deployment to guarantee 100% mathematical transparency and counterfactual intervention explainability.
            </p>
          </div>
          <span className="badge badge-navy" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
            5-Fold Stratified CV
          </span>
        </div>
      </div>

      {/* Model Benchmark Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <FileBarChart size={20} color="var(--navy)" />
              Model Performance Benchmark Summary
            </h2>
            <p className="card-subtitle">Evaluated on stratified holdout test split ($N = 13,998$ encounters)</p>
          </div>
          <span className="badge badge-teal">Test Holdout Metrics</span>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model Architecture</th>
                <th>5-Fold CV AUC</th>
                <th>Test ROC-AUC</th>
                <th>Test PR-AUC</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall (Sensitivity)</th>
                <th>F1-Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => {
                const isBest = m.name === 'LightGBM';
                const isDeployed = m.name === 'Logistic Regression';
                return (
                  <tr key={m.name} style={{ backgroundColor: isDeployed ? 'rgba(2, 128, 144, 0.04)' : undefined }}>
                    <td style={{ fontWeight: 700, color: 'var(--navy)' }}>
                      {m.name}
                      {isDeployed && <span className="badge badge-mint" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>Deployed Engine</span>}
                      {isBest && <span className="badge badge-navy" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>Top AUC</span>}
                    </td>
                    <td className="font-mono">{m.cv_roc_auc_mean.toFixed(4)} &plusmn; {m.cv_roc_auc_std.toFixed(4)}</td>
                    <td className="font-mono" style={{ fontWeight: 800, color: 'var(--navy)' }}>{m.roc_auc.toFixed(4)}</td>
                    <td className="font-mono">{m.pr_auc.toFixed(4)}</td>
                    <td className="font-mono">{(m.accuracy * 100).toFixed(2)}%</td>
                    <td className="font-mono">{(m.precision * 100).toFixed(2)}%</td>
                    <td className="font-mono" style={{ fontWeight: 700, color: m.recall > 0.5 ? 'var(--teal-primary)' : 'var(--text-muted)' }}>
                      {(m.recall * 100).toFixed(2)}%
                    </td>
                    <td className="font-mono">{m.f1.toFixed(4)}</td>
                    <td>
                      <span className={`badge ${isDeployed ? 'badge-teal' : isBest ? 'badge-navy' : 'badge-yellow'}`}>
                        {isDeployed ? 'Web Transp.' : isBest ? 'Highest AUC' : 'Baseline'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Combined ROC Curves & Confusion Matrices */}
      <div className="grid-2">
        {/* ROC Curves Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Target size={18} color="var(--teal-primary)" />
                Comparative ROC Curves
              </h3>
              <p className="card-subtitle">True Positive Rate vs False Positive Rate across decision thresholds</p>
            </div>
            <span className="badge badge-navy">ROC Curves</span>
          </div>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocPoints} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis 
                  dataKey="fpr" 
                  type="number" 
                  domain={[0, 1]} 
                  tick={{ fontSize: 11 }} 
                  label={{ value: 'False Positive Rate (1 - Specificity)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748B' }} 
                />
                <YAxis 
                  domain={[0, 1]} 
                  tick={{ fontSize: 11 }} 
                  label={{ value: 'True Positive Rate (Sensitivity)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#64748B' }} 
                />
                <Tooltip 
                  formatter={(val, name) => [`${val}`, name]}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="LightGBM" stroke="#05668D" strokeWidth={2.5} dot={false} name="LightGBM (0.6465)" />
                <Line type="monotone" dataKey="LogisticRegression" stroke="#028090" strokeWidth={2} dot={false} name="LogReg (0.6415)" />
                <Line type="monotone" dataKey="RandomForest" stroke="#A38C00" strokeWidth={1.5} dot={false} name="RandForest (0.6284)" />
                <Line type="monotone" dataKey="diagonal" stroke="#CBD5E1" strokeDasharray="5 5" strokeWidth={1} dot={false} name="Random Chance (0.50)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrices Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Layers size={18} color="var(--navy)" />
                Confusion Matrix: Deployed Logistic Regression
              </h3>
              <p className="card-subtitle">Evaluated at balanced decision threshold ($N = 13,998$)</p>
            </div>
            <span className="badge badge-mint">Sensitivity: 54.65%</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
            <div style={{ backgroundColor: 'rgba(2, 195, 154, 0.12)', border: '1px solid rgba(2, 195, 154, 0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#007A5E', textTransform: 'uppercase' }}>True Negatives (TN)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy)', margin: '0.2rem 0' }}>8,489</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Correctly classified stable patients</div>
            </div>

            <div style={{ backgroundColor: 'rgba(240, 243, 189, 0.5)', border: '1px solid #DCE399', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#665900', textTransform: 'uppercase' }}>False Positives (FP)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#665900', margin: '0.2rem 0' }}>4,252</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Flagged for transitional care (Preventative)</div>
            </div>

            <div style={{ backgroundColor: 'rgba(225, 29, 72, 0.1)', border: '1px solid rgba(225, 29, 72, 0.25)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#E11D48', textTransform: 'uppercase' }}>False Negatives (FN)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#E11D48', margin: '0.2rem 0' }}>570</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Acute readmissions missed</div>
            </div>

            <div style={{ backgroundColor: 'rgba(2, 128, 144, 0.15)', border: '1px solid rgba(2, 128, 144, 0.35)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--teal-primary)', textTransform: 'uppercase' }}>True Positives (TP)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--teal-primary)', margin: '0.2rem 0' }}>687</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Correctly identified acute readmissions</div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              <strong>Clinical Significance of High Sensitivity:</strong> In hospital readmission prevention, a False Positive simply results in providing a patient with an extra 48-hour telehealth check or home health visit, whereas a False Negative can lead to an unmonitored acute relapse or death. Our model captures <strong>54.65%</strong> of all acute readmissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
