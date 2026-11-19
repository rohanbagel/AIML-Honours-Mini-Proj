import React, { useState } from 'react';
import results from './results.json';
import { 
  Activity, BarChart3, BookOpen, Bot, CheckCircle2, Cpu, Database, 
  FileText, HeartPulse, HelpCircle, Hospital, ShieldCheck, 
  Sliders, Stethoscope, Users 
} from 'lucide-react';

import Overview from './components/Overview.jsx';
import DatasetPrep from './components/DatasetPrep.jsx';
import Results from './components/Results.jsx';
import Predict from './components/Predict.jsx';
import AskData from './components/AskData.jsx';
import AboutLimitations from './components/AboutLimitations.jsx';
import ReportNotes from './components/ReportNotes.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  const navItems = [
    { id: 'overview', label: 'Clinical Overview', icon: Hospital },
    { id: 'dataset', label: 'Cohort & Prep', icon: Database },
    { id: 'results', label: 'Benchmark Models', icon: BarChart3 },
    { id: 'predict', label: 'Discharge Simulator', icon: Sliders, highlight: true },
    { id: 'ask', label: 'Ask Clinical AI', icon: Bot },
    { id: 'limitations', label: 'Parity & Ethics', icon: ShieldCheck },
    { id: 'report', label: 'Report Notes', icon: FileText }
  ];

  return (
    <div className="app-container">
      {/* Top Clinical Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-section">
            <div className="brand-icon-wrap">
              <HeartPulse size={24} />
            </div>
            <div>
              <h1 className="brand-title">Patient Follow-up & 30-Day Readmission Prognosis Estimator</h1>
              <div className="brand-subtitle">
                BE Computer Engineering (Honours in AI/ML) | Track #4 | Fr. Conceicao Rodrigues College of Engineering
              </div>
            </div>
          </div>

          <div className="header-badges">
            <span className="badge badge-mint" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="pulse-dot" /> Live Inpatient CDS
            </span>
            <span className="badge badge-navy">
              <Users size={12} /> 101,766 Encounters
            </span>
            <span className="badge badge-teal">
              <Hospital size={12} /> 130 US Hospitals
            </span>
          </div>
        </div>
      </header>

      {/* Clinical Context Bar */}
      <div className="context-bar">
        <div className="context-bar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span><strong>Target:</strong> Acute 30-Day Readmission (&lt;30d)</span>
            <span>&bull;</span>
            <span><strong>Cohort:</strong> 69,990 clean inpatient encounters</span>
            <span>&bull;</span>
            <span><strong>Class Prevalence:</strong> 8.98% acute readmissions</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ color: 'var(--teal-primary)', fontWeight: 600 }}>
              Top Discriminator: LightGBM (AUC: 0.6465)
            </span>
            <span className="badge badge-navy" style={{ fontSize: '0.7rem' }}>
              Deployed: LogReg (AUC: 0.6415)
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Navigation Tabs */}
        <nav className="tabs-nav" aria-label="Dashboard Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
                style={item.highlight && !isActive ? { color: 'var(--teal-primary)', borderColor: 'var(--teal-primary)' } : undefined}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.highlight && !isActive && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--teal-primary)' }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Tab View Routing */}
        {activeTab === 'overview' && <Overview results={results} onNavigateTab={setActiveTab} />}
        {activeTab === 'dataset' && <DatasetPrep results={results} />}
        {activeTab === 'results' && <Results results={results} />}
        {activeTab === 'predict' && <Predict results={results} />}
        {activeTab === 'ask' && <AskData />}
        {activeTab === 'limitations' && <AboutLimitations results={results} />}
        {activeTab === 'report' && <ReportNotes results={results} />}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-light)', backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            Patient Follow-up & Prognosis Estimator &copy; 2026 | BE Computer Engineering Healthcare AI/ML Mini Project
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <span>UCI Diabetes 130-US Hospitals</span>
            <span>CMS HRRP Guidelines</span>
            <span>UN SDG 3 Target 3.4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
