import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { TrendingUp, Activity, AlertOctagon, Heart, Stethoscope } from 'lucide-react';

export default function EDA({ results }) {
  const groupRates = results.group_rates;
  const correlation = results.correlation;

  const [activeRateView, setActiveRateView] = useState('PriorInpatient');

  const views = [
    { key: 'PriorInpatient', label: 'Prior Hospitalizations', icon: AlertOctagon, badge: 'Highest Gradient' },
    { key: 'LengthOfStay', label: 'Length of Hospital Stay', icon: TrendingUp, badge: 'Direct Dosage' },
    { key: 'Age', label: 'Patient Age Bracket', icon: Heart, badge: 'Demographic Risk' },
    { key: 'Insulin', label: 'Insulin Volatility', icon: Activity, badge: 'Medication Shift' },
    { key: 'HbA1c', label: 'HbA1c Testing Status', icon: Stethoscope, badge: 'Quality Metric' }
  ];

  const currentData = groupRates[activeRateView] || [];

  return (
    <div>
      {/* Top Clinical Insights Header */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <TrendingUp size={20} color="var(--navy)" />
              Clinical Exploratory Data Analysis & Risk Escalation
            </h2>
            <p className="card-subtitle">Empirical readmission rates across key clinical subgroups ($N = 69,990$)</p>
          </div>
          <span className="badge badge-teal">Univariate Epidemiology</span>
        </div>

        {/* View Switcher Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {views.map((v) => {
            const Icon = v.icon;
            const isActive = activeRateView === v.key;
            return (
              <button
                key={v.key}
                onClick={() => setActiveRateView(v.key)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Icon size={14} />
                <span>{v.label}</span>
                <span style={{ 
                  fontSize: '0.65rem', 
                  padding: '0.1rem 0.35rem', 
                  borderRadius: '9999px',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(2, 128, 144, 0.1)',
                  color: isActive ? '#FFFFFF' : 'var(--teal-primary)'
                }}>
                  {v.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Chart */}
        <div style={{ height: '320px', width: '100%', marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={currentData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="band" tick={{ fontSize: 12, fill: '#0F172A' }} />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748B' }} 
                unit="%" 
                domain={[0, (dataMax) => Math.ceil(dataMax * 1.25)]} 
              />
              <Tooltip 
                formatter={(val, name, item) => [`${val}% readmission rate (${item.payload.n.toLocaleString()} patients)`, '30-Day Readmission']}
                contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
              />
              <Bar dataKey="positive_rate" radius={[6, 6, 0, 0]} fill="var(--teal-primary)">
                {currentData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.positive_rate > 15 ? '#E11D48' : entry.positive_rate > 10 ? '#028090' : '#00A896'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cohort Breakdown Table for Selected Factor */}
        <div className="table-wrap" style={{ marginTop: '1.25rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Subgroup Band</th>
                <th>Patient Volume</th>
                <th>Share of Total Cohort</th>
                <th>30-Day Readmission Rate</th>
                <th>Clinical Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, idx) => {
                const share = ((row.n / results.meta.n_cohort_patients) * 100).toFixed(1);
                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: 'var(--navy)' }}>{row.band}</td>
                    <td className="font-mono">{row.n.toLocaleString()}</td>
                    <td className="font-mono">{share}%</td>
                    <td className="font-mono" style={{ 
                      color: row.positive_rate > 15 ? '#E11D48' : row.positive_rate > 10 ? 'var(--teal-primary)' : '#00A896',
                      fontWeight: 800
                    }}>
                      {row.positive_rate}%
                    </td>
                    <td>
                      <span className={`badge ${row.positive_rate > 15 ? 'badge-red' : row.positive_rate > 10 ? 'badge-yellow' : 'badge-mint'}`}>
                        {row.positive_rate > 15 ? 'High Risk' : row.positive_rate > 10 ? 'Elevated Risk' : 'Baseline Risk'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Correlation Matrix Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Activity size={18} color="var(--navy)" />
              Feature Correlation Matrix (Top Predictors)
            </h3>
            <p className="card-subtitle">Pearson correlation coefficients ($r$) across core inpatient clinical features</p>
          </div>
          <span className="badge badge-navy">Multivariate Heatmap</span>
        </div>

        <div className="table-wrap">
          <table className="data-table" style={{ fontSize: '0.775rem' }}>
            <thead>
              <tr>
                <th>Feature</th>
                {correlation.features.map((f, i) => (
                  <th key={i} style={{ textAlign: 'center' }}>{f.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {correlation.features.map((rowFeat, rowIdx) => (
                <tr key={rowIdx}>
                  <td style={{ fontWeight: 700, color: 'var(--navy)', whiteSpace: 'nowrap' }}>
                    {rowFeat.replace(/_/g, ' ')}
                  </td>
                  {correlation.features.map((colFeat, colIdx) => {
                    const val = correlation.matrix[rowIdx][colIdx];
                    const isDiag = rowIdx === colIdx;
                    const bgIntensity = Math.abs(val);
                    const isPositive = val > 0;
                    const bgColor = isDiag 
                      ? '#E2E8F0' 
                      : isPositive 
                        ? `rgba(2, 128, 144, ${Math.min(bgIntensity * 1.5, 0.7)})` 
                        : `rgba(225, 29, 72, ${Math.min(bgIntensity * 1.5, 0.7)})`;
                    const textColor = bgIntensity > 0.35 && !isDiag ? '#FFFFFF' : 'var(--text-main)';

                    return (
                      <td 
                        key={colIdx} 
                        className="font-mono"
                        style={{ 
                          textAlign: 'center', 
                          backgroundColor: bgColor,
                          color: textColor,
                          padding: '0.5rem 0.35rem'
                        }}
                      >
                        {val.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          *Note: High correlation observed between <code>time_in_hospital</code> and <code>num_medications</code> (r = 0.46), reflecting clinical escalation during protracted stays.
        </p>
      </div>
    </div>
  );
}
