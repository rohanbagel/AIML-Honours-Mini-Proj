import React, { useState, useMemo } from 'react';
import { 
  Activity, AlertCircle, ArrowDownRight, ArrowUpRight, Check, CheckCircle2, 
  ChevronRight, ClipboardCheck, Clock, Copy, FileSpreadsheet, HeartPulse, 
  HelpCircle, Printer, RefreshCw, ShieldAlert, Sliders, Sparkles, Stethoscope, 
  User, Users, Zap 
} from 'lucide-react';
import { predictReadmission } from '../predict.js';

// SVG Semi-Circular Speedometer Gauge
function RiskSpeedometer({ percentage, color, label }) {
  const radius = 68;
  const strokeWidth = 14;
  const normalizedValue = Math.min(100, Math.max(0, percentage));
  const arcLength = Math.PI * radius; // ~213.6
  const strokeDashoffset = arcLength - (normalizedValue / 100) * arcLength;

  return (
    <div className="gauge-container">
      <svg className="gauge-svg" viewBox="0 0 180 98">
        <path
          className="gauge-bg"
          d="M 22 88 A 68 68 0 0 1 158 88"
        />
        <path
          className="gauge-fill"
          d="M 22 88 A 68 68 0 0 1 158 88"
          style={{
            stroke: color,
            strokeDasharray: arcLength,
            strokeDashoffset: strokeDashoffset
          }}
        />
      </svg>
      <div style={{ marginTop: '-42px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.35rem', fontWeight: 800, color: color, lineHeight: 1 }}>
          {percentage}%
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          {label || '30-Day Readmission Risk'}
        </div>
      </div>
    </div>
  );
}

