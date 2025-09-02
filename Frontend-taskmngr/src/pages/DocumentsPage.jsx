import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../context/useAuth';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext'; // ADD THIS
import { documentApi } from '../api/apiService';
import DocumentCard from '../components/DocumentCard';
import DocumentUploadForm from '../components/DocumentUploadForm';
import './Documents.css';

function DocumentsPage() {
  const { currentUser, accessToken } = useAuth();
  const { showNotification } = useNotification();
  const { t } = useLanguage(); // ADD THIS
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  
  const isAdmin = currentUser?.role === 'admin';
  
  const fetchDocuments = useCallback(async () => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      
      const data = await documentApi.getAll(accessToken, params);
      setDocuments(data);
    } catch (error) {
      showNotification(error.message || t('failed_to_fetch_documents'), 'error');
    } finally {
      setLoading(false);
    }
  }, [accessToken, searchTerm, selectedCategory, showNotification, t]);
  
  const fetchCategories = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      const data = await documentApi.getCategories(accessToken);
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, [accessToken]);
  
  useEffect(() => {
    fetchDocuments();
    fetchCategories();
  }, [fetchDocuments, fetchCategories]);
  
  const handleUploadSuccess = () => {
    setShowUploadForm(false);
    fetchDocuments();
    fetchCategories();
    showNotification(t('document_uploaded_success'), 'success');
  };
  
  const handleDelete = async (documentId, documentTitle) => {
    if (!window.confirm(t('confirm_delete_document', { title: documentTitle }))) return;
    
    try {
      await documentApi.delete(documentId, accessToken);
      showNotification(t('document_deleted_success'), 'success');
      fetchDocuments();
    } catch (error) {
      showNotification(error.message || t('failed_to_delete_document'), 'error');
    }
  };
  
  const handleDownload = async (documentId, filename) => {
    try {
      const blob = await documentApi.download(documentId, accessToken);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showNotification(error.message || t('failed_to_download_document'), 'error');
    }
  };
  
  const filteredDocuments = documents;
  
  return (
    <div className="documents-container">
      <div className="documents-header">
        <div>
          <h1>{t('useful_documents')}</h1>
          <p>{t('access_download_documents')}</p>
        </div>
        {isAdmin && (
          <button 
            className="btn-primary"
            onClick={() => setShowUploadForm(true)}
          >
            <span className="icon">📤</span> {t('upload_document')}
          </button>
        )}
      </div>
      
      <div className="documents-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('search_documents')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-select"
        >
          <option value="all">{t('all_categories')}</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      
      {loading ? (
        <div className="loading-spinner">{t('loading_documents')}</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>{t('no_documents_found')}</h3>
          <p>
            {searchTerm || selectedCategory !== 'all' 
              ? t('try_adjusting_filters')
              : isAdmin 
                ? t('upload_first_document')
                : t('no_documents_uploaded')}
          </p>
        </div>
      ) : (
        <div className="documents-grid">
          {filteredDocuments.map(document => (
            <DocumentCard
              key={document.id}
              document={document}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
      
      {showUploadForm && (
        <DocumentUploadForm
          onClose={() => setShowUploadForm(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}

export default DocumentsPage;