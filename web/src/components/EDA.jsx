import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function EDA({ results }) {
  if (!results) return <div className="card">Loading exploratory data analysis...</div>;

  const {
    histograms = {},
    correlation = {},
    means_by_outcome = {},
    group_rates = {},
    summary_stats = {}
  } = results;

  const featureKeys = Object.keys(summary_stats);
  const [selectedHistFeat, setSelectedHistFeat] = useState(featureKeys[1] || 'Glucose');
  const [selectedGroupCat, setSelectedGroupCat] = useState('Age');

  // 1. Histogram data for selected feature (Green = Normal, Red = Diabetic)
  const currentHist = histograms[selectedHistFeat] || { edges: [], neg: [], pos: [] };
  const histChartData = (currentHist.neg || []).map((negCount, i) => {
    const start = currentHist.edges[i];
    const end = currentHist.edges[i + 1];
    return {
      bin: `${start} - ${end}`,
      'No Diabetes': negCount,
      'Diabetes': currentHist.pos[i] || 0
    };
  });

  // Dynamic finding for Histogram
  const histPeakNegBin = histChartData.reduce((max, d) => d['No Diabetes'] > (max['No Diabetes'] || 0) ? d : max, {});
  const histPeakPosBin = histChartData.reduce((max, d) => d['Diabetes'] > (max['Diabetes'] || 0) ? d : max, {});
  const histFinding = `For ${selectedHistFeat}, non-diabetic cases peak in the '${histPeakNegBin.bin}' interval, whereas diabetic cases concentrate towards higher intervals around '${histPeakPosBin.bin}'.`;

  // 2. Correlation Matrix
  const corrFeatures = correlation.features || [];
  const corrMatrix = correlation.matrix || [];
  const outcomeIdx = corrFeatures.indexOf('Outcome');

  let maxCorrFeat = '';
  let maxCorrVal = -1;
  if (outcomeIdx !== -1) {
    corrFeatures.forEach((feat, idx) => {
      if (feat !== 'Outcome') {
        const val = corrMatrix[idx]?.[outcomeIdx] || 0;
        if (val > maxCorrVal) {
          maxCorrVal = val;
          maxCorrFeat = feat;
        }
      }
    });
  }
  const corrFinding = `${maxCorrFeat} exhibits the strongest positive linear correlation with diabetes outcome (r = ${maxCorrVal.toFixed(3)}), followed by BMI and Age.`;

  // Minimalist grayscale correlation color scale with red accent for high risk
  const getCorrColor = (val) => {
    if (val === undefined || isNaN(val)) return '#ffffff';
    if (val >= 0.45) return '#fef2f2'; // high positive (soft red background)
    if (val >= 0.3) return '#f4f4f5'; // moderate positive
    if (val >= 0.1) return '#fafafa'; // low positive
    if (val >= -0.1) return '#ffffff'; // neutral
    return '#f4f4f5'; // negative
  };

  // 3. Means by outcome data
  const meansData = Object.entries(means_by_outcome).map(([feat, m]) => {
    const pctDiff = m.neg > 0 ? (((m.pos - m.neg) / m.neg) * 100).toFixed(1) : 0;
    return {
      feature: feat,
      'No Diabetes': m.neg,
      'Diabetes': m.pos,
      pctDiff: Number(pctDiff)
    };
  });

  const highestMeanShift = [...meansData].sort((a, b) => b.pctDiff - a.pctDiff)[0] || {};
  const meansFinding = `${highestMeanShift.feature} exhibits the largest relative clinical increase in diabetic patients (+${highestMeanShift.pctDiff}% above the non-diabetic cohort baseline).`;

  // 4. Group-wise rates
  const currentGroupList = group_rates[selectedGroupCat] || [];
  const groupChartData = currentGroupList.map(item => ({
    band: item.band,
    'Diabetes Rate (%)': item.positive_rate,
    n: item.n
  }));

  const lowestGroup = currentGroupList[0] || {};
  const highestGroup = currentGroupList[currentGroupList.length - 1] || {};
  const groupFinding = `Across ${selectedGroupCat} strata, positive diabetes rates span from ${lowestGroup.positive_rate ?? 0}% in '${lowestGroup.band ?? ''}' up to ${highestGroup.positive_rate ?? 0}% in '${highestGroup.band ?? ''}'.`;

  return (
    <div className="tab-pane">
      <div className="section-title">
        <h2>Exploratory Data Analysis (EDA) & Clinical Strata</h2>
        <span className="badge badge-neutral">Empirical Feature Distributions</span>
      </div>

      {/* Summary Statistics Table */}
      <div className="card">
        <h3>Feature Summary Statistics (Non-Zero Physical Measurements)</h3>
        <p className="font-xs text-muted" style={{ marginTop: 4 }}>
          Summary metrics computed across physiological features after mapping invalid zeros to missing values.
        </p>
        <div className="table-responsive" style={{ marginTop: 12 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Mean</th>
                <th>Std Dev</th>
                <th>Min</th>
                <th>Median</th>
                <th>Max</th>
              </tr>
            </thead>
            <tbody>
              {featureKeys.map(k => (
                <tr key={k}>
                  <td><strong>{k}</strong></td>
                  <td>{summary_stats[k]?.mean}</td>
                  <td>{summary_stats[k]?.std}</td>
                  <td>{summary_stats[k]?.min}</td>
                  <td><span className="badge badge-neutral">{summary_stats[k]?.median}</span></td>
                  <td>{summary_stats[k]?.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Histograms by Class */}
      <div className="card">
        <div className="card-header-flex">
          <div>
            <h3>Feature Distribution Histograms (Conditioned on Outcome)</h3>
            <p className="font-xs text-muted">10 equal-width bins: Green = No Diabetes (0), Red = Diabetes (1).</p>
          </div>
          <div className="selector-group">
            <label className="font-xs font-bold text-muted">Select Feature:</label>
            <select
              className="select-input"
              value={selectedHistFeat}
              onChange={(e) => setSelectedHistFeat(e.target.value)}
            >
              {featureKeys.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ height: 280, marginTop: 15 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histChartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
              <XAxis dataKey="bin" angle={-20} textAnchor="end" height={45} tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }} />
              <Bar dataKey="No Diabetes" fill="#16a34a" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Diabetes" fill="#dc2626" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="finding-box">
          <strong>Key Finding:</strong> {histFinding}
        </div>
      </div>

      {/* Correlation Heatmap */}
      <div className="card">
        <h3>Pearson Correlation Heatmap</h3>
        <p className="font-xs text-muted" style={{ marginTop: 4 }}>
          Pairwise correlation coefficients with target Outcome highlighted in high-contrast monochrome.
        </p>
        <div className="table-responsive" style={{ margin: '15px 0' }}>
          <div
            className="heatmap-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: `140px repeat(${corrFeatures.length}, minmax(65px, 1fr))`,
              gap: 2,
              textAlign: 'center'
            }}
          >
            <div className="hm-header"></div>
            {corrFeatures.map((f, i) => (
              <div key={i} className="hm-header font-xs font-bold" title={f}>
                {f.length > 7 ? f.substring(0, 7) + '..' : f}
              </div>
            ))}

            {corrFeatures.map((rowFeat, rIdx) => (
              <React.Fragment key={rIdx}>
                <div className="hm-row-label font-xs font-bold text-left">{rowFeat}</div>
                {corrFeatures.map((colFeat, cIdx) => {
                  const val = corrMatrix[rIdx]?.[cIdx] ?? 0;
                  const isOutcome = rowFeat === 'Outcome' || colFeat === 'Outcome';
                  return (
                    <div
                      key={cIdx}
                      className="hm-cell"
                      style={{
                        backgroundColor: getCorrColor(val),
                        color: val >= 0.4 ? '#dc2626' : '#09090b',
                        fontWeight: isOutcome ? 'bold' : 'normal',
                        border: isOutcome ? '1.5px solid #09090b' : '1px solid #e4e4e7'
                      }}
                      title={`${rowFeat} vs ${colFeat}: ${val.toFixed(3)}`}
                    >
                      {val.toFixed(2)}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="finding-box">
          <strong>Key Finding:</strong> {corrFinding}
        </div>
      </div>

      {/* Means by Outcome */}
      <div className="card">
        <h3>Feature Means Conditioned on Diabetes Outcome</h3>
        <p className="font-xs text-muted" style={{ marginTop: 4 }}>
          Green = Normal/No Diabetes baseline, Red = Diabetic cohort mean.
        </p>
        <div style={{ height: 280, marginTop: 15 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={meansData} margin={{ top: 10, right: 20, left: 0, bottom: 35 }}>
              <XAxis dataKey="feature" angle={-25} textAnchor="end" height={45} tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(val, name) => [val, name]} />
              <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }} />
              <Bar dataKey="No Diabetes" fill="#16a34a" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Diabetes" fill="#dc2626" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="finding-box">
          <strong>Key Finding:</strong> {meansFinding}
        </div>
      </div>

      {/* Sub-Group Stratification Rates */}
      <div className="card">
        <div className="card-header-flex">
          <div>
            <h3>Demographic & Clinical Sub-Group Diabetes Rates</h3>
            <p className="font-xs text-muted">Percentage of positive diabetes diagnoses across stratified bands.</p>
          </div>
          <div className="selector-group">
            <label className="font-xs font-bold text-muted">Category:</label>
            <select
              className="select-input"
              value={selectedGroupCat}
              onChange={(e) => setSelectedGroupCat(e.target.value)}
            >
              {Object.keys(group_rates).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ height: 280, marginTop: 15 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={groupChartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
              <XAxis dataKey="band" tick={{ fontSize: 11 }} />
              <YAxis unit="%" domain={[0, 100]} />
              <Tooltip formatter={(val, name, item) => [`${val}% (${item.payload.n} patients)`, 'Diabetes Rate']} />
              <Bar dataKey="Diabetes Rate (%)" fill="#09090b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="finding-box">
          <strong>Key Finding:</strong> {groupFinding}
        </div>
      </div>
    </div>
  );
}
