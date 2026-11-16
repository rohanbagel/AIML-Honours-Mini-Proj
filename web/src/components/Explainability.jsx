import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Sliders, Shield, TrendingUp, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export default function Explainability({ results }) {
  const exp = results.explainability;
  const lrCoefs = exp.lr_coefficients;
  const lgbmImp = exp.lgbm_importance;

  // Format top positive and negative LR coefficients for chart
  const topRiskDrivers = Object.entries(lrCoefs)
    .filter(([k, v]) => v > 0.05)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([feat, coef]) => ({
      feature: formatFeatureLabel(feat),
      rawKey: feat,
      coefficient: coef,
      oddsRatio: Math.exp(coef).toFixed(2),
      color: '#E11D48'
    }));

  const topProtectiveFactors = Object.entries(lrCoefs)
    .filter(([k, v]) => v < -0.05)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 8)
    .map(([feat, coef]) => ({
      feature: formatFeatureLabel(feat),
      rawKey: feat,
      coefficient: coef,
      oddsRatio: Math.exp(coef).toFixed(2),
      color: '#02C39A'
    }));

  // Top LightGBM features
  const topLgbm = Object.entries(lgbmImp)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([feat, imp]) => ({
      feature: formatFeatureLabel(feat),
      importance: imp
    }));

  return (
    <div>
      {/* Intro Header */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <Sliders size={20} color="var(--navy)" />
              Clinical Explainability & Feature Attribution
            </h2>
            <p className="card-subtitle">
              Standardized Logistic Regression Odds Ratios and LightGBM Information Gain
            </p>
          </div>
          <span className="badge badge-teal">Transparent ML</span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Unlike black-box neural networks, our model architecture provides clinical explainability. 
          Standardized logistic regression coefficients directly quantify how each standard-deviation shift or categorical 
          state transition alters the log-odds of a 30-day hospital readmission, enabling clinicians to separate 
          <strong> fixed historical risk</strong> from <strong>modifiable inpatient interventions</strong>.
        </p>
      </div>

      {/* Grid: Risk Drivers vs Protective Factors */}
      <div className="grid-2">
        {/* Top Risk Factors */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <AlertTriangle size={18} color="#E11D48" />
                Top Factors Increasing Readmission Risk
              </h3>
              <p className="card-subtitle">Positive coefficients (&beta; &gt; 0, Odds Ratio &gt; 1.0)</p>
            </div>
            <span className="badge badge-red">Risk Drivers</span>
          </div>

          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topRiskDrivers} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="feature" type="category" width={140} tick={{ fontSize: 10, fill: '#0F172A' }} />
                <Tooltip 
                  formatter={(val, name, item) => [`Coefficient: +${val.toFixed(3)} (OR: ${item.payload.oddsRatio}x)`, 'Risk Impact']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                />
                <Bar dataKey="coefficient" fill="#E11D48" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="table-wrap" style={{ marginTop: '0.75rem' }}>
            <table className="data-table" style={{ fontSize: '0.75rem' }}>
              <thead>
                <tr>
                  <th>Clinical Factor</th>
                  <th>Log-Odds (&beta;)</th>
                  <th>Odds Ratio</th>
                  <th>Clinical Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {topRiskDrivers.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{row.feature}</td>
                    <td className="font-mono" style={{ color: '#E11D48' }}>+{row.coefficient.toFixed(3)}</td>
                    <td className="font-mono"><strong>{row.oddsRatio}x</strong></td>
                    <td>{getClinicalDriverNote(row.rawKey)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Protective Factors */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <CheckCircle size={18} color="#02C39A" />
                Top Factors Reducing Readmission Risk
              </h3>
              <p className="card-subtitle">Negative coefficients (&beta; &lt; 0, Protective Effect)</p>
            </div>
            <span className="badge badge-mint">Protective Factors</span>
          </div>

          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topProtectiveFactors} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="feature" type="category" width={140} tick={{ fontSize: 10, fill: '#0F172A' }} />
                <Tooltip 
                  formatter={(val, name, item) => [`Coefficient: ${val.toFixed(3)} (OR: ${item.payload.oddsRatio}x)`, 'Protective Impact']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                />
                <Bar dataKey="coefficient" fill="#02C39A" radius={[4, 0, 0, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="table-wrap" style={{ marginTop: '0.75rem' }}>
            <table className="data-table" style={{ fontSize: '0.75rem' }}>
              <thead>
                <tr>
                  <th>Clinical Factor</th>
                  <th>Log-Odds (&beta;)</th>
                  <th>Odds Ratio</th>
                  <th>Clinical Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {topProtectiveFactors.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{row.feature}</td>
                    <td className="font-mono" style={{ color: '#007A5E' }}>{row.coefficient.toFixed(3)}</td>
                    <td className="font-mono"><strong>{row.oddsRatio}x</strong></td>
                    <td>{getClinicalProtectiveNote(row.rawKey)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Clinical Actionability Matrix: Modifiable vs Non-Modifiable */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Shield size={18} color="var(--navy)" />
              Clinical Actionability Matrix: Modifiable vs Fixed Inpatient Variables
            </h3>
            <p className="card-subtitle">Translating machine learning coefficients into discharge planning interventions</p>
          </div>
          <span className="badge badge-navy">Clinical Utility</span>
        </div>

        <div className="grid-2">
          <div style={{ backgroundColor: 'rgba(2, 128, 144, 0.04)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(2, 128, 144, 0.2)' }}>
            <h4 style={{ color: 'var(--teal-primary)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={16} /> Modifiable Clinical Interventions (Inpatient Care Team)
            </h4>
            <ul style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', lineHeight: '1.7' }}>
              <li><strong>Inpatient HbA1c Lab Ordering:</strong> Measuring HbA1c establishes long-term glycemic baseline and triggers post-discharge treatment guidelines.</li>
              <li><strong>Insulin Regimen Stabilization:</strong> Discharging patients on stable maintenance doses rather than volatile acute upward titrations reduces readmission odds.</li>
              <li><strong>Medication Reconciliation:</strong> Resolving conflicting oral hypoglycemics and diabetes medications before physical discharge.</li>
              <li><strong>Safe Discharge Disposition:</strong> Providing comprehensive home healthcare support rather than unassisted discharge for borderline patients.</li>
            </ul>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ color: 'var(--navy)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} /> Non-Modifiable Risk Stratifiers (Baseline Risk)
            </h4>
            <ul style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', lineHeight: '1.7' }}>
              <li><strong>Prior Inpatient Hospitalization Count:</strong> Past hospital utilization is the single strongest epidemiological marker of biological vulnerability.</li>
              <li><strong>Patient Age Bracket (60–80, 80–100):</strong> Biological senescence, frailty, and polypharmacy complications increase readmission susceptibility.</li>
              <li><strong>High Comorbidity Index (&ge;7 Diagnoses):</strong> Multimorbid patients (cardiovascular + renal + metabolic) have systemic fragility.</li>
              <li><strong>Emergency Admission Presentation:</strong> Unscheduled acute admissions reflect decompensated chronic disease.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatFeatureLabel(name) {
  const map = {
    discharge_group_Transfer_Facility: 'Transfer to Skilled Facility',
    discharge_group_Home_Health: 'Discharge with Home Health',
    discharge_group_Other: 'Other Discharge Disposition',
    'age_cleaned_60-80': 'Age 60-80 Years',
    'age_cleaned_80-100': 'Age 80-100 Years',
    'age_cleaned_20-40': 'Age 20-40 Years',
    'age_cleaned_40-60': 'Age 40-60 Years',
    diabetesMed_Yes: 'Prescribed Diabetes Meds',
    has_prior_inpatient: 'Prior Inpatient Stay',
    time_in_hospital: 'Length of Stay (Days)',
    number_diagnoses: 'Diagnoses Count (Comorbidities)',
    insulin_Up: 'Insulin Regimen Titrated Up',
    primary_diagnosis_Respiratory: 'Primary: Respiratory',
    primary_diagnosis_Musculoskeletal: 'Primary: Musculoskeletal',
    A1Cresult_None: 'No HbA1c Lab Tested',
    insulin_No: 'No Insulin Prescribed',
    insulin_Steady: 'Stable Insulin Regimen'
  };
  return map[name] || name.replace(/_/g, ' ');
}

function getClinicalDriverNote(key) {
  if (key.includes('Transfer_Facility')) return 'Reflects severe functional limitation and post-acute rehabilitation needs';
  if (key.includes('60-80') || key.includes('80-100')) return 'Advanced age elevates frailty and polypharmacy interaction risk';
  if (key.includes('diabetesMed')) return 'Pharmacotherapy requirement flags active disease management complexity';
  if (key.includes('Home_Health')) return 'Patient required visiting clinical nurse for activities of daily living';
  return 'Elevates 30-day baseline readmission probability';
}

function getClinicalProtectiveNote(key) {
  if (key.includes('Respiratory')) return 'Acute infections (pneumonia) often resolve with targeted antibiotic discharge';
  if (key.includes('Musculoskeletal')) return 'Elective orthopedic recoveries follow predictable post-op trajectories';
  if (key.includes('Steady')) return 'Glycemic regimen stability avoids post-discharge hypoglycemia crises';
  if (key.includes('insulin_No')) return 'Diet-controlled diabetes indicates less advanced microvascular disease';
  return 'Associated with lower acute readmission likelihood';
}
