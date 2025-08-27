//src/components/DocumentCard.jsx
import React from 'react';
import { format } from 'date-fns';
import './DocumentCard.css';

const FILE_ICONS = {
    'application/pdf': '📄',
    'application/msword': '📝',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'application/vnd.ms-excel': '📊',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
    'application/vnd.ms-powerpoint': '📽️',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📽️',
    'text/plain': '📃',
    'image/jpeg': '🖼️',
    'image/png': '🖼️',
    'application/zip': '📦',
    'application/x-rar-compressed': '📦',
    'default': '📎'
};

function DocumentCard({ document, isAdmin, onDelete, onDownload }) {
    const getFileIcon = (fileType) => {
        return FILE_ICONS[fileType] || FILE_ICONS.default;
    };
    
    const formatDate = (dateString) => {
        return format(new Date(dateString), 'MMM dd, yyyy');
    };
    
    return (
        <div className="document-card">
            <div className="document-icon">
                {getFileIcon(document.file_type)}
            </div>
            
            <div className="document-content">
                <h3 className="document-title">{document.title}</h3>
                
                {document.description && (
                    <p className="document-description">{document.description}</p>
                )}
                
                <div className="document-meta">
                    {document.category && (
                        <span className="document-category">{document.category}</span>
                    )}
                    <span className="document-size">{document.formatted_size}</span>
                    <span className="document-date">{formatDate(document.upload_date)}</span>
                </div>
                
                <div className="document-stats">
                    <span className="download-count">
                        ⬇️ {document.download_count} downloads
                    </span>
                    <span className="uploaded-by">
                        By {document.uploaded_by.full_name}
                    </span>
                </div>
            </div>
            
            <div className="document-actions">
                <button
                    className="btn-download"
                    onClick={() => onDownload(document.id, document.original_filename)}
                    title="Download document"
                >
                    <span className="icon">⬇️</span> Download
                </button>
                
                {isAdmin && document.can_delete && (
                    <button
                        className="btn-delete"
                        onClick={() => onDelete(document.id, document.title)}
                        title="Delete document"
                    >
                        <span className="icon">🗑️</span>
                    </button>
                )}
            </div>
        </div>
    );
}

export default DocumentCard;