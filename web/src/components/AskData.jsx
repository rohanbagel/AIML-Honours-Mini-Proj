import React, { useState, useEffect, useRef } from 'react';
import { Bot, Key, Send, Sparkles, User, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { askClinicalAssistant, getStoredApiKey, setStoredApiKey, clearStoredApiKey, hasEnvApiKey } from '../gemini.js';

export default function AskData() {
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [inputKey, setInputKey] = useState('');
  
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am your **Clinical Informatics AI Assistant**, grounded in empirical evidence from the **101,766-encounter UCI 130-US Hospitals dataset** ($N = 69,990$ study cohort).

You can ask me about:
- Epidemiological risk drivers (prior admissions, length of stay, insulin volatility)
- Machine learning performance comparisons (LightGBM vs Logistic Regression vs Random Forest)
- The real-world clinical ceiling (lack of SDOH in EHR data)
- Counterfactual discharge interventions and CMS HRRP post-discharge care pathways.

Select a quick question below or type your own query.`
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sampleQuestions = [
    "How does prior inpatient hospitalization impact readmission risk?",
    "What are the top modifiable clinical factors prior to discharge?",
    "Why do readmission models plateau around ROC-AUC 0.65 in published literature?",
    "How does testing HbA1c before discharge affect patient outcomes?",
    "Explain the trade-off between LightGBM and Logistic Regression in this project.",
    "What post-discharge care pathway is recommended for high-risk patients?"
  ];

  const handleSaveKey = () => {
    if (!inputKey.trim()) return;
    setStoredApiKey(inputKey.trim());
    setApiKey(inputKey.trim());
    setInputKey('');
    setIsKeyModalOpen(false);
  };

  const handleClearKey = () => {
    clearStoredApiKey();
    setApiKey('');
  };

  const handleSendMessage = async (textToSend = null) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || isLoading) return;

    if (!apiKey) {
      setIsKeyModalOpen(true);
      return;
    }

    const newHistory = [...messages, { role: 'user', content: query.trim() }];
    setMessages(newHistory);
    if (!textToSend) setInputPrompt('');
    setIsLoading(true);
    setErrorMessage('');

    try {
      const reply = await askClinicalAssistant(query.trim(), messages);
      setMessages([...newHistory, { role: 'assistant', content: reply }]);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate response. Please check your Gemini API key.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Header with API Key Status */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--teal-primary)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)' }}>
              Clinical AI Assistant (Gemini 2.5 Flash Grounded)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {apiKey ? (
              <>
                <span className="badge badge-mint" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle2 size={12} /> {hasEnvApiKey() ? 'Key Connected (.env)' : 'Key Connected (Session)'}
                </span>
                {!hasEnvApiKey() && (
                  <button className="btn btn-outline btn-sm" onClick={handleClearKey}>
                    <Trash2 size={13} /> Disconnect
                  </button>
                )}
              </>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => setIsKeyModalOpen(true)}>
                <Key size={13} /> Enter Gemini API Key
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Questions Carousel/Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            className="btn btn-outline btn-sm"
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((m, idx) => (
            <div key={idx} className={`chat-bubble ${m.role}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', opacity: 0.85, fontSize: '0.725rem', fontWeight: 700 }}>
                {m.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                <span>{m.role === 'user' ? 'Clinician / User' : 'Grounded Clinical AI'}</span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {m.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-bubble assistant">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <Sparkles size={14} className="spin" />
                <span>Consulting hospital clinical dataset knowledge base...</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--red-soft)', color: 'var(--red-alert)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="chat-input-bar">
          <input
            type="text"
            className="form-input"
            placeholder={apiKey ? "Ask a clinical question about readmission risks or the dataset..." : "Please enter your Gemini API key to ask questions"}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
          />
          <button
            className="btn btn-primary"
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputPrompt.trim()}
          >
            <Send size={15} />
            <span>Ask</span>
          </button>
        </div>
      </div>

      {/* Modal Dialog for API Key */}
      {isKeyModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)' }}>Configure Google AI Studio API Key</h3>
              <button 
                onClick={() => setIsKeyModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Your API key is stored only in temporary browser <code>sessionStorage</code> and is sent directly from your browser to Google Generative Language endpoints. It is never logged or saved to any backend disk.
              </p>
              <div className="form-group">
                <label className="form-label">Gemini API Key</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="AIzaSy..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Get a free API key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--teal-primary)' }}>aistudio.google.com</a>.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={() => setIsKeyModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveKey} disabled={!inputKey.trim()}>
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
