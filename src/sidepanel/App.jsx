import React, { useState, useEffect } from 'react';
import { Settings, Sparkles, Copy, ArrowRight, Save, X, MessageSquare, Loader2 } from 'lucide-react';
import './App.css';
import { saveSettings, getSettings, improvePrompt } from '../utils/llm';

function App() {
    const [view, setView] = useState('main'); // 'main' | 'settings'
    const [settings, setSettingsState] = useState({
        apiKey: '',
        provider: 'gemini', // 'gemini' | 'openai'
        model: 'gemini-1.5-pro'
    });
    const [currentPrompt, setCurrentPrompt] = useState('');
    const [improvementPoints, setImprovementPoints] = useState([]);
    const [structuredPrompt, setStructuredPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const s = await getSettings();
        if (s.apiKey) {
            setSettingsState(s);
        } else {
            setView('settings');
        }
    };

    const handleSaveSettings = async () => {
        await saveSettings(settings);
        setView('main');
    };

    const handleCapture = async () => {
        setError('');
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                throw new Error('No active tab found');
            }

            if (!tab.id) {
                throw new Error('Tab ID is undefined');
            }

            console.log('Sending message to tab:', tab.id);

            const response = await chrome.tabs.sendMessage(tab.id, { action: 'GET_PROMPT' });

            console.log('Response received:', response);

            if (response && response.prompt) {
                setCurrentPrompt(response.prompt);
                if (!response.prompt.trim()) {
                    setError('Captured text is empty. Please focus on a text input and try again.');
                }
            } else {
                setError('No text found in active input. Please click inside a text field first.');
            }
        } catch (err) {
            console.error('Capture error:', err);
            setError(`Failed to capture: ${err.message}`);
        }
    };

    const handleImprove = async () => {
        if (!currentPrompt.trim()) {
            setError('Please enter or capture a prompt first.');
            return;
        }
        setIsLoading(true);
        setError('');
        setImprovementPoints([]);
        setStructuredPrompt('');

        try {
            const result = await improvePrompt(currentPrompt, settings);
            setImprovementPoints(result.improvementPoints || []);
            setStructuredPrompt(result.structuredPrompt || '');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(structuredPrompt);
        // Could add a toast here
    };

    if (view === 'settings') {
        return (
            <div className="container">
                <div className="header">
                    <h1>Settings</h1>
                    <button className="btn-icon" onClick={() => setView('main')}><X size={20} /></button>
                </div>
                <div className="card">
                    <div className="form-group">
                        <label>AI Provider</label>
                        <select
                            value={settings.provider}
                            onChange={(e) => setSettingsState({ ...settings, provider: e.target.value })}
                        >
                            <option value="gemini">Google Gemini</option>
                            <option value="openai">OpenAI</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>API Key</label>
                        <input
                            type="password"
                            value={settings.apiKey}
                            onChange={(e) => setSettingsState({ ...settings, apiKey: e.target.value })}
                            placeholder="Enter your API Key"
                        />
                    </div>
                    <div className="form-group">
                        <label>Model Name (Optional)</label>
                        <input
                            type="text"
                            value={settings.model}
                            onChange={(e) => setSettingsState({ ...settings, model: e.target.value })}
                            placeholder={settings.provider === 'gemini' ? 'gemini-1.5-pro' : 'gpt-4o'}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={handleSaveSettings}>
                        <Save size={16} /> Save Settings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header">
                <h1>Prompt Assistant</h1>
                <button className="btn-icon" onClick={() => setView('settings')}><Settings size={20} /></button>
            </div>

            <div className="card">
                <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>Original Prompt</label>
                <textarea
                    value={currentPrompt}
                    onChange={(e) => setCurrentPrompt(e.target.value)}
                    placeholder="Type or capture your prompt here..."
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button className="btn btn-secondary" onClick={handleCapture}>
                        <ArrowRight size={16} /> Capture
                    </button>
                    <button className="btn btn-primary" onClick={handleImprove} disabled={isLoading}>
                        {isLoading ? <Loader2 size={16} className="loading-spinner" /> : <Sparkles size={16} />}
                        {isLoading ? 'Improving...' : 'Improve'}
                    </button>
                </div>
                {error && <div style={{ color: 'red', fontSize: '12px', marginTop: '8px' }}>{error}</div>}
            </div>

            {(improvementPoints.length > 0 || structuredPrompt) && (
                <div className="card result-container">
                    {improvementPoints.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>Suggestions</label>
                            <ul className="improvement-list">
                                {improvementPoints.map((point, i) => (
                                    <li key={i} className="improvement-item">{point}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>Structured Prompt</label>
                        <textarea
                            style={{ flex: 1, minHeight: '150px' }}
                            value={structuredPrompt}
                            onChange={(e) => setStructuredPrompt(e.target.value)}
                        />
                        <button className="btn btn-secondary" style={{ marginTop: '8px' }} onClick={handleCopy}>
                            <Copy size={16} /> Copy to Clipboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
