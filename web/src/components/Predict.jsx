import React, { useState, useMemo } from 'react';
import { 
  Activity, AlertCircle, ArrowDownRight, ArrowUpRight, CheckCircle2, 
  ChevronRight, ClipboardCheck, Clock, FileSpreadsheet, HeartPulse, 
  HelpCircle, RefreshCw, ShieldAlert, Sliders, Stethoscope, User, Users, Zap 
} from 'lucide-react';
import { predictReadmission } from '../predict.js';

export default function Predict({ results }) {
  const deployedModel = results.deployed_model;
  const samplePatients = deployedModel.sample_patients;

  // Initial state defaults to Profile B (High-Risk) to immediately demonstrate the power of the simulator
  const [formData, setFormData] = useState({
    time_in_hospital: 7,
    num_lab_procedures: 55,
    num_procedures: 2,
    num_medications: 18,
    number_outpatient: 0,
    number_emergency: 1,
    number_inpatient: 2,
    number_diagnoses: 9,
    total_prior_visits: 3,
    has_prior_inpatient: 1,
    has_prior_emergency: 1,
    a1c_tested: 0,
    high_comorbidity: 1,
    age_cleaned: '60-80',
    gender: 'Female',
    race: 'Caucasian',
    admission_group: 'Emergency_Urgent',
    discharge_group: 'Home',
    primary_diagnosis: 'Circulatory',
    max_glu_serum: 'None',
    A1Cresult: 'None',
    insulin: 'Up',
    change: 'Ch',
    diabetesMed: 'Yes'
  });

  // Counterfactual What-If toggles
  const [whatIfA1c, setWhatIfA1c] = useState(false);
  const [whatIfInsulin, setWhatIfInsulin] = useState(false);
  const [whatIfStay, setWhatIfStay] = useState(false);

  // Load a pre-defined patient persona
  const handleLoadPersona = (patient) => {
    const rawInputs = patient.values || patient.inputs || {};
    setFormData({
      ...rawInputs,
      // Derived features
      total_prior_visits: (rawInputs.number_outpatient || 0) + (rawInputs.number_emergency || 0) + (rawInputs.number_inpatient || 0),
      has_prior_inpatient: (rawInputs.number_inpatient || 0) > 0 ? 1 : 0,
      has_prior_emergency: (rawInputs.number_emergency || 0) > 0 ? 1 : 0,
      a1c_tested: rawInputs.A1Cresult !== 'None' ? 1 : 0,
      high_comorbidity: (rawInputs.number_diagnoses || 0) >= 7 ? 1 : 0
    });
    // Reset what-if toggles
    setWhatIfA1c(false);
    setWhatIfInsulin(false);
    setWhatIfStay(false);
  };

  // Handle manual input updates
  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Update derived features
      if (['number_outpatient', 'number_emergency', 'number_inpatient'].includes(field)) {
        const inp = field === 'number_inpatient' ? parseFloat(value) : prev.number_inpatient;
        const emer = field === 'number_emergency' ? parseFloat(value) : prev.number_emergency;
        const out = field === 'number_outpatient' ? parseFloat(value) : prev.number_outpatient;
        updated.total_prior_visits = inp + emer + out;
        updated.has_prior_inpatient = inp > 0 ? 1 : 0;
        updated.has_prior_emergency = emer > 0 ? 1 : 0;
      }
      if (field === 'number_diagnoses') {
        updated.high_comorbidity = parseFloat(value) >= 7 ? 1 : 0;
      }
      if (field === 'A1Cresult') {
        updated.a1c_tested = value !== 'None' ? 1 : 0;
      }
      return updated;
    });
  };

  // Baseline prediction
  const baselinePrediction = useMemo(() => {
    return predictReadmission(formData);
  }, [formData]);

  // Counterfactual prediction with active interventions applied
  const counterfactualData = useMemo(() => {
    const cf = { ...formData };
    if (whatIfA1c) {
      cf.A1Cresult = 'Norm';
      cf.a1c_tested = 1;
    }
    if (whatIfInsulin) {
      cf.insulin = 'Steady';
      cf.change = 'No';
    }
    if (whatIfStay) {
      cf.time_in_hospital = Math.max(1, cf.time_in_hospital - 2);
    }
    return cf;
  }, [formData, whatIfA1c, whatIfInsulin, whatIfStay]);

  const counterfactualPrediction = useMemo(() => {
    return predictReadmission(counterfactualData);
  }, [counterfactualData]);

  const hasActiveInterventions = whatIfA1c || whatIfInsulin || whatIfStay;
  const riskDelta = counterfactualPrediction.probability - baselinePrediction.probability;
  const relativeReduction = baselinePrediction.probability > 0 
    ? ((Math.abs(riskDelta) / baselinePrediction.probability) * 100).toFixed(1) 
    : '0.0';

  return (
    <div>
      {/* Persona Selection Header */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="var(--navy)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--navy)' }}>
              Pre-loaded Inpatient Profiles:
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {samplePatients.map((sp, idx) => (
              <button
                key={idx}
                className="btn btn-outline btn-sm"
                onClick={() => handleLoadPersona(sp)}
                style={{ fontSize: '0.75rem' }}
              >
                <User size={13} />
                <span>{sp.label.split(':')[1]?.split('(')[0] || `Profile ${idx + 1}`}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Clinical Controls (Left) vs Prognosis Gauge & What-If (Right) */}
      <div className="grid-2">
        {/* Left Column: Clinical Parameters */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Sliders size={20} color="var(--navy)" />
                Inpatient Clinical Parameters
              </h2>
              <p className="card-subtitle">Adjust patient stay attributes and clinical presentation</p>
            </div>
            <span className="badge badge-teal">Live Predictor</span>
          </div>

          {/* Section 1: Inpatient Stay & Utilization */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              1. Stay Duration & Past Utilization
            </h4>

            <div className="form-group">
              <div className="form-label">
                <span>Length of Hospital Stay (Days)</span>
                <span className="form-value-pill">{formData.time_in_hospital} days</span>
              </div>
              <input
                type="range"
                min="1"
                max="14"
                step="1"
                value={formData.time_in_hospital}
                onChange={(e) => handleInputChange('time_in_hospital', parseFloat(e.target.value))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <div className="form-label">
                  <span>Prior Inpatient Visits</span>
                  <span className="form-value-pill">{formData.number_inpatient}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="1"
                  value={formData.number_inpatient}
                  onChange={(e) => handleInputChange('number_inpatient', parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <div className="form-label">
                  <span>Prior Emergency Visits</span>
                  <span className="form-value-pill">{formData.number_emergency}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value={formData.number_emergency}
                  onChange={(e) => handleInputChange('number_emergency', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Complexity & Procedures */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              2. Clinical Complexity & Diagnoses
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Primary Diagnosis (ICD-9)</label>
                <select
                  className="form-select"
                  value={formData.primary_diagnosis}
                  onChange={(e) => handleInputChange('primary_diagnosis', e.target.value)}
                >
                  <option value="Circulatory">Circulatory (Heart Failure, CAD)</option>
                  <option value="Diabetes">Diabetes (Ketoacidosis, Uncontrolled)</option>
                  <option value="Respiratory">Respiratory (Pneumonia, COPD)</option>
                  <option value="Digestive">Digestive (GI Bleed, Obstruction)</option>
                  <option value="Genitourinary">Genitourinary (Kidney, UTI)</option>
                  <option value="Musculoskeletal">Musculoskeletal (Joints, Fractures)</option>
                  <option value="Injury">Injury & Trauma</option>
                  <option value="Neoplasms">Neoplasms (Oncology)</option>
                  <option value="Other">Other / Metabolic</option>
                </select>
              </div>

              <div className="form-group">
                <div className="form-label">
                  <span>Diagnoses Count</span>
                  <span className="form-value-pill">{formData.number_diagnoses}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  step="1"
                  value={formData.number_diagnoses}
                  onChange={(e) => handleInputChange('number_diagnoses', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <div className="form-label">
                  <span>Lab Procedures Count</span>
                  <span className="form-value-pill">{formData.num_lab_procedures}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={formData.num_lab_procedures}
                  onChange={(e) => handleInputChange('num_lab_procedures', parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <div className="form-label">
                  <span>Medications Prescribed</span>
                  <span className="form-value-pill">{formData.num_medications}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="40"
                  step="1"
                  value={formData.num_medications}
                  onChange={(e) => handleInputChange('num_medications', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Glycemic Control & Regimen */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              3. Glycemic Control & Medication Titration
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Inpatient HbA1c Lab Result</label>
                <select
                  className="form-select"
                  value={formData.A1Cresult}
                  onChange={(e) => handleInputChange('A1Cresult', e.target.value)}
                >
                  <option value="None">None (Not Tested Inpatient)</option>
                  <option value="Norm">Norm (&lt; 7.0% Controlled)</option>
                  <option value=">7">&gt;7% (Elevated)</option>
                  <option value=">8">&gt;8% (Severe Poor Control)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Insulin Regimen Titration</label>
                <select
                  className="form-select"
                  value={formData.insulin}
                  onChange={(e) => handleInputChange('insulin', e.target.value)}
                >
                  <option value="No">No Insulin Prescribed</option>
                  <option value="Steady">Steady (Stable Maintenance)</option>
                  <option value="Up">Up (Dose Increased Inpatient)</option>
                  <option value="Down">Down (Dose Decreased)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Admission Type</label>
                <select
                  className="form-select"
                  value={formData.admission_group}
                  onChange={(e) => handleInputChange('admission_group', e.target.value)}
                >
                  <option value="Emergency_Urgent">Emergency / Urgent</option>
                  <option value="Elective">Elective Scheduled</option>
                  <option value="Other">Trauma / Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Discharge Disposition</label>
                <select
                  className="form-select"
                  value={formData.discharge_group}
                  onChange={(e) => handleInputChange('discharge_group', e.target.value)}
                >
                  <option value="Home">Home (Routine Self-Care)</option>
                  <option value="Home_Health">Home Health Service</option>
                  <option value="Transfer_Facility">Skilled Nursing / Rehab</option>
                  <option value="Other">Outpatient Referral / Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Prognosis Gauge, What-If Engine, & Care Pathway */}
        <div>
          {/* Prognosis Gauge Card */}
          <div className="card risk-display-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Estimated 30-Day Readmission Prognosis
              </span>
              <span className="badge badge-navy">Scikit-Learn Calibrated</span>
            </div>

            <div className="risk-circle-wrap">
              <div style={{ textAlign: 'center' }}>
                <div 
                  className="risk-percentage"
                  style={{ color: hasActiveInterventions ? counterfactualPrediction.badgeColor : baselinePrediction.badgeColor }}
                >
                  {hasActiveInterventions ? counterfactualPrediction.percentage : baselinePrediction.percentage}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Readmission Probability
                </div>
              </div>
            </div>

            <div>
              <span 
                className="risk-tag"
                style={{ 
                  backgroundColor: (hasActiveInterventions ? counterfactualPrediction.badgeColor : baselinePrediction.badgeColor) + '1A',
                  color: hasActiveInterventions ? counterfactualPrediction.badgeColor : baselinePrediction.badgeColor,
                  border: `1px solid ${hasActiveInterventions ? counterfactualPrediction.badgeColor : baselinePrediction.badgeColor}4D`
                }}
              >
                {hasActiveInterventions ? counterfactualPrediction.riskLevel : baselinePrediction.riskLevel}
              </span>
            </div>

            {hasActiveInterventions && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: 'rgba(2, 195, 154, 0.12)', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <ArrowDownRight size={16} color="#007A5E" />
                <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#007A5E' }}>
                  Risk reduced by {relativeReduction}% ({baselinePrediction.percentage}% &rarr; {counterfactualPrediction.percentage}%)
                </span>
              </div>
            )}
          </div>

          {/* Interactive What-If Counterfactual Box */}
          <div className="what-if-box">
            <div className="what-if-header">
              <Zap size={18} />
              <span>Interactive "What-If" Counterfactual Engine</span>
            </div>
            <p style={{ fontSize: '0.775rem', color: '#5C5400', marginBottom: '0.85rem', lineHeight: '1.4' }}>
              Simulate in real-time how actionable clinician interventions prior to physical discharge shift patient prognosis:
            </p>

            <div className="toggle-switch-group">
              <label className="toggle-row">
                <span className="toggle-label">
                  <Stethoscope size={16} color="var(--teal-primary)" />
                  <span>Order Inpatient HbA1c Lab Before Discharge</span>
                </span>
                <input
                  type="checkbox"
                  checked={whatIfA1c}
                  onChange={(e) => setWhatIfA1c(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--teal-primary)', cursor: 'pointer' }}
                />
              </label>

              <label className="toggle-row">
                <span className="toggle-label">
                  <Activity size={16} color="var(--teal-primary)" />
                  <span>Stabilize Insulin Maintenance Regimen</span>
                </span>
                <input
                  type="checkbox"
                  checked={whatIfInsulin}
                  onChange={(e) => setWhatIfInsulin(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--teal-primary)', cursor: 'pointer' }}
                />
              </label>

              <label className="toggle-row">
                <span className="toggle-label">
                  <Clock size={16} color="var(--teal-primary)" />
                  <span>Discharge Patient 2 Days Earlier (Safe Ambulatory)</span>
                </span>
                <input
                  type="checkbox"
                  checked={whatIfStay}
                  onChange={(e) => setWhatIfStay(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--teal-primary)', cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>

          {/* Automated Post-Discharge Care Pathway */}
          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <ClipboardCheck size={18} color="var(--navy)" />
                  Automated Post-Discharge Care Pathway
                </h3>
                <p className="card-subtitle">Personalized clinician orders based on calculated risk tier</p>
              </div>
              <span className="badge badge-navy">Clinician Orders</span>
            </div>

            <div className="pathway-list">
              {(hasActiveInterventions ? counterfactualPrediction.carePathway : baselinePrediction.carePathway).map((order, idx) => (
                <div 
                  key={idx} 
                  className={`pathway-item ${order.priority === 'Urgent' ? 'urgent' : order.priority === 'High' ? 'high' : 'standard'}`}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span className="pathway-priority">{order.priority}</span>
                      <span className="pathway-action">{order.action}</span>
                    </div>
                    <div className="pathway-desc">{order.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Signed Risk Attribution Waterfall Chart */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Activity size={18} color="var(--navy)" />
              Signed Patient Risk Attribution Breakdown
            </h3>
            <p className="card-subtitle">
              Decomposition of patient logit score into positive risk factors vs protective stabilizers
            </p>
          </div>
          <span className="badge badge-teal">Waterfall Attribution</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          <div>
            <h4 style={{ fontSize: '0.825rem', fontWeight: 700, color: '#E11D48', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowUpRight size={16} /> Top Risk-Increasing Drivers for this Patient
            </h4>
            {baselinePrediction.topPositiveDrivers.map((item, idx) => {
              const widthPct = Math.min(100, Math.max(10, item.contribution * 180));
              return (
                <div key={idx} className="waterfall-bar-row">
                  <span className="waterfall-label" title={item.label}>{item.label}</span>
                  <div className="waterfall-visual">
                    <div className="waterfall-bar positive" style={{ width: `${widthPct}%` }}></div>
                  </div>
                  <span className="waterfall-val" style={{ color: '#E11D48' }}>+{item.contribution.toFixed(3)}</span>
                </div>
              );
            })}
          </div>

          <div>
            <h4 style={{ fontSize: '0.825rem', fontWeight: 700, color: '#007A5E', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowDownRight size={16} /> Protective / Risk-Reducing Factors for this Patient
            </h4>
            {baselinePrediction.topProtectiveDrivers.length === 0 ? (
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No significant protective factors detected. Consider ordering an inpatient HbA1c test.
              </p>
            ) : (
              baselinePrediction.topProtectiveDrivers.map((item, idx) => {
                const widthPct = Math.min(100, Math.max(10, Math.abs(item.contribution) * 180));
                return (
                  <div key={idx} className="waterfall-bar-row">
                    <span className="waterfall-label" title={item.label}>{item.label}</span>
                    <div className="waterfall-visual">
                      <div className="waterfall-bar negative" style={{ width: `${widthPct}%` }}></div>
                    </div>
                    <span className="waterfall-val" style={{ color: '#007A5E' }}>{item.contribution.toFixed(3)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