export default function Predict({ results }) {
  const deployedModel = results.deployed_model;
  const samplePatients = deployedModel.sample_patients;

  // Initial state defaults to Profile B (High-Risk)
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

  // Interactive Checklist State
  const [checkedOrders, setCheckedOrders] = useState({});

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Load persona
  const handleLoadPersona = (patient) => {
    const rawInputs = patient.values || patient.inputs || {};
    setFormData({
      ...rawInputs,
      total_prior_visits: (rawInputs.number_outpatient || 0) + (rawInputs.number_emergency || 0) + (rawInputs.number_inpatient || 0),
      has_prior_inpatient: (rawInputs.number_inpatient || 0) > 0 ? 1 : 0,
      has_prior_emergency: (rawInputs.number_emergency || 0) > 0 ? 1 : 0,
      a1c_tested: rawInputs.A1Cresult !== 'None' ? 1 : 0,
      high_comorbidity: (rawInputs.number_diagnoses || 0) >= 7 ? 1 : 0
    });
    setWhatIfA1c(false);
    setWhatIfInsulin(false);
    setWhatIfStay(false);
    setCheckedOrders({});
    showToast(`Loaded ${patient.label.split(':')[1]?.trim() || 'Patient Persona'}`);
  };

  // Manual input update
  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
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

  // Apply full clinical care bundle
  const handleApplyClinicalBundle = () => {
    const allActive = whatIfA1c && whatIfInsulin && whatIfStay;
    if (allActive) {
      setWhatIfA1c(false);
      setWhatIfInsulin(false);
      setWhatIfStay(false);
      showToast("Reset counterfactual interventions to baseline.");
    } else {
      setWhatIfA1c(true);
      setWhatIfInsulin(true);
      setWhatIfStay(true);
      showToast("Applied Full Clinical Bundle (HbA1c Lab + Stable Insulin + Early Ambulatory Transition)");
    }
  };

  // Toggle checklist item
  const handleToggleChecklist = (idx) => {
    setCheckedOrders(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Copy care orders to clipboard
  const handleCopyOrders = () => {
    const activePathway = (hasActiveInterventions ? counterfactualPrediction.carePathway : baselinePrediction.carePathway);
    const text = activePathway.map((o, i) => `${i + 1}. [${o.priority}] ${o.action}\n   Details: ${o.detail}`).join('\n\n');
    navigator.clipboard.writeText(`CLINICAL DISCHARGE TRANSITION ORDERS:\nPatient Risk: ${hasActiveInterventions ? counterfactualPrediction.percentage : baselinePrediction.percentage}% (${hasActiveInterventions ? counterfactualPrediction.riskLevel : baselinePrediction.riskLevel})\n\n${text}`);
    showToast("Discharge orders copied to clipboard!");
  };

  // Baseline calculation
  const baselinePrediction = useMemo(() => {
    return predictReadmission(formData);
  }, [formData]);

  // Counterfactual calculation
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
  const absoluteDeltaPercent = Math.abs(riskDelta * 100).toFixed(1);
  const relativeReduction = baselinePrediction.probability > 0 
    ? ((Math.abs(riskDelta) / baselinePrediction.probability) * 100).toFixed(1) 
    : '0.0';

  return (
    <div>
      {/* Persona Selection Header */}
      <div className="card" style={{ padding: '0.9rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="var(--navy)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--navy)' }}>
              Pre-loaded Clinical Patient Profiles:
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {samplePatients.map((sp, idx) => (
              <button
                key={idx}
                className="btn btn-outline btn-sm"
                onClick={() => handleLoadPersona(sp)}
                style={{ fontSize: '0.75rem', fontWeight: 600 }}
              >
                <User size={13} color="var(--teal-primary)" />
                <span>{sp.label.split(':')[1]?.split('(')[0]?.trim() || `Profile ${idx + 1}`}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Clinical Controls (Left) vs Prognosis Speedometer & What-If (Right) */}
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

        {/* Right Column: Speedometer Gauge, What-If Engine, & Care Pathway */}
        <div>
          {/* Speedometer Gauge Card */}
          <div className="card risk-display-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Estimated 30-Day Readmission Prognosis
              </span>
              <span className="badge badge-navy">
                <span className="pulse-dot" style={{ marginRight: '4px' }} /> Calibrated Model
              </span>
            </div>

            {!hasActiveInterventions ? (
              <>
                <RiskSpeedometer
                  percentage={baselinePrediction.percentage}
                  color={baselinePrediction.badgeColor}
                  label="Baseline 30-Day Readmission Risk"
                />

                <div style={{ marginTop: '0.5rem' }}>
                  <span 
                    className="risk-tag"
                    style={{ 
                      backgroundColor: baselinePrediction.badgeColor + '1A',
                      color: baselinePrediction.badgeColor,
                      border: `1px solid ${baselinePrediction.badgeColor}4D`
                    }}
                  >
                    {baselinePrediction.riskLevel}
                  </span>
                </div>
              </>
            ) : (
              /* Dual Comparison View When Interventions Active */
              <div>
                <div className="dual-gauge-grid">
                  <div className="dual-gauge-card">
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Inpatient Baseline
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: baselinePrediction.badgeColor, margin: '0.25rem 0' }}>
                      {baselinePrediction.percentage}%
                    </div>
                    <span 
                      style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.15rem 0.5rem', 
                        borderRadius: '9999px',
                        backgroundColor: baselinePrediction.badgeColor + '18',
                        color: baselinePrediction.badgeColor,
                        fontWeight: 700
                      }}
                    >
                      {baselinePrediction.riskLevel}
                    </span>
                  </div>

                  <div className="dual-gauge-card active">
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#007A5E', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      <Sparkles size={12} color="#007A5E" /> With Interventions
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: counterfactualPrediction.badgeColor, margin: '0.25rem 0' }}>
                      {counterfactualPrediction.percentage}%
                    </div>
                    <span 
                      style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.15rem 0.5rem', 
                        borderRadius: '9999px',
                        backgroundColor: counterfactualPrediction.badgeColor + '18',
                        color: counterfactualPrediction.badgeColor,
                        fontWeight: 700
                      }}
                    >
                      {counterfactualPrediction.riskLevel}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(2, 195, 154, 0.12)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', border: '1px solid rgba(2, 195, 154, 0.3)' }}>
                  <ArrowDownRight size={16} color="#007A5E" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#007A5E' }}>
                    Absolute Risk Reduction: -{absoluteDeltaPercent}% (Rel. Reduction: -{relativeReduction}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive What-If Counterfactual Box */}
          <div className="what-if-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
              <div className="what-if-header" style={{ margin: 0 }}>
                <Zap size={18} />
                <span>Interactive "What-If" Counterfactual Engine</span>
              </div>
              <button 
                className="btn btn-outline btn-sm"
                onClick={handleApplyClinicalBundle}
                style={{ fontSize: '0.725rem', backgroundColor: '#FFFFFF', borderColor: '#DCE399' }}
              >
                <Sparkles size={12} color="var(--teal-primary)" />
                <span>{whatIfA1c && whatIfInsulin && whatIfStay ? 'Reset Bundle' : 'Apply Full Care Bundle'}</span>
              </button>
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

          {/* Automated Post-Discharge Care Pathway (Interactive Checklist) */}
          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <ClipboardCheck size={18} color="var(--navy)" />
                  Automated Post-Discharge Care Orders
                </h3>
                <p className="card-subtitle">Personalized clinician orders (Click to mark actioned)</p>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="btn btn-outline btn-sm" onClick={handleCopyOrders} title="Copy Orders">
                  <Copy size={13} /> Copy
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => window.print()} title="Print Orders">
                  <Printer size={13} /> Print
                </button>
              </div>
            </div>

            <div className="pathway-list">
              {(hasActiveInterventions ? counterfactualPrediction.carePathway : baselinePrediction.carePathway).map((order, idx) => {
                const isChecked = Boolean(checkedOrders[idx]);
                return (
                  <div 
                    key={idx} 
                    className={`checklist-item ${isChecked ? 'checked' : ''}`}
                    onClick={() => handleToggleChecklist(idx)}
                  >
                    <div className={`checklist-checkbox ${isChecked ? 'checked' : ''}`}>
                      {isChecked && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span className={`pathway-priority ${order.priority.toLowerCase()}`}>{order.priority}</span>
                        <span className="pathway-action" style={{ textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.75 : 1 }}>
                          {order.action}
                        </span>
                      </div>
                      <div className="pathway-desc">{order.detail}</div>
                    </div>
                  </div>
                );
              })}
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

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <CheckCircle2 size={16} color="#02C39A" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
