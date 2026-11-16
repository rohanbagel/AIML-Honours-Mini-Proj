import React, { useState, useEffect, useMemo } from 'react';
import resultsData from './results.json';
import { predictRisk } from './predict.js';

// Component Tabs
import Overview from './components/Overview.jsx';
import DatasetPrep from './components/DatasetPrep.jsx';
import EDA from './components/EDA.jsx';
import Results from './components/Results.jsx';
import Explainability from './components/Explainability.jsx';
import Predict from './components/Predict.jsx';
import AskData from './components/AskData.jsx';
import AboutLimitations from './components/AboutLimitations.jsx';
import ReportNotes from './components/ReportNotes.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [parityResult, setParityResult] = useState(null);

  // Parity check on application mount
  useEffect(() => {
    try {
      if (resultsData?.parity_check && resultsData?.deployed_model) {
        let maxDiff = 0;
        const count = resultsData.parity_check.length;

        resultsData.parity_check.forEach((item, index) => {
          const res = predictRisk(item.inputs, resultsData.deployed_model);
          const diff = Math.abs(res.probability - item.sklearn_probability);
          if (diff > maxDiff) maxDiff = diff;
        });

        console.log(`[Parity Check] Verified ${count} samples. Max absolute difference: ${maxDiff.toFixed(8)} (Tolerance < 0.001)`);
        setParityResult({
          count,
          maxDiff,
          verified: maxDiff < 0.001
        });
      }
    } catch (err) {
      console.error('[Parity Check Error]', err);
    }
  }, []);

  const tabs = useMemo(() => [
    { id: 'overview', label: '1. Overview' },
    { id: 'dataset', label: '2. Dataset & Prep' },
    { id: 'eda', label: '3. EDA' },
    { id: 'results', label: '4. Results' },
    { id: 'explainability', label: '5. Explainability' },
    { id: 'predict', label: '6. Predict' },
    { id: 'ask-data', label: '7. Ask the Data' },
    { id: 'about', label: '8. About & Limitations' },
    { id: 'report', label: '9. Report Notes' }
  ], []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview results={resultsData} />;
      case 'dataset':
        return <DatasetPrep results={resultsData} />;
      case 'eda':
        return <EDA results={resultsData} />;
      case 'results':
        return <Results results={resultsData} />;
      case 'explainability':
        return <Explainability results={resultsData} />;
      case 'predict':
        return <Predict results={resultsData} />;
      case 'ask-data':
        return <AskData results={resultsData} />;
      case 'about':
        return <AboutLimitations results={resultsData} parityResult={parityResult} />;
      case 'report':
        return <ReportNotes results={resultsData} />;
      default:
        return <Overview results={resultsData} />;
    }
  };

  return (
    <div className="app-layout">
      {/* Persistent Academic Prototype Disclaimer Banner */}
      <div className="disclaimer-banner" role="alert">
        <span className="disclaimer-icon">⚠️</span>
        <span className="disclaimer-text">
          <strong>Academic Prototype</strong>. Not a substitute for professional medical advice, diagnosis, or treatment.
        </span>
      </div>

      {/* Main Top Navigation Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-group">
            <div className="brand-logo">🩺</div>
            <div>
              <div className="brand-title">Diabetes Risk Prediction Dashboard</div>
              <div className="brand-subtitle">BE AI&DS Healthcare AI/ML Mini Project | SDG 3</div>
            </div>
          </div>
          <div className="header-badge">
            <span className="live-dot"></span> In-Browser Inference
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="tab-nav" aria-label="Dashboard Tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {renderActiveTab()}
      </main>

      {/* Academic Footer */}
      <footer className="app-footer">
        <div>
          Diabetes Risk Prediction Dashboard &bull; BE Artificial Intelligence & Data Science &bull; Academic Project
        </div>
        <div className="font-xs text-muted" style={{ marginTop: 4 }}>
          Dataset: Pima Indians Diabetes Database (NIDDK / OpenML 37) &bull; Frontend: React + Recharts &bull; AI: Gemini API
        </div>
      </footer>
    </div>
  );
}
