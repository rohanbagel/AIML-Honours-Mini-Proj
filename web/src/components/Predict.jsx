import React, { useState, useEffect } from 'react';
import { predictRisk } from '../predict.js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';

export default function Predict({ results }) {
  if (!results) return <div className="card">Loading predictive engine...</div>;

  const { deployed_model = {}, features = [] } = results;
  const {
    input_ranges = {},
    imputation_medians = {},
    sample_patients = [],
    invalid_zero_features = []
  } = deployed_model;

  // Default initial values
  const defaultValues = {
    Pregnancies: 3,
    Glucose: imputation_medians.Glucose || 117,
    BloodPressure: imputation_medians.BloodPressure || 72,
    SkinThickness: imputation_medians.SkinThickness || 29,
    Insulin: imputation_medians.Insulin || 125,
    BMI: imputation_medians.BMI || 32.3,
    DiabetesPedigreeFunction: 0.372,
    Age: 29
  };

  const [inputs, setInputs] = useState(defaultValues);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    try {
      const pred = predictRisk(inputs, deployed_model);
      setPrediction(pred);
    } catch (err) {
      console.error('Prediction calculation error:', err);
    }
  }, [inputs, deployed_model]);

  const handleChange = (feat, val) => {
    setInputs(prev => ({
      ...prev,
      [feat]: val === '' ? '' : Number(val)
    }));
  };

  const handleLoadSample = (sample) => {
    if (sample && sample.values) {
      setInputs(sample.values);
    }
  };

  const handleReset = () => {
    setInputs(defaultValues);
  };

  const featMap = {};
  features.forEach(f => {
    featMap[f.key] = f;
  });

  // Semantic color for progress fill and percentage text
  const getSemanticColor = (band) => {
    if (band === 'Low') return '#16a34a'; // Green (Normal/Healthy)
    if (band === 'High') return '#dc2626'; // Red (Error/High Risk)
    return '#ca8a04'; // Yellow (Warning/Moderate)
  };

  const riskColor = prediction ? getSemanticColor(prediction.riskBand) : '#16a34a';

  return (
    <div className="tab-pane">
      <div className="section-title">
        <h2>Interactive Diabetes Risk Screening Tool</h2>
        <span className="badge badge-neutral">Client-Side Logistic Regression Inference</span>
      </div>

      {/* Inputs Form Card */}
      <div className="card">
        <div className="card-header-flex">
          <div>
            <h3>Patient Clinical Parameters</h3>
            <p className="font-xs text-muted" style={{ marginTop: 2 }}>
              Adjust patient values below to observe real-time risk calculation and per-feature log-odds contributions.
            </p>
          </div>
          <div className="sample-buttons">
            <span className="font-xs font-bold text-muted">Load Test Sample:</span>
            {sample_patients.map((sp, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-outline"
                onClick={() => handleLoadSample(sp)}
                title={sp.label}
              >
                Sample {idx === 0 ? 'A (Negative)' : 'B (Positive)'}
              </button>
            ))}
            <button type="button" className="btn btn-secondary font-xs" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>

        {/* Input Form Grid */}
        <div className="form-grid">
          {deployed_model.feature_order && deployed_model.feature_order.map((feat) => {
            const range = input_ranges[feat] || { min: 0, max: 200 };
            const meta = featMap[feat] || { label: feat, unit: '' };
            const isZeroSuspect = invalid_zero_features.includes(feat);
            const isCurrentlyImputed = isZeroSuspect && (inputs[feat] === 0 || inputs[feat] === '' || inputs[feat] === undefined);

            return (
              <div key={feat} className="form-group">
                <div className="form-label-row">
                  <label htmlFor={`input-${feat}`} className="form-label">
                    {meta.label}
                  </label>
                  <span className="font-xs text-muted">({meta.unit})</span>
                </div>
                <input
                  id={`input-${feat}`}
                  type="number"
                  step={feat === 'DiabetesPedigreeFunction' || feat === 'BMI' ? '0.01' : '1'}
                  min={range.min}
                  max={range.max}
                  className={`form-input ${isCurrentlyImputed ? 'input-imputed' : ''}`}
                  value={inputs[feat] ?? ''}
                  onChange={(e) => handleChange(feat, e.target.value)}
                  placeholder={`Range: ${range.min} - ${range.max}`}
                />
                <div className="input-hint">
                  {isCurrentlyImputed ? (
                    <span className="text-yellow font-xs font-bold">
                      ⚠️ Imputing median: {imputation_medians[feat]}
                    </span>
                  ) : (
                    <span className="text-muted font-xs">
                      Cohort median: {imputation_medians[feat] ?? 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prediction Output & Risk Breakdown */}
      {prediction && (
        <div className="prediction-result card">
          <div className="pred-header">
            <div>
              <h3>Predicted Diabetes Risk Stratification</h3>
              <p className="font-xs text-muted" style={{ marginTop: 2 }}>
                Mathematical evaluation via sigmoid logit transformation computed directly in your browser.
              </p>
            </div>
            <div className={`risk-badge risk-${prediction.riskBand.toLowerCase()}`}>
              {prediction.riskBand} Risk
            </div>
          </div>

          {/* Probability Gauge & Progress Bar */}
          <div className="risk-display-row">
            <div className="risk-main-stat">
              <div className="risk-percent" style={{ color: riskColor }}>
                {prediction.probabilityPercent}%
              </div>
              <div className="risk-label">Estimated Risk Probability</div>
            </div>

            <div className="progress-container">
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min(Math.max(prediction.probabilityPercent, 2), 100)}%`,
                    backgroundColor: riskColor
                  }}
                />
                <div className="threshold-marker marker-low" title="Low Risk Boundary (30%)" style={{ left: '30%' }}></div>
                <div className="threshold-marker marker-high" title="High Risk Boundary (60%)" style={{ left: '60%' }}></div>
              </div>
              <div className="progress-labels">
                <span className="text-green font-bold">Low Risk (&lt; 30%)</span>
                <span className="text-yellow font-bold">30% - 60% (Moderate)</span>
                <span className="text-red font-bold">&gt; 60% (High Risk)</span>
              </div>
            </div>
          </div>

          {/* Plain Language Interpretation */}
          <div className="finding-box" style={{ marginTop: 15 }}>
            <strong>Plain-Language Explanation:</strong> {prediction.explanation}
          </div>

          {/* Semantic Warning Note if Imputed */}
          {prediction.imputedFeatures.length > 0 && (
            <div className="alert-box alert-warning font-sm" style={{ marginTop: 12 }}>
              ⚠️ <strong>Physiological Imputation Warning:</strong> Zero or blank values for{' '}
              <code>{prediction.imputedFeatures.join(', ')}</code> were automatically imputed using training-set medians.
            </div>
          )}

          {/* Feature Contribution Waterfall Chart */}
          <div style={{ marginTop: 20 }}>
            <h4>Per-Feature Log-Odds Contribution (β<sub>i</sub> · z<sub>i</sub>)</h4>
            <p className="font-xs text-muted" style={{ marginTop: 2 }}>
              Red indicates risk increase; Green indicates risk reduction relative to cohort baseline.
            </p>
            <div style={{ height: 280, marginTop: 10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={prediction.sortedContributions}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                  <XAxis type="number" />
                  <YAxis dataKey="feature" type="category" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val, name, item) => [
                      `${val > 0 ? '+' : ''}${val.toFixed(3)} log-odds (${item.payload.direction})`,
                      'Contribution'
                    ]}
                  />
                  <Bar dataKey="contribution" radius={[0, 3, 3, 0]}>
                    {prediction.sortedContributions.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.contribution >= 0 ? '#dc2626' : '#16a34a'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
