import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import './PlaceholderModal.css';
import useTranslation from '../hooks/useTranslation';

function PlaceholderModal({
    isOpen,
    placeholders,
    values,
    onValueChange,
    onClose,
    onApply,
    promptText
}) {
    const [localValues, setLocalValues] = useState(values);
    const [customMode, setCustomMode] = useState({});
    const [customInputValues, setCustomInputValues] = useState({});
    const { t } = useTranslation();

    // Initialize custom mode based on existing values
    useEffect(() => {
        const newCustomMode = {};
        const newCustomInputValues = {};

        placeholders.forEach(placeholder => {
            const value = values[placeholder.id];
            if (value && placeholder.options) {
                // Check if the value is not in the options list (i.e., it's a custom value)
                if (!placeholder.options.includes(value)) {
                    newCustomMode[placeholder.id] = true;
                    newCustomInputValues[placeholder.id] = value;
                }
            }
        });

        setCustomMode(newCustomMode);
        setCustomInputValues(newCustomInputValues);
    }, [placeholders, values]);

    if (!isOpen) return null;

    const handleSelectChange = (placeholderId, value) => {
        if (value === '__custom__') {
            // Entering custom mode
            setCustomMode({ ...customMode, [placeholderId]: true });
            // Use existing custom input value if available, otherwise empty
            const customValue = customInputValues[placeholderId] || '';
            setLocalValues({ ...localValues, [placeholderId]: customValue });
        } else {
            // Selected a predefined option
            setCustomMode({ ...customMode, [placeholderId]: false });
            setLocalValues({ ...localValues, [placeholderId]: value });
        }
    };

    const handleCustomInputChange = (placeholderId, value) => {
        setCustomInputValues({ ...customInputValues, [placeholderId]: value });
        setLocalValues({ ...localValues, [placeholderId]: value });
    };

    const handleFreeInputChange = (placeholderId, value) => {
        setLocalValues({ ...localValues, [placeholderId]: value });
    };

    const handleApply = () => {
        onApply(localValues);
        onClose();
    };

    const handleCancel = () => {
        setLocalValues(values); // Reset to original values
        onClose();
    };

    // Generate preview with current values
    const getPreview = () => {
        let preview = promptText || '';
        placeholders.forEach(placeholder => {
            const value = localValues[placeholder.id] || '';
            if (value) {
                preview = preview.replace(placeholder.raw, `**${value}**`);
            } else {
                preview = preview.replace(placeholder.raw, `**[${placeholder.label}]**`);
            }
        });
        return preview;
    };

    return (
        <div className="modal-overlay" onClick={handleCancel}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('modal_title')}</h2>
                    <button className="modal-close-btn" onClick={handleCancel}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="modal-section">
                        <h3>{t('modal_fill_details')}</h3>
                        <p className="section-description">
                            {t('modal_description')}
                        </p>

                        {placeholders.map((placeholder) => (
                            <div key={placeholder.id} className="placeholder-field">
                                <label>{placeholder.label}</label>
                                {placeholder.options ? (
                                    <div className="select-with-custom">
                                        <select
                                            value={customMode[placeholder.id] ? '__custom__' : (localValues[placeholder.id] || '')}
                                            onChange={(e) => handleSelectChange(placeholder.id, e.target.value)}
                                        >
                                            <option value="">{t('modal_select_option')}</option>
                                            {placeholder.options.map((option, idx) => (
                                                <option key={idx} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                            <option value="__custom__">{t('modal_custom_option')}</option>
                                        </select>
                                        {customMode[placeholder.id] && (
                                            <input
                                                type="text"
                                                value={customInputValues[placeholder.id] || ''}
                                                placeholder={t('modal_custom_placeholder')}
                                                onChange={(e) => handleCustomInputChange(placeholder.id, e.target.value)}
                                                autoFocus
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={localValues[placeholder.id] || ''}
                                        onChange={(e) => handleFreeInputChange(placeholder.id, e.target.value)}
                                        placeholder={t('modal_input_placeholder', { label: placeholder.label.toLowerCase() })}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="modal-section preview-section">
                        <h3>{t('modal_preview')}</h3>
                        <div className="preview-content">
                            {getPreview()}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={handleCancel}>
                        {t('modal_cancel')}
                    </button>
                    <button className="btn btn-primary" onClick={handleApply}>
                        <Check size={16} /> {t('modal_apply')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PlaceholderModal;
