import React, { useState, useEffect } from 'react';
import { Settings, Sparkles, Copy, ArrowRight, Save, X, MessageSquare, Loader2, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import './App.css';
import { saveSettings, getSettings, improvePrompt } from '../utils/llm';
import { extractPlaceholders, replacePlaceholders, areAllPlaceholdersFilled } from '../utils/placeholder-parser';
import { EXPLANATION_STYLES } from '../utils/system-prompt';
import PlaceholderModal from './PlaceholderModal';

// Default models for each provider
const DEFAULT_MODELS = {
    openai: 'gpt-5',
    gemini: 'gemini-2.5-pro',
    claude: 'claude-sonnet-4-5'
};

function App() {
    const [view, setView] = useState('main'); // 'main' | 'settings'
    const [settings, setSettingsState] = useState({
        apiKey: '',
        provider: 'gemini', // 'gemini' | 'openai' | 'claude'
        openaiModel: DEFAULT_MODELS.openai,
        geminiModel: DEFAULT_MODELS.gemini,
        claudeModel: DEFAULT_MODELS.claude
    });
    const [currentPrompt, setCurrentPrompt] = useState('');
    const [improvementPoints, setImprovementPoints] = useState([]);
    const [structuredPrompt, setStructuredPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Placeholder editor state
    const [placeholders, setPlaceholders] = useState([]);
    const [placeholderValues, setPlaceholderValues] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Explanation style state
    const [explanationStyle, setExplanationStyle] = useState('beginnerFriendly');
    const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);

    // Helper function to get current model based on provider
    const getCurrentModel = () => {
        const { provider, openaiModel, geminiModel, claudeModel } = settings;
        if (provider === 'openai') return openaiModel;
        if (provider === 'gemini') return geminiModel;
        if (provider === 'claude') return claudeModel;
        return '';
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const s = await getSettings();
        if (s.apiKey) {
            // Merge loaded settings with defaults for any missing models
            setSettingsState({
                apiKey: s.apiKey || '',
                provider: s.provider || 'gemini',
                openaiModel: s.openaiModel || DEFAULT_MODELS.openai,
                geminiModel: s.geminiModel || DEFAULT_MODELS.gemini,
                claudeModel: s.claudeModel || DEFAULT_MODELS.claude
            });
            setExplanationStyle(s.explanationStyle || 'beginnerFriendly');
        } else {
            setView('settings');
        }
    };

    const handleProviderChange = (newProvider) => {
        setSettingsState({ ...settings, provider: newProvider });
    };

    const handleModelChange = (newModel) => {
        const { provider } = settings;
        if (provider === 'openai') {
            setSettingsState({ ...settings, openaiModel: newModel });
        } else if (provider === 'gemini') {
            setSettingsState({ ...settings, geminiModel: newModel });
        } else if (provider === 'claude') {
            setSettingsState({ ...settings, claudeModel: newModel });
        }
    };

    const handleSetDefaultModel = () => {
        const { provider } = settings;
        const defaultModel = DEFAULT_MODELS[provider];
        if (provider === 'openai') {
            setSettingsState({ ...settings, openaiModel: defaultModel });
        } else if (provider === 'gemini') {
            setSettingsState({ ...settings, geminiModel: defaultModel });
        } else if (provider === 'claude') {
            setSettingsState({ ...settings, claudeModel: defaultModel });
        }
    };

    const handleStyleChange = async (newStyle) => {
        setExplanationStyle(newStyle);
        await chrome.storage.local.set({ explanationStyle: newStyle });
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
            // Pass the current model for the selected provider
            const settingsForAPI = {
                apiKey: settings.apiKey,
                provider: settings.provider,
                model: getCurrentModel(),
                explanationStyle: explanationStyle
            };
            const result = await improvePrompt(currentPrompt, settingsForAPI);
            setImprovementPoints(result.improvementPoints || []);
            setStructuredPrompt(result.structuredPrompt || '');

            // Detect placeholders in structured prompt
            const detectedPlaceholders = extractPlaceholders(result.structuredPrompt || '');
            setPlaceholders(detectedPlaceholders);
            setPlaceholderValues({});
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleApplyPlaceholders = (values) => {
        setPlaceholderValues(values);
    };

    const handleCopy = async () => {
        const finalText = replacePlaceholders(structuredPrompt, placeholderValues);
        // Normalize line breaks to LF to prevent layout issues in web apps
        const normalizedText = finalText.replace(/\r\n/g, '\n');

        // Blobオブジェクトを作成し、text/plain タイプを指定する
        // このとき、改行コードはLFのまま保持される
        const blob = new Blob([normalizedText], { type: 'text/plain' });

        // ClipboardItem を作成し、write() メソッドで書き込む
        const clipboardItem = new ClipboardItem({ 'text/plain': blob });

        try {
            await navigator.clipboard.write([clipboardItem]);
            console.log('LF改行コードを保持したままクリップボードにコピーしました。');
        } catch (err) {
            console.error('クリップボードへの書き込みに失敗しました:', err);
            // write()が使えない/失敗した場合は、writeText()へのフォールバックする
            await navigator.clipboard.writeText(normalizedText);
        }

        // Could add a toast here
    };

    const allPlaceholdersFilled = areAllPlaceholdersFilled(placeholders, placeholderValues);
    const hasPlaceholders = placeholders.length > 0;

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
                            onChange={(e) => handleProviderChange(e.target.value)}
                        >
                            <option value="gemini">Google Gemini</option>
                            <option value="openai">OpenAI</option>
                            <option value="claude">Anthropic Claude</option>
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
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                            <input
                                type="text"
                                value={getCurrentModel()}
                                onChange={(e) => handleModelChange(e.target.value)}
                                placeholder={DEFAULT_MODELS[settings.provider]}
                                style={{ flex: 1, minWidth: 0 }}
                            />
                            <button
                                className="btn btn-secondary"
                                onClick={handleSetDefaultModel}
                                style={{
                                    width: 'auto',
                                    padding: '4px 8px',
                                    whiteSpace: 'nowrap',
                                    fontSize: '11px',
                                    flexShrink: 0
                                }}
                            >
                                Default
                            </button>
                        </div>
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
                <div className="explanation-style-group">
                    <div className="style-header">
                        <label className="section-label">Explanation Style:</label>
                        <span className="current-style">{EXPLANATION_STYLES[explanationStyle]?.label || 'None'}</span>
                        <button
                            className="btn-dropdown-toggle"
                            onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                            type="button"
                        >
                            {isStyleDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>
                    {isStyleDropdownOpen && (
                        <div className="radio-group">
                            {Object.entries(EXPLANATION_STYLES).map(([key, config]) => (
                                <label key={key} className="radio-label">
                                    <input
                                        type="radio"
                                        name="explanationStyle"
                                        value={key}
                                        checked={explanationStyle === key}
                                        onChange={(e) => handleStyleChange(e.target.value)}
                                    />
                                    <span>{config.label}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
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
                        {hasPlaceholders && !allPlaceholdersFilled ? (
                            <button
                                className="btn btn-warning"
                                style={{ marginTop: '8px' }}
                                onClick={handleOpenModal}
                            >
                                <Edit3 size={16} /> Edit Prompt
                            </button>
                        ) : (
                            <button
                                className="btn btn-secondary"
                                style={{ marginTop: '8px' }}
                                onClick={handleCopy}
                            >
                                <Copy size={16} /> Copy to Clipboard
                            </button>
                        )}
                    </div>
                </div>
            )}

            <PlaceholderModal
                isOpen={isModalOpen}
                placeholders={placeholders}
                values={placeholderValues}
                onValueChange={handleApplyPlaceholders}
                onClose={handleCloseModal}
                onApply={handleApplyPlaceholders}
                promptText={structuredPrompt}
            />
        </div>
    );
}

export default App;
