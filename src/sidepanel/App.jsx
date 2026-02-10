import React, { useState, useEffect, useRef } from 'react';
import { Settings, Sparkles, Copy, ArrowRight, Save, X, MessageSquare, Loader2, Edit3, ChevronDown, ChevronUp, RefreshCw, Paperclip, File, FileText, Image as ImageIcon } from 'lucide-react';
import './App.css';
import { saveSettings, getSettings, improvePrompt } from '../utils/llm';
import { extractPlaceholders, replacePlaceholders, areAllPlaceholdersFilled } from '../utils/placeholder-parser';
import { EXPLANATION_STYLES } from '../utils/system-prompt';
import PlaceholderModal from './PlaceholderModal';
import ConfirmDialog from './ConfirmDialog';
import useTranslation from '../hooks/useTranslation';

// Default models for each provider
const DEFAULT_MODELS = {
    openai: 'gpt-5-mini',
    gemini: 'gemini-2.5-pro',
    claude: 'claude-sonnet-4-5',
    xai: 'grok-4-0709'
};

function App() {
    const [view, setView] = useState('main'); // 'main' | 'settings'
    const [settings, setSettingsState] = useState({
        apiKey: '',
        provider: 'gemini', // 'gemini' | 'openai' | 'claude' | 'xai'
        openaiModel: DEFAULT_MODELS.openai,
        geminiModel: DEFAULT_MODELS.gemini,
        claudeModel: DEFAULT_MODELS.claude,
        xaiModel: DEFAULT_MODELS.xai
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

    // Resizable divider state (Main)
    const [topHeightPercentage, setTopHeightPercentage] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

    // Resizable divider state (Inner: Suggestions vs Structured Prompt)
    const [suggestionsHeightPercentage, setSuggestionsHeightPercentage] = useState(40);
    const [isInnerDragging, setIsInnerDragging] = useState(false);
    const innerContainerRef = useRef(null);

    // File attachment state
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [fileToDelete, setFileToDelete] = useState(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);

    // Translation hook
    const { t, currentLanguage, changeLanguage, supportedLanguages } = useTranslation();

    // Helper function to get current model based on provider
    const getCurrentModel = () => {
        const { provider, openaiModel, geminiModel, claudeModel, xaiModel } = settings;
        if (provider === 'openai') return openaiModel;
        if (provider === 'gemini') return geminiModel;
        if (provider === 'claude') return claudeModel;
        if (provider === 'xai') return xaiModel;
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
                claudeModel: s.claudeModel || DEFAULT_MODELS.claude,
                xaiModel: s.xaiModel || DEFAULT_MODELS.xai
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
        } else if (provider === 'xai') {
            setSettingsState({ ...settings, xaiModel: newModel });
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
        } else if (provider === 'xai') {
            setSettingsState({ ...settings, xaiModel: defaultModel });
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
                throw new Error(t('error_no_active_tab'));
            }

            if (!tab.id) {
                throw new Error(t('error_tab_id_undefined'));
            }

            console.log('Sending message to tab:', tab.id);

            const response = await chrome.tabs.sendMessage(tab.id, { action: 'GET_PROMPT' });

            console.log('Response received:', response);

            if (response && response.prompt) {
                setCurrentPrompt(response.prompt);
                if (!response.prompt.trim()) {
                    setError(t('error_empty_text'));
                }
            } else {
                setError(t('error_no_text_found'));
            }
        } catch (err) {
            console.error('Capture error:', err);
            setError(t('error_capture_failed', { message: err.message }));
        }
    };

    const handleImprove = async () => {
        if (!currentPrompt.trim()) {
            setError(t('error_no_prompt'));
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
            const result = await improvePrompt(currentPrompt, settingsForAPI, attachedFiles);
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

    // File attachment handlers
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        setAttachedFiles(prev => [...prev, ...files]);
        // allow selecting the same file again
        e.target.value = '';
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files || []);
        setAttachedFiles(prev => [...prev, ...files]);
        e.target.value = '';
    };

    const handleFileButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageButtonClick = () => {
        imageInputRef.current?.click();
    };

    const handleFileDelete = (file) => {
        setFileToDelete(file);
    };

    const confirmFileDelete = () => {
        setAttachedFiles(prev => prev.filter(f => f !== fileToDelete));
        setFileToDelete(null);
    };

    const cancelFileDelete = () => {
        setFileToDelete(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDraggingOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const files = Array.from(e.dataTransfer.files || []);
        setAttachedFiles(prev => [...prev, ...files]);
    };

    const getFileIcon = (file) => {
        if (file.type.startsWith('image/')) return <ImageIcon size={16} />;
        if (file.type === 'application/pdf') return <File size={16} />;
        return <FileText size={16} />;
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
    const hasResults = improvementPoints.length > 0 || structuredPrompt;

    // Resizing logic
    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            // Calculate relative Y position within the container
            // The container starts after the header
            const relativeY = e.clientY - containerRect.top;
            const newPercentage = (relativeY / containerRect.height) * 100;

            // Clamp between 20% and 80% to ensure both panels remain usable
            const clamped = Math.min(Math.max(newPercentage, 20), 80);
            setTopHeightPercentage(clamped);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            // Add a class to body to enforce cursor style during drag
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
        } else {
            if (!isInnerDragging) {
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            if (isDragging) {
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };
    }, [isDragging, isInnerDragging]);

    // Inner Resizing logic
    const handleInnerMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling to outer resizer
        setIsInnerDragging(true);
    };

    useEffect(() => {
        const handleInnerMouseMove = (e) => {
            if (!isInnerDragging || !innerContainerRef.current) return;

            const containerRect = innerContainerRef.current.getBoundingClientRect();
            const relativeY = e.clientY - containerRect.top;
            const newPercentage = (relativeY / containerRect.height) * 100;

            // Clamp between 20% and 80%
            const clamped = Math.min(Math.max(newPercentage, 20), 80);
            setSuggestionsHeightPercentage(clamped);
        };

        const handleInnerMouseUp = () => {
            setIsInnerDragging(false);
        };

        if (isInnerDragging) {
            window.addEventListener('mousemove', handleInnerMouseMove);
            window.addEventListener('mouseup', handleInnerMouseUp);
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
        } else {
            if (!isDragging) {
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        }

        return () => {
            window.removeEventListener('mousemove', handleInnerMouseMove);
            window.removeEventListener('mouseup', handleInnerMouseUp);
            if (isInnerDragging) {
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };
    }, [isInnerDragging, isDragging]);

    if (view === 'settings') {
        return (
            <div className="container">
                <div className="header">
                    <h1>{t('settings_title')}</h1>
                    <button className="btn-icon" onClick={() => setView('main')}><X size={20} /></button>
                </div>
                <div className="card">
                    <div className="form-group">
                        <label>{t('settings_provider')}</label>
                        <select
                            value={settings.provider}
                            onChange={(e) => handleProviderChange(e.target.value)}
                        >
                            <option value="gemini">{t('settings_provider_gemini')}</option>
                            <option value="openai">{t('settings_provider_openai')}</option>
                            <option value="claude">{t('settings_provider_claude')}</option>
                            <option value="xai">{t('settings_provider_xai')}</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('settings_api_key')}</label>
                        <input
                            type="password"
                            value={settings.apiKey}
                            onChange={(e) => setSettingsState({ ...settings, apiKey: e.target.value })}
                            placeholder={t('settings_api_key_placeholder')}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('settings_model')}</label>
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
                                {t('settings_model_default_button')}
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>{t('settings_language')}</label>
                        <select
                            value={currentLanguage}
                            onChange={(e) => changeLanguage(e.target.value)}
                        >
                            {Object.values(supportedLanguages).map(lang => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.nativeName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={handleSaveSettings}>
                        <Save size={16} /> {t('settings_save')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header">
                <h1>{t('app_title')}</h1>
                <button className="btn-icon" onClick={() => setView('settings')}><Settings size={20} /></button>
            </div>

            <div
                className="content-area"
                ref={containerRef}
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden' // Prevent container itself from scrolling
                }}
            >
                <div
                    className="card input-section"
                    style={{
                        flex: hasResults ? `0 0 ${topHeightPercentage}%` : '1',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        transition: isDragging ? 'none' : 'flex-basis 0.2s ease'
                    }}
                >
                    <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>{t('main_original_prompt')}</label>
                    <textarea
                        value={currentPrompt}
                        onChange={(e) => setCurrentPrompt(e.target.value)}
                        placeholder={t('main_prompt_placeholder')}
                        style={{ flex: 1, minHeight: '60px' }} // Allow textarea to shrink more
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={isDraggingOver ? 'drag-over' : ''}
                    />
                    <div className="explanation-style-group" style={{ flexShrink: 0 }}>
                        <div
                            className="style-header"
                            onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                        >
                            <label className="section-label">{t('main_explanation_style')}</label>
                            <span className="current-style">{EXPLANATION_STYLES[explanationStyle]?.labelKey ? t(EXPLANATION_STYLES[explanationStyle].labelKey) : t('style_none')}</span>
                            <button
                                className="btn-dropdown-toggle"
                                type="button"
                            >
                                {isStyleDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </div>
                        <div
                            className="radio-group"
                            style={{
                                maxHeight: isStyleDropdownOpen ? '500px' : '0',
                                opacity: isStyleDropdownOpen ? 1 : 0,
                                marginTop: isStyleDropdownOpen ? '8px' : '0'
                            }}
                        >
                            {Object.entries(EXPLANATION_STYLES).map(([key, config]) => (
                                <label key={key} className="radio-label">
                                    <input
                                        type="radio"
                                        name="explanationStyle"
                                        value={key}
                                        checked={explanationStyle === key}
                                        onChange={(e) => handleStyleChange(e.target.value)}
                                    />
                                    <span>{t(config.labelKey)}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* File Attachment Bar */}
                    {attachedFiles.length > 0 && (
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap',
                            padding: '8px 0',
                            flexShrink: 0
                        }}>
                            {attachedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className="file-chip"
                                    title={file.name}
                                    onClick={() => handleFileDelete(file)}
                                >
                                    {getFileIcon(file)}
                                    <span className="file-chip-name">{file.name}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                            multiple
                            accept="application/pdf,text/plain,text/markdown,text/csv,application/json,.txt,.md,.csv,.json"
                        />
                        <input
                            type="file"
                            ref={imageInputRef}
                            onChange={handleImageSelect}
                            style={{ display: 'none' }}
                            multiple
                            accept="image/*"
                        />
                        <button
                            className="btn btn-icon"
                            onClick={handleImageButtonClick}
                            title={t('main_attach_images')}
                            style={{ marginLeft: 'auto' }}
                        >
                            <ImageIcon size={16} />
                        </button>
                        <button
                            className="btn btn-icon"
                            onClick={handleFileButtonClick}
                            title={t('main_attach_files')}
                        >
                            <Paperclip size={16} />
                        </button>
                        <button className="btn btn-secondary" onClick={handleCapture}>
                            <ArrowRight size={16} /> {t('main_capture')}
                        </button>
                        <button className="btn btn-primary" onClick={handleImprove} disabled={isLoading}>
                            {isLoading ? <Loader2 size={16} className="loading-spinner" /> : <Sparkles size={16} />}
                            {isLoading ? t('main_improving') : t('main_improve')}
                        </button>
                    </div>
                    {error && <div style={{ color: 'red', fontSize: '12px', marginTop: '8px', flexShrink: 0 }}>{error}</div>}
                </div>

                {hasResults && (
                    <>
                        <div className="resizer" onMouseDown={handleMouseDown}>
                            <div className="resizer-handle-bar"></div>
                        </div>

                        <div
                            className="card result-container"
                            ref={innerContainerRef}
                            style={{
                                flex: 1, // Takes remaining space
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: 0 // Allow scrolling inside
                            }}
                        >
                            {improvementPoints.length > 0 && (
                                <>
                                    <div
                                        style={{
                                            marginBottom: '0', // Removed margin bottom as we control spacing with flex
                                            flex: structuredPrompt ? `0 0 ${suggestionsHeightPercentage}%` : '1',
                                            minHeight: 0, // Allow scrolling
                                            overflowY: 'auto',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: isInnerDragging ? 'none' : 'flex-basis 0.2s ease'
                                        }}
                                    >
                                        <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block', flexShrink: 0 }}>{t('main_suggestions')}</label>
                                        <ul className="improvement-list" style={{ flex: 1, maxHeight: 'none' }}>
                                            {improvementPoints.map((point, i) => (
                                                <li key={i} className="improvement-item">{point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    {structuredPrompt && (
                                        <div className="resizer" onMouseDown={handleInnerMouseDown}>
                                            <div className="resizer-handle-bar"></div>
                                        </div>
                                    )}
                                </>
                            )}

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>{t('main_structured_prompt')}</label>
                                <textarea
                                    style={{ flex: 1, minHeight: '60px' }}
                                    value={structuredPrompt}
                                    onChange={(e) => setStructuredPrompt(e.target.value)}
                                />
                                <div style={{ flexShrink: 0 }}>
                                    {hasPlaceholders && !allPlaceholdersFilled ? (
                                        <button
                                            className="btn btn-warning"
                                            style={{ marginTop: '8px' }}
                                            onClick={handleOpenModal}
                                        >
                                            <Edit3 size={16} /> {t('main_edit_prompt')}
                                        </button>
                                    ) : hasPlaceholders ? (
                                        <>
                                            <button
                                                className="btn btn-info"
                                                style={{ marginTop: '8px' }}
                                                onClick={handleOpenModal}
                                            >
                                                <RefreshCw size={16} /> {t('main_re_edit_prompt')}
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ marginTop: '8px' }}
                                                onClick={handleCopy}
                                            >
                                                <Copy size={16} /> {t('main_copy_clipboard')}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="btn btn-secondary"
                                            style={{ marginTop: '8px' }}
                                            onClick={handleCopy}
                                        >
                                            <Copy size={16} /> {t('main_copy_clipboard')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <PlaceholderModal
                isOpen={isModalOpen}
                placeholders={placeholders}
                values={placeholderValues}
                onValueChange={handleApplyPlaceholders}
                onClose={handleCloseModal}
                onApply={handleApplyPlaceholders}
                promptText={structuredPrompt}
            />

            <ConfirmDialog
                isOpen={fileToDelete !== null}
                title={t('confirm_delete_file')}
                message={t('confirm_delete_file_message', { fileName: fileToDelete?.name })}
                onConfirm={confirmFileDelete}
                onCancel={cancelFileDelete}
            />
        </div>
    );
}

export default App;
