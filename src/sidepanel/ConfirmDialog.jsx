import React from 'react';
import './ConfirmDialog.css';
import useTranslation from '../hooks/useTranslation';

/**
 * ConfirmDialog - A custom styled confirmation dialog
 * @param {boolean} isOpen - Whether the dialog is visible
 * @param {string} title - Dialog title
 * @param {string} message - Confirmation message
 * @param {function} onConfirm - Callback when user confirms
 * @param {function} onCancel - Callback when user cancels
 */
function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className="confirm-dialog-overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <h3 className="confirm-dialog-title">{title}</h3>
                <p className="confirm-dialog-message">{message}</p>
                <div className="confirm-dialog-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        {t('confirm_delete_file_cancel')}
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        {t('confirm_delete_file_confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;
