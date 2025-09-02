// 3. src/components/DocumentUploadForm.jsx
import React, { useState } from 'react';
import useAuth from '../context/useAuth';
import { useNotification } from '../context/NotificationContext';
import { documentApi } from '../api/apiService';
import './Modal.css';

const ALLOWED_EXTENSIONS = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.ppt', '.pptx', '.txt', '.jpg', '.jpeg',
    '.png', '.zip', '.rar'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function DocumentUploadForm({ onClose, onSuccess }) {
    const { accessToken } = useAuth();
    const { showNotification } = useNotification();
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        is_public: true,
        file: null
    });
    
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };
    
    const handleFileSelect = (file) => {
        if (!file) return;
        
        // Validate file extension
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
            showNotification(
                `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
                'error'
            );
            return;
        }
        
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            showNotification(
                `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
                'error'
            );
            return;
        }
        
        setFormData(prev => ({ ...prev, file }));
    };
    
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };
    
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.file) {
            showNotification('Please select a file to upload', 'error');
            return;
        }
        
        if (!formData.title.trim()) {
            showNotification('Please enter a document title', 'error');
            return;
        }
        
        setUploading(true);
        
        try {
            const uploadData = new FormData();
            uploadData.append('file', formData.file);
            uploadData.append('title', formData.title);
            uploadData.append('description', formData.description || '');
            uploadData.append('category', formData.category || '');
            uploadData.append('is_public', formData.is_public);
            
            await documentApi.upload(uploadData, accessToken);
            onSuccess();
        } catch (error) {
            showNotification(error.message || 'Failed to upload document', 'error');
        } finally {
            setUploading(false);
        }
    };
    
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Upload Document</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Document Title *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="Enter document title"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Optional description"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="category">Category</label>
                        <input
                            type="text"
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            placeholder="e.g., Policies, Forms, Guides"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="is_public"
                                checked={formData.is_public}
                                onChange={handleChange}
                            />
                            Make this document public (visible to all users)
                        </label>
                    </div>
                    
                    <div className="form-group">
                        <label>File *</label>
                        <div
                            className={`file-drop-zone ${dragActive ? 'drag-active' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                id="file"
                                onChange={(e) => handleFileSelect(e.target.files[0])}
                                accept={ALLOWED_EXTENSIONS.join(',')}
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="file" className="file-drop-label">
                                {formData.file ? (
                                    <div>
                                        <span className="file-icon">📎</span>
                                        <p>{formData.file.name}</p>
                                        <p className="file-size">
                                            {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <span className="upload-icon">📤</span>
                                        <p>Drag and drop a file here or click to browse</p>
                                        <p className="file-hint">
                                            Max size: 50MB | Allowed: PDF, DOC, XLS, PPT, TXT, Images, ZIP
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>
                    
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Upload Document'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DocumentUploadForm;