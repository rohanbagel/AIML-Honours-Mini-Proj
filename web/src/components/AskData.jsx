import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '../gemini.js';
import { buildKnowledgeBase } from '../knowledge.js';

export default function AskData({ results }) {
  const [apiKey, setApiKey] = useState(() => {
    return sessionStorage.getItem('gemini_api_key') || '';
  });
  const [keyInput, setKeyInput] = useState(() => {
    return sessionStorage.getItem('gemini_api_key') || '';
  });
  const [isKeySaved, setIsKeySaved] = useState(() => {
    return Boolean(sessionStorage.getItem('gemini_api_key'));
  });

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your research assistant for the Diabetes Risk Prediction project. You can ask me questions about dataset metrics, zero imputation, cross-validation scores, model recall, or feature importances based strictly on our empirical findings.'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const suggestedQuestions = [
    'Which feature matters most for predicting diabetes?',
    'Which model has the best recall and why does recall matter here?',
    'How many invalid zeros were found in Insulin and how were they handled?',
    'What is the diabetes rate for people over 50?',
    'What are the limitations of this dataset?',
    'How good is the model overall?'
  ];

  const handleSaveKey = () => {
    if (!keyInput.trim()) {
      setErrorMessage('Please enter an API key before saving.');
      return;
    }
    sessionStorage.setItem('gemini_api_key', keyInput.trim());
    setApiKey(keyInput.trim());
    setIsKeySaved(true);
    setErrorMessage('');
  };

  const handleClearKey = () => {
    sessionStorage.removeItem('gemini_api_key');
    setApiKey('');
    setKeyInput('');
    setIsKeySaved(false);
  };

  const handleSend = async (textToSend) => {
    const query = typeof textToSend === 'string' ? textToSend : inputText;
    if (!query || !query.trim() || isLoading) return;

    if (!apiKey) {
      setErrorMessage('Please enter and save your Gemini API key above to chat.');
      return;
    }

    const userMessage = { role: 'user', text: query.trim() };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);
    setErrorMessage('');

    try {
      const knowledgeBase = buildKnowledgeBase(results);
      const assistantReply = await sendChatMessage(apiKey, newHistory, knowledgeBase);
      setMessages(prev => [...prev, { role: 'assistant', text: assistantReply }]);
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred while communicating with Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        text: 'Chat history cleared. What would you like to know about our diabetes dataset or models?'
      }
    ]);
    setErrorMessage('');
  };

  return (
    <div className="tab-pane">
      <div className="section-title">
        <h2>Ask the Data: AI Research Assistant</h2>
        <span className="badge badge-neutral">Powered by Google Gemini</span>
      </div>

      {/* API Key Box */}
      <div className="card key-box-card">
        <div className="card-header-flex">
          <div>
            <h3>Gemini API Access Key</h3>
            <p className="font-xs text-muted" style={{ marginTop: 2 }}>
              Provide your personal API key from{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-link"
              >
                Google AI Studio ↗
              </a>
              . Key is never saved to disk and never logged.
            </p>
          </div>
          {isKeySaved && (
            <span className="badge badge-green font-xs">✓ Active Session Key</span>
          )}
        </div>

        <div className="key-input-row">
          <input
            type="password"
            className="form-input key-input"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="AIzaSy..."
            autoComplete="off"
          />
          <button type="button" className="btn btn-black" onClick={handleSaveKey}>
            Save for this session
          </button>
          {isKeySaved && (
            <button type="button" className="btn btn-outline" onClick={handleClearKey}>
              Clear key
            </button>
          )}
        </div>
        <p className="font-xs text-muted" style={{ marginTop: 8 }}>
          🔒 Your key stays in this browser tab and is sent only to Google. Don't share a deployed link that contains your key.
        </p>
      </div>

      {/* Suggested Inquiries */}
      <div className="card suggestions-card">
        <h4 className="font-sm font-bold">Suggested Inquiries (Click to Ask):</h4>
        <div className="suggestions-grid">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              className="suggestion-pill"
              onClick={() => {
                if (isKeySaved) {
                  handleSend(q);
                } else {
                  setInputText(q);
                }
              }}
            >
              💬 {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Display Area */}
      <div className="card chat-container-card">
        <div className="chat-header-bar">
          <div className="font-bold font-sm">Project Assistant Conversation</div>
          <button type="button" className="btn btn-secondary font-xs" onClick={handleClearChat}>
            Clear chat
          </button>
        </div>

        <div className={`chat-box ${!isKeySaved ? 'chat-disabled' : ''}`}>
          {!isKeySaved && (
            <div className="chat-lock-overlay">
              <div className="lock-message">
                <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🔑</div>
                <strong>API Key Required</strong>
                <p className="font-xs text-muted" style={{ marginTop: 4 }}>
                  Please enter and save your Gemini API key above to unlock the assistant.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble-wrap bubble-${msg.role}`}>
              <div className={`chat-bubble bubble-${msg.role}`}>
                <div className="bubble-author">{msg.role === 'user' ? 'You' : 'Data Assistant'}</div>
                <div className="bubble-text">{msg.text}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-bubble-wrap bubble-assistant">
              <div className="chat-bubble bubble-assistant thinking-bubble">
                <span className="pulse-dot"></span> Thinking and analyzing knowledge base...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Semantic Error Alert */}
        {errorMessage && (
          <div className="alert-box alert-danger font-sm" style={{ margin: '10px 18px' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Input Bar */}
        <div className="chat-input-bar">
          <textarea
            className="chat-textarea"
            rows="2"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isKeySaved ? "Type your question about the project here (Press Enter to send)..." : "Save an API key above first..."}
            disabled={!isKeySaved || isLoading}
          />
          <button
            type="button"
            className="btn btn-black send-btn"
            onClick={() => handleSend()}
            disabled={!isKeySaved || isLoading || !inputText.trim()}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>

        <div className="chat-footer-note font-xs text-muted text-center">
          Answers are AI-generated from the project's summary findings and may contain mistakes.
        </div>
      </div>
    </div>
  );
}
