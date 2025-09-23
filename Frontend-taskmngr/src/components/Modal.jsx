// src/components/Modal.jsx
import React from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, message, onConfirm, showConfirmButton = true, confirmText = "Yes", cancelText = "No" }) => {
    if (!isOpen) return null;

    const safeTitle = typeof title === 'string' ? title : '';
    const safeMessage = typeof message === 'string' ? message : '';

    return (
        <div className="app-modal-overlay">
            <div className="app-modal-content" role="dialog" aria-modal="true">
                <div className="modal-header">
                    <h3 className="modal-title">{safeTitle}</h3>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <p>{safeMessage}</p>
                </div>
                <div className="modal-footer">
                    <button
                        className="modal-confirm-button"
                        onClick={onConfirm}
                        aria-hidden={!showConfirmButton}
                        style={!showConfirmButton ? { display: 'none' } : undefined}
                    >
                        {confirmText}
                    </button>
                    <button className="modal-cancel-button" onClick={onClose}>
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;