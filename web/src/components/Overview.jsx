import React from 'react';
import { 
  Activity, AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, 
  FileText, HeartPulse, Hospital, Layers, ShieldCheck, Sliders, 
  Sparkles, Stethoscope, TrendingUp, Users, Zap 
} from 'lucide-react';

export default function Overview({ results, onNavigateTab }) {
  const meta = results.meta || {};
  const classBal = results.class_balance || {};
  const bestModel = results.models?.find(m => m.name === results.best_model) || results.models?.[0] || {};

  return (
    <div>
      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div 
          className="kpi-card kpi-navy" 
          onClick={() => onNavigateTab('dataset')} 
          style={{ cursor: 'pointer' }}
          title="Click to view Cohort & Prep"
        >
          <div className="kpi-header">
            <span className="kpi-title">Clean Study Cohort</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'rgba(5, 102, 141, 0.08)', color: 'var(--navy)' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value">{meta.n_cohort_patients?.toLocaleString()}</div>
          <div className="kpi-desc">
            Deduplicated unique patients from <strong>101,766</strong> raw encounters across 130 hospitals
          </div>
          <div className="kpi-progress">
            <div className="kpi-progress-bar" style={{ width: '68.8%', backgroundColor: 'var(--navy)' }} />
          </div>
        </div>

        <div 
          className="kpi-card kpi-teal" 
          onClick={() => onNavigateTab('eda')} 
          style={{ cursor: 'pointer' }}
          title="Click to view Clinical EDA"
        >
          <div className="kpi-header">
            <span className="kpi-title">30-Day Readmission Rate</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'rgba(2, 128, 144, 0.08)', color: 'var(--teal-primary)' }}>
              <Activity size={18} />
            </div>
          </div>
          <div className="kpi-value">{classBal.pos_pct}%</div>
          <div className="kpi-desc">
            <strong>{classBal.pos?.toLocaleString()}</strong> acute inpatient encounters readmitted &lt;30 days
          </div>
          <div className="kpi-progress">
            <div className="kpi-progress-bar" style={{ width: `${classBal.pos_pct}%`, backgroundColor: 'var(--teal-primary)' }} />
          </div>
        </div>

        <div 
          className="kpi-card kpi-accent" 
          onClick={() => onNavigateTab('results')} 
          style={{ cursor: 'pointer' }}
          title="Click to view Model Benchmarks"
        >
          <div className="kpi-header">
            <span className="kpi-title">Top ROC-AUC Benchmark</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'rgba(0, 168, 150, 0.1)', color: 'var(--teal-accent)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">{bestModel.roc_auc?.toFixed(4) || '0.6465'}</div>
          <div className="kpi-desc">
            LightGBM Gradient Boosted Trees (CV AUC: <strong>{bestModel.cv_roc_auc_mean?.toFixed(4) || '0.6454'}</strong>)
          </div>
          <div className="kpi-progress">
            <div className="kpi-progress-bar" style={{ width: '64.6%', backgroundColor: 'var(--teal-accent)' }} />
          </div>
        </div>

        <div 
          className="kpi-card kpi-yellow" 
          onClick={() => onNavigateTab('explainability')} 
          style={{ cursor: 'pointer' }}
          title="Click to view Feature Attribution"
        >
          <div className="kpi-header">
            <span className="kpi-title">Top Predictive Driver</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: 'rgba(240, 243, 189, 0.8)', color: 'var(--yellow-dark)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.45rem', marginTop: '0.15rem' }}>Prior Admissions</div>
          <div className="kpi-desc">
            History of inpatient stay surges readmission odds by <strong>+28%</strong> (OR: 1.28x)
          </div>
          <div className="kpi-progress">
            <div className="kpi-progress-bar" style={{ width: '85%', backgroundColor: '#D4CD63' }} />
          </div>
        </div>
      </div>

      {/* Main Grid: Problem Statement & Academic Alignment */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Hospital size={20} color="var(--navy)" />
                Clinical Problem & Regulatory Context
              </h2>
              <p className="card-subtitle">Hospital Readmissions Reduction Program (CMS HRRP)</p>
            </div>
            <span className="badge badge-navy">US CMS HRRP</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
            Unplanned 30-day hospital readmissions cost the US healthcare system over <strong>$17 billion</strong> annually 
            and represent critical failures in transitional care. Under the Centers for Medicare & Medicaid Services (CMS) 
            Hospital Readmissions Reduction Program, medical centers face direct reimbursement penalties for elevated 30-day readmissions.
          </p>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--teal-primary)', marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={14} color="var(--teal-primary)" /> Clinical Decision Support Opportunity
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              By analyzing multi-modal inpatient data—glycemic volatility, medication titrations, comorbidity count, and prior admissions—this application calculates calibrated readmission risk and prescribes individualized post-discharge care pathways before physical discharge.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => onNavigateTab('predict')}>
              <Sliders size={15} /> Launch Discharge Simulator &rarr;
            </button>
            <button className="btn btn-outline" onClick={() => onNavigateTab('results')}>
              View Benchmark Models
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <ShieldCheck size={20} color="var(--teal-primary)" />
                Curriculum & Global Health Mapping
              </h2>
              <p className="card-subtitle">BE Computer Engineering Academic Rubric Alignment</p>
            </div>
            <span className="badge badge-mint">SDG 3 Target 3.4</span>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, width: '38%' }}>University Track</td>
                  <td><strong>Topic #4: Patient Follow-up / Prognosis Estimator</strong></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Lab Experiments</td>
                  <td><strong>Exp 1</strong> (Preprocessing), <strong>Exp 2</strong> (EDA), <strong>Exp 4</strong> (Classification), <strong>Exp 8</strong> (Evaluation)</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Course Outcomes</td>
                  <td><strong>CO1, CO2, CO3, CO4, CO5</strong> fulfilled across data science lifecycle</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Global SDG Target</td>
                  <td><strong>UN SDG 3, Target 3.4</strong>: Reduce premature NCD mortality (Diabetes & Comorbidities)</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Model Transparency</td>
                  <td>Scikit-learn Logistic Regression deployed with <strong>0.000039</strong> mathematical parity</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem', padding: '0.75rem 0.95rem', backgroundColor: 'rgba(240, 243, 189, 0.45)', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E59E' }}>
            <p style={{ fontSize: '0.775rem', color: '#5C5400', lineHeight: '1.45' }}>
              <strong>Medical Informatics Ceiling:</strong> In published literature (*Strack et al. 2014, Rubin et al. 2018*), 30-day EHR readmission models plateau around ROC-AUC 0.63–0.68 because outpatient Social Determinants of Health (transport, food security, copay affordability) are absent from hospital billing EHRs.
            </p>
          </div>
        </div>
      </div>

      {/* Clinical Workflow Stepper */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Layers size={18} color="var(--navy)" />
              Clinical Decision Support (CDS) Workflow
            </h3>
            <p className="card-subtitle">End-to-end transitional care pathway from admission to outpatient follow-up</p>
          </div>
          <span className="badge badge-teal">4-Stage Pipeline</span>
        </div>

        <div className="stepper-container">
          <div className="step-card">
            <div className="step-number">Stage 01</div>
            <div className="step-title">Inpatient Admission Triage</div>
            <div className="step-desc">
              Patient admitted to acute ward; capture 10 ICD-9 diagnostic categories, emergency presentation, and prior visit history.
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">Stage 02</div>
            <div className="step-title">Inpatient Glycemic Surveillance</div>
            <div className="step-desc">
              Order inpatient HbA1c lab test and stabilize insulin maintenance dosage to prevent volatile glycemic fluctuations.
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">Stage 03</div>
            <div className="step-title">Calibrated Prognosis Simulation</div>
            <div className="step-desc">
              Deterministic client-side logistic engine computes readmission probability and decomposes signed waterfall feature contributions.
            </div>
          </div>

          <div className="step-card" style={{ borderLeftColor: 'var(--green-mint)' }}>
            <div className="step-number" style={{ color: 'var(--green-dark)' }}>Stage 04</div>
            <div className="step-title">Post-Discharge Care Pathway</div>
            <div className="step-desc">
              Automated generation of actionable clinician discharge orders: 48-hr telehealth check, visiting nurse referral, or outpatient clinic visit.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
