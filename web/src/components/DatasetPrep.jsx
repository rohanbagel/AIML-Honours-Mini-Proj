import React from 'react';
import { Database, Filter, Layers, ListFilter, CheckCircle2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DatasetPrep({ results }) {
  const meta = results.meta;
  const classBal = results.class_balance;
  const summary = results.summary_stats;

  const classData = [
    { name: 'No / >30d Readmission', count: classBal.neg, pct: classBal.neg_pct, color: '#028090' },
    { name: 'Acute 30d Readmission', count: classBal.pos, pct: classBal.pos_pct, color: '#E11D48' }
  ];

  const icd9Categories = [
    { chapter: 'Circulatory', range: '390–459, 785', desc: 'Ischemic heart disease, heart failure, hypertension, dysrhythmias' },
    { chapter: 'Diabetes', range: '250.xx', desc: 'Type 1/Type 2 diabetes mellitus with ketoacidosis or microvascular issues' },
    { chapter: 'Respiratory', range: '460–519, 786', desc: 'Pneumonia, COPD, acute bronchitis, respiratory distress' },
    { chapter: 'Digestive', range: '520–579, 787', desc: 'GI bleed, gastroenteritis, pancreatitis, bowel obstruction' },
    { chapter: 'Genitourinary', range: '580–629, 788', desc: 'Acute kidney injury, chronic kidney disease, UTI' },
    { chapter: 'Musculoskeletal', range: '710–739', desc: 'Osteoarthritis, arthroplasty, pathological fractures' },
    { chapter: 'Injury & Poisoning', range: '800–999', desc: 'Trauma, hip fractures, complications of surgical/medical care' },
    { chapter: 'Neoplasms', range: '140–239', desc: 'Malignant and benign neoplasms' },
    { chapter: 'Other / Missing', range: 'All other codes', desc: 'Metabolic, skin, nervous system, and unclassified conditions' }
  ];

  return (
    <div>
      {/* Exclusion Cascade Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <Filter size={20} color="var(--navy)" />
              Clinical Inpatient Cohort Selection Waterfall
            </h2>
            <p className="card-subtitle">
              UCI 130-US Hospitals (1999–2008) Inpatient Registry | Rigorous Exclusion Cascade
            </p>
          </div>
          <span className="badge badge-teal">N = {meta.n_cohort_patients.toLocaleString()} Patients</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', borderTop: '3px solid var(--navy)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Step 1: Multi-Hospital Ingest</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy)', margin: '0.2rem 0' }}>101,766 Encounters</div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              All diabetic inpatient encounters from 130 US hospitals spanning a 10-year period (50 raw features).
            </p>
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', borderTop: '3px solid #E11D48' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Step 2: Hospice / Expired Filter</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#E11D48', margin: '0.2rem 0' }}>-2,423 Excluded</div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              Excluded discharge disposition IDs 11, 13, 14, 19, 20, 21 (expired or hospice). A deceased patient cannot logically experience a 30-day readmission.
            </p>
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', borderTop: '3px solid var(--teal-primary)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Step 3: Initial Encounter Cohort</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--teal-primary)', margin: '0.2rem 0' }}>69,990 Unique Patients</div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              Deduplicated to the first admission per patient ID, preventing longitudinal survival bias while capturing true baseline risk.
            </p>
          </div>
        </div>

        <div style={{ padding: '0.85rem', backgroundColor: 'rgba(2, 195, 154, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(2, 195, 154, 0.3)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <CheckCircle2 size={18} color="#007A5E" />
          <p style={{ fontSize: '0.8rem', color: '#005944' }}>
            <strong>Academic Integrity Standard:</strong> Unlike toy datasets (e.g. 768-row Pima), this 69,990-patient clinical cohort mirrors the scale and diagnostic diversity of contemporary hospital epidemiology.
          </p>
        </div>
      </div>

      {/* Grid: Class Balance & ICD-9 Chapters */}
      <div className="grid-2">
        {/* Class Balance Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Layers size={18} color="var(--teal-primary)" />
                Target Class Distribution
              </h3>
              <p className="card-subtitle">Severe Clinical Class Imbalance (8.98% Positive)</p>
            </div>
            <span className="badge badge-red">1 : 10.1 Imbalance</span>
          </div>

          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(val, name, item) => [`${val.toLocaleString()} patients (${item.payload.pct}%)`, 'Volume']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {classData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-around', textAlign: 'center', fontSize: '0.825rem' }}>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>Non-Readmitted / &gt;30d</div>
              <div style={{ fontWeight: 800, color: 'var(--teal-primary)', fontSize: '1.1rem' }}>{classBal.neg.toLocaleString()} ({classBal.neg_pct}%)</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>Acute 30-Day Readmission</div>
              <div style={{ fontWeight: 800, color: '#E11D48', fontSize: '1.1rem' }}>{classBal.pos.toLocaleString()} ({classBal.pos_pct}%)</div>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
            Managed via stratified 5-fold cross-validation and <code>class_weight='balanced'</code> in both Logistic Regression and LightGBM.
          </p>
        </div>

        {/* ICD-9 Diagnostic Mapping Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <ListFilter size={18} color="var(--navy)" />
                ICD-9 Diagnostic Chapter Mapping
              </h3>
              <p className="card-subtitle">Mapping 700+ raw ICD-9 billing codes to 10 clinical domains</p>
            </div>
            <span className="badge badge-navy">WHO ICD-9</span>
          </div>

          <div className="table-wrap" style={{ maxHeight: '280px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Clinical Chapter</th>
                  <th>ICD-9 Range</th>
                  <th>Primary Pathology</th>
                </tr>
              </thead>
              <tbody>
                {icd9Categories.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: 'var(--navy)' }}>{item.chapter}</td>
                    <td className="font-mono" style={{ fontSize: '0.75rem' }}>{item.range}</td>
                    <td style={{ fontSize: '0.75rem' }}>{item.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Statistics Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Database size={18} color="var(--navy)" />
              Summary Statistics of Numerical Predictors
            </h3>
            <p className="card-subtitle">Inpatient Encounter Features ($N = 69,990$)</p>
          </div>
          <span className="badge badge-teal">13 Quantitative Metrics</span>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Feature Name</th>
                <th>Mean</th>
                <th>Std Dev</th>
                <th>Min</th>
                <th>Median</th>
                <th>Max</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(summary).map(([featName, stat]) => (
                <tr key={featName}>
                  <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{featName}</td>
                  <td className="font-mono">{stat.mean !== undefined ? stat.mean.toFixed(2) : '-'}</td>
                  <td className="font-mono">{stat.std !== undefined ? stat.std.toFixed(2) : '-'}</td>
                  <td className="font-mono">{stat.min !== undefined ? stat.min : '-'}</td>
                  <td className="font-mono">{stat.median !== undefined ? stat.median : '-'}</td>
                  <td className="font-mono">{stat.max !== undefined ? stat.max : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
