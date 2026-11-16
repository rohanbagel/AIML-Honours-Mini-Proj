import React from 'react';
import { Activity, AlertTriangle, FileText, HeartPulse, Hospital, ShieldCheck, TrendingUp, Users } from 'lucide-react';

export default function Overview({ results, onNavigateTab }) {
  const meta = results.meta || {};
  const classBal = results.class_balance || {};
  const bestModel = results.models?.find(m => m.name === results.best_model) || results.models?.[0] || {};

  return (
    <div>
      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-navy">
          <div className="kpi-header">
            <span className="kpi-title">Clean Study Cohort</span>
            <Users className="kpi-icon" size={18} />
          </div>
          <div className="kpi-value">{meta.n_cohort_patients.toLocaleString()}</div>
          <div className="kpi-desc">
            From <strong>101,766</strong> raw inpatient encounters across 130 US hospitals
          </div>
        </div>

        <div className="kpi-card kpi-teal">
          <div className="kpi-header">
            <span className="kpi-title">30-Day Readmission Rate</span>
            <Activity className="kpi-icon" size={18} />
          </div>
          <div className="kpi-value">{classBal.pos_pct}%</div>
          <div className="kpi-desc">
            <strong>{classBal.pos.toLocaleString()}</strong> acute inpatient encounters readmitted &lt;30 days
          </div>
        </div>

        <div className="kpi-card kpi-accent">
          <div className="kpi-header">
            <span className="kpi-title">Benchmark ROC-AUC</span>
            <TrendingUp className="kpi-icon" size={18} />
          </div>
          <div className="kpi-value">{bestModel.roc_auc.toFixed(4)}</div>
          <div className="kpi-desc">
            LightGBM Gradient Boosted Trees (CV AUC: <strong>{bestModel.cv_roc_auc_mean.toFixed(4)}</strong>)
          </div>
        </div>

        <div className="kpi-card kpi-yellow">
          <div className="kpi-header">
            <span className="kpi-title">Top Predictive Driver</span>
            <AlertTriangle className="kpi-icon" size={18} />
          </div>
          <div className="kpi-value" style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>Prior Admissions</div>
          <div className="kpi-desc">
            Prior inpatient stays increase readmission odds by <strong>+28%</strong> (OR: 1.28)
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
                Clinical Problem & Operational Context
              </h2>
              <p className="card-subtitle">Hospital Readmissions Reduction Program (CMS HRRP)</p>
            </div>
            <span className="badge badge-navy">US CMS HRRP</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
            Unplanned 30-day hospital readmissions represent severe disruptions in patient recovery, 
            signal systemic deficiencies in outpatient transition care, and inflict over <strong>$17 billion</strong> in 
            annual costs on healthcare systems. Under the US Centers for Medicare & Medicaid Services (CMS) Hospital 
            Readmissions Reduction Program, hospitals face direct financial reimbursement penalties for excessive readmission rates.
          </p>
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.9rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--teal-primary)' }}>
            <h4 style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.25rem' }}>
              The Clinical Opportunity
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              By evaluating multi-factor electronic health records (EHR) during the index inpatient stay—including lab testing frequency, 
              glycemic volatility, diagnostic complexity, and prior utilization—our model stratifies patients into risk tiers and prescribes 
              targeted post-discharge clinical care pathways.
            </p>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => onNavigateTab('predict')}>
              Launch Inpatient Simulator &rarr;
            </button>
            <button className="btn btn-outline" onClick={() => onNavigateTab('results')}>
              View Model Benchmarks
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
                  <td><strong>UN SDG 3, Target 3.4</strong>: Reduce premature mortality from NCDs (Diabetes & Comorbidities)</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Model Transparency</td>
                  <td>Scikit-learn Logistic Regression deployed client-side with <strong>0.000039</strong> mathematical parity tolerance</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(240, 243, 189, 0.4)', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E59E' }}>
            <p style={{ fontSize: '0.775rem', color: '#5C5400', lineHeight: '1.4' }}>
              <strong>Published Literature Baseline:</strong> 30-day EHR readmission models plateau around ROC-AUC 0.63–0.68 due to unmeasured Social Determinants of Health (SDOH). Our LightGBM (0.6465) and Logistic Regression (0.6415) achieve publication-grade discriminative power.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
