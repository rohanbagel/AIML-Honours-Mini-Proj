import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';

export default function DatasetPrep({ results }) {
  if (!results) return <div className="card">Loading dataset information...</div>;

  const {
    meta = {},
    features = [],
    class_balance = {},
    missing = {},
    split = {}
  } = results;

  // Class balance pie data: Green = Normal (No diabetes), Red = Disease (Diabetes)
  const classData = [
    { name: 'No Diabetes (0)', value: class_balance.neg || 500, pct: class_balance.neg_pct || 65.1, color: '#16a34a' },
    { name: 'Diabetes (1)', value: class_balance.pos || 268, pct: class_balance.pos_pct || 34.9, color: '#dc2626' }
  ];

  // Invalid zeros data: Yellow = Data Warning / Imputation
  const zeroCounts = missing.invalid_zero_counts || {};
  const zeroData = Object.entries(zeroCounts).map(([feat, count]) => ({
    feature: feat,
    count: count,
    pct: ((count / (meta.n_rows || 768)) * 100).toFixed(1)
  }));

  return (
    <div className="tab-pane">
      <div className="section-title">
        <h2>Dataset Metadata & Preprocessing Pipeline</h2>
        <span className="badge badge-neutral">{meta.n_rows || 768} Cohort Records</span>
      </div>

      {/* Dataset Provenance */}
      <div className="card">
        <h3>Dataset Provenance & Source Repositories</h3>
        <p className="font-sm" style={{ marginTop: 6 }}>
          The <strong>{meta.source_name || 'Pima Indians Diabetes Database'}</strong> is a benchmark clinical dataset
          originating from the National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK). All patients
          are female, at least 21 years old, of Pima Indian heritage, and resided near Phoenix, Arizona.
        </p>
        <div className="links-row" style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="font-bold text-muted font-sm">Primary Repositories:</span>
          {meta.source_urls && meta.source_urls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="btn-link font-sm">
              Source {i + 1} ↗
            </a>
          ))}
        </div>
      </div>

      {/* Feature Specification Table */}
      <div className="card">
        <h3>Clinical Feature Dictionary</h3>
        <div className="table-responsive" style={{ marginTop: 10 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Attribute Key</th>
                <th>Clinical Label</th>
                <th>Physiological Description</th>
                <th>Standard Unit</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={i}>
                  <td><code>{f.key}</code></td>
                  <td><strong>{f.label}</strong></td>
                  <td>{f.description}</td>
                  <td><span className="unit-tag">{f.unit}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Distributions: Class Balance & Invalid Zeros */}
      <div className="two-col-grid">
        <div className="card">
          <h3>Target Class Distribution</h3>
          <p className="font-xs text-muted" style={{ marginTop: 4 }}>
            Green = Negative (65.1%), Red = Positive (34.9%). Imbalance addressed via stratified sampling.
          </p>
          <div style={{ height: 260, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, pct }) => `${pct}%`}
                >
                  {classData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} patients`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Physiologically Impossible Zeros (Warning)</h3>
          <p className="font-xs text-muted" style={{ marginTop: 4 }}>
            Yellow indicates biological measurements where 0 indicates missing unrecorded values.
          </p>
          <div style={{ height: 260, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zeroData} layout="vertical" margin={{ left: 30, right: 30, top: 10, bottom: 10 }}>
                <XAxis type="number" />
                <YAxis dataKey="feature" type="category" width={95} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val, name, item) => [`${val} zeros (${item.payload.pct}%)`, 'Invalid Zeros']} />
                <Bar dataKey="count" fill="#eab308" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Preprocessing Workflow */}
      <div className="card">
        <h3>Ordered Preprocessing Workflow (Leak-Free Protocol)</h3>
        <div className="workflow-steps" style={{ marginTop: 12 }}>
          <div className="step-card">
            <div className="step-num">1</div>
            <div className="step-content">
              <h4>Zero-to-NaN Conversion</h4>
              <p>
                Replaced numerical 0 values with <code>NaN</code> across 5 physiological markers (Glucose, BP,
                SkinThickness, Insulin, BMI). Pregnancies and Pedigree retained valid zeros.
              </p>
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <div className="step-content">
              <h4>Stratified Train/Test Split</h4>
              <p>
                Partitioned dataset into 80% Training ({split.train_size} rows, {split.train_pos_pct}% positive) and
                20% Testing ({split.test_size} rows, {split.test_pos_pct}% positive) with <code>random_state=42</code>.
              </p>
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <div className="step-content">
              <h4>Fold-Isolated Median Imputation</h4>
              <p>
                Executed <code>SimpleImputer(strategy='median')</code> strictly within scikit-learn cross-validation pipelines.
                Medians learned from training folds are applied to validation/test folds, eliminating leakage.
              </p>
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">4</div>
            <div className="step-content">
              <h4>Z-Score Standardization</h4>
              <p>
                Applied <code>StandardScaler()</code> to normalize varying clinical units,
                guaranteeing balanced gradient updates and interpretable regression coefficients.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
