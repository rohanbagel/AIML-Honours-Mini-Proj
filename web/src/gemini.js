import { CLINICAL_KNOWLEDGE_BASE } from './knowledge.js';

const API_KEY_SESSION_KEY = 'clinical_gemini_api_key';

export function getStoredApiKey() {
  const envKey = import.meta.env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }
  return sessionStorage.getItem(API_KEY_SESSION_KEY) || '';
}

export function hasEnvApiKey() {
  const envKey = import.meta.env?.VITE_GEMINI_API_KEY;
  return Boolean(envKey && envKey.trim());
}

export function setStoredApiKey(key) {
  if (key) {
    sessionStorage.setItem(API_KEY_SESSION_KEY, key.trim());
  } else {
    sessionStorage.removeItem(API_KEY_SESSION_KEY);
  }
}

export function clearStoredApiKey() {
  sessionStorage.removeItem(API_KEY_SESSION_KEY);
}

/**
 * Ask the grounded Gemini clinical assistant.
 * Uses session-stored API key and queries Google AI Studio REST API.
 * 
 * @param {string} prompt - User query
 * @param {Array} history - Previous messages
 * @returns {Promise<string>} Response markdown text
 */
export async function askClinicalAssistant(prompt, history = []) {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('API key is not configured. Please enter your Google AI Studio Gemini API key to ask questions.');
  }

  const systemInstruction = {
    parts: [
      {
        text: `You are an expert Clinical Informatics & Machine Learning Specialist assisting with the "Patient Follow-up & 30-Day Hospital Readmission Prognosis Estimator" project (College: Fr. Conceicao Rodrigues College of Engineering, BE Computer Engineering).
        
You have authoritative access to the empirical findings from the 101,766-encounter UCI 130-US Hospitals Inpatient Dataset analysis:
${CLINICAL_KNOWLEDGE_BASE}

GUIDELINES:
1. Always base your quantitative claims directly on the dataset metrics above (e.g. 69,990 cohort, 8.98% readmission prevalence, LightGBM ROC-AUC 0.6465, Logistic Regression ROC-AUC 0.6415, prior inpatient admission as top risk factor).
2. Explain medical context clearly: CMS HRRP penalties, insulin adjustment risk, importance of inpatient HbA1c testing, and post-discharge transitional care.
3. Be professional, scientifically rigorous, and concise. Use Markdown with bullet points where appropriate.
4. If a question falls outside the scope of this hospital dataset or clinical scope, note the boundary politely.`
      }
    ]
  };

  const contents = [];

  // Add conversation history
  history.forEach((msg) => {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  });

  // Add current prompt
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents,
      systemInstruction,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024
      }
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`Gemini API Error: ${message}`);
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const responseText = candidate?.content?.parts?.[0]?.text;

  if (!responseText) {
    throw new Error('No response returned from the Gemini model.');
  }

  return responseText;
}
