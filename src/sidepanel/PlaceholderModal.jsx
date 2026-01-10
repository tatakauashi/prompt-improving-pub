import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import './PlaceholderModal.css';

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

    if (!isOpen) return null;

    const handleChange = (placeholderId, value) => {
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
                    <h2>Edit Prompt Details</h2>
                    <button className="modal-close-btn" onClick={handleCancel}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="modal-section">
                        <h3>Fill in the details</h3>
                        <p className="section-description">
                            Complete the following fields to customize your prompt:
                        </p>

                        {placeholders.map((placeholder) => (
                            <div key={placeholder.id} className="placeholder-field">
                                <label>{placeholder.label}</label>
                                {placeholder.options ? (
                                    <div className="select-with-custom">
                                        <select
                                            value={localValues[placeholder.id] || ''}
                                            onChange={(e) => handleChange(placeholder.id, e.target.value)}
                                        >
                                            <option value="">-- Select --</option>
                                            {placeholder.options.map((option, idx) => (
                                                <option key={idx} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                            <option value="__custom__">Custom...</option>
                                        </select>
                                        {localValues[placeholder.id] === '__custom__' && (
                                            <input
                                                type="text"
                                                placeholder="Enter custom value..."
                                                onChange={(e) => handleChange(placeholder.id, e.target.value)}
                                                autoFocus
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={localValues[placeholder.id] || ''}
                                        onChange={(e) => handleChange(placeholder.id, e.target.value)}
                                        placeholder={`Enter ${placeholder.label.toLowerCase()}...`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="modal-section preview-section">
                        <h3>Preview</h3>
                        <div className="preview-content">
                            {getPreview()}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleApply}>
                        <Check size={16} /> Apply
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PlaceholderModal;
