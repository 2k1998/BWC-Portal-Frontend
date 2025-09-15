// src/components/ProjectForm.jsx
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { useLanguage } from '../context/LanguageContext';
import LoadingSpinner from './LoadingSpinner';
import { 
    ClipboardList, 
    DollarSign, 
    MapPin, 
    Calendar, 
    FileText, 
    X,
    BarChart3,
    CreditCard
} from 'lucide-react';
import './Modal.css';
import './ProjectForm.css';

const getProjectTypes = (t) => ({
  new_store: t('project_type_new_store'),
  renovation: t('project_type_renovation'),
  maintenance: t('project_type_maintenance'),
  expansion: t('project_type_expansion'),
  other: t('project_type_other')
});

const getProjectStatuses = (t) => ({
  planning: t('status_planning'),
  in_progress: t('status_in_progress'),
  completed: t('status_completed'),
  on_hold: t('status_on_hold'),
  cancelled: t('status_cancelled')
});

const getProjectPriorities = (t) => ({
  low: t('priority_low'),
  medium: t('priority_medium'),
  high: t('priority_high'),
  urgent: t('priority_urgent')
});

function ProjectForm({ project, companies, users, onSubmit, onCancel }) {
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_type: 'new_store',
    priority: 'medium',
    status: 'planning',
    store_location: '',
    store_address: '',
    company_id: '',
    project_manager_id: '',
    start_date: null,
    expected_completion_date: null,
    actual_completion_date: null,
    estimated_budget: '',
    actual_cost: '',
    progress_percentage: 0,
    notes: '',
    last_update: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const isEditing = !!project;

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        project_type: project.project_type || 'new_store',
        priority: project.priority || 'medium',
        status: project.status || 'planning',
        store_location: project.store_location || '',
        store_address: project.store_address || '',
        company_id: project.company?.id || '',
        project_manager_id: project.project_manager?.id || '',
        start_date: project.start_date ? new Date(project.start_date) : null,
        expected_completion_date: project.expected_completion_date ? new Date(project.expected_completion_date) : null,
        actual_completion_date: project.actual_completion_date ? new Date(project.actual_completion_date) : null,
        estimated_budget: project.estimated_budget || '',
        actual_cost: project.actual_cost || '',
        progress_percentage: project.progress_percentage || 0,
        notes: project.notes || '',
        last_update: project.last_update || ''
      });
    }
  }, [project]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let processedValue = value;

    if (type === 'number') {
      processedValue = value === '' ? '' : parseFloat(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleDateChange = (date, fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: date
    }));

    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Project name is required';
      }
      if (!formData.company_id) {
        newErrors.company_id = 'Company is required';
      }
      if (!formData.project_type) {
        newErrors.project_type = 'Project type is required';
      }
      if (!formData.estimated_budget || formData.estimated_budget <= 0) {
        newErrors.estimated_budget = 'Estimated budget is required and must be greater than 0';
      }
    } else if (step === 2) {
      if (formData.progress_percentage < 0 || formData.progress_percentage > 100) {
        newErrors.progress_percentage = 'Progress must be between 0 and 100';
      }
      if (formData.actual_cost && formData.actual_cost < 0) {
        newErrors.actual_cost = 'Cost cannot be negative';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    return validateStep(1) && validateStep(2);
  };

  const nextStep = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Next button clicked, current step:', currentStep);
    if (validateStep(currentStep)) {
      console.log('Validation passed, moving to next step');
      setCurrentStep(prev => Math.min(prev + 1, 2));
    } else {
      console.log('Validation failed');
    }
  };

  const prevStep = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted, current step:', currentStep);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        start_date: formData.start_date ? formData.start_date.toISOString().split('T')[0] : null,
        expected_completion_date: formData.expected_completion_date ? formData.expected_completion_date.toISOString().split('T')[0] : null,
        actual_completion_date: formData.actual_completion_date ? formData.actual_completion_date.toISOString().split('T')[0] : null,
        company_id: parseInt(formData.company_id),
        project_manager_id: formData.project_manager_id ? parseInt(formData.project_manager_id) : null,
        progress_percentage: parseInt(formData.progress_percentage),
      };

      // Remove empty strings and null values for optional fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null) {
          if (!['project_manager_id', 'start_date', 'expected_completion_date', 'actual_completion_date'].includes(key)) {
            delete submitData[key];
          }
        }
      });

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <h3 className="modal-title">
            {isEditing ? t('edit_project') : t('create_new_project')}
          </h3>
          <button 
            className="modal-close" 
            onClick={onCancel}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="project-form">
          <div className="modal-body">
            {/* Step Progress Indicator */}
            <div className="step-progress">
              <div className="step-indicator">
                <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                  <span className="step-number">1</span>
                  <span className="step-label">{t('basic_info')}</span>
                </div>
                <div className="step-line"></div>
                <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                  <span className="step-number">2</span>
                  <span className="step-label">{t('details')}</span>
                </div>
              </div>
            </div>

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <>
                <div className="form-section">
                  <h4 className="section-title">
                    <ClipboardList className="section-icon" size={20} />
                    {t('project_details')}
                  </h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name" className="form-label">
                        {t('project_name_required')} <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`form-control ${errors.name ? 'error' : ''}`}
                        placeholder={t('enter_project_name')}
                        required
                      />
                      {errors.name && <span className="error-text">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="project_type" className="form-label">
                        {t('project_type_required')} <span className="required">*</span>
                      </label>
                      <select
                        id="project_type"
                        name="project_type"
                        value={formData.project_type}
                        onChange={handleChange}
                        className={`form-control ${errors.project_type ? 'error' : ''}`}
                        required
                      >
                        {Object.entries(getProjectTypes(t)).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                      {errors.project_type && <span className="error-text">{errors.project_type}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="company_id" className="form-label">
                        {t('company_required')} <span className="required">*</span>
                      </label>
                      <select
                        id="company_id"
                        name="company_id"
                        value={formData.company_id}
                        onChange={handleChange}
                        className={`form-control ${errors.company_id ? 'error' : ''}`}
                        required
                      >
                        <option value="">{t('select_company')}</option>
                        {companies.map(company => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                      {errors.company_id && <span className="error-text">{errors.company_id}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="priority" className="form-label">{t('priority')}</label>
                      <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="form-control"
                      >
                        {Object.entries(getProjectPriorities(t)).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description" className="form-label">{t('description')}</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="form-control"
                      placeholder={t('brief_description_goals')}
                      rows="3"
                    />
                  </div>
                </div>

                <div className="form-section budget-section">
                  <h4 className="section-title">
                    <DollarSign className="section-icon" size={20} />
                    {t('budget_information')}
                  </h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="estimated_budget" className="form-label">
                        {t('estimated_budget_required')} <span className="required">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">€</span>
                        <input
                          type="number"
                          id="estimated_budget"
                          name="estimated_budget"
                          value={formData.estimated_budget}
                          onChange={handleChange}
                          className={`form-control ${errors.estimated_budget ? 'error' : ''}`}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                      {errors.estimated_budget && <span className="error-text">{errors.estimated_budget}</span>}
                      <small className="form-help">{t('enter_total_estimated_cost')}</small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="project_manager_id" className="form-label">{t('project_manager')}</label>
                      <select
                        id="project_manager_id"
                        name="project_manager_id"
                        value={formData.project_manager_id}
                        onChange={handleChange}
                        className="form-control"
                      >
                        <option value="">{t('select_project_manager')}</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Additional Details */}
            {currentStep === 2 && (
              <>
                <div className="form-section">
                  <h4 className="section-title">
                    <MapPin className="section-icon" size={20} />
                    {t('location_details')}
                  </h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="store_location" className="form-label">{t('location_name')}</label>
                      <input
                        type="text"
                        id="store_location"
                        name="store_location"
                        value={formData.store_location}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t('location_example')}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="store_address" className="form-label">{t('full_address')}</label>
                      <textarea
                        id="store_address"
                        name="store_address"
                        value={formData.store_address}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t('complete_address_placeholder')}
                        rows="2"
                      />
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="form-section">
                  <h4 className="section-title">
                    <Calendar className="section-icon" size={20} />
                    {t('timeline')}
                  </h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="start_date" className="form-label">{t('start_date')}</label>
                      <DatePicker
                        selected={formData.start_date}
                        onChange={(date) => handleDateChange(date, 'start_date')}
                        className="form-control"
                        placeholderText={t('select_start_date')}
                        dateFormat="yyyy-MM-dd"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="expected_completion_date" className="form-label">{t('expected_completion')}</label>
                      <DatePicker
                        selected={formData.expected_completion_date}
                        onChange={(date) => handleDateChange(date, 'expected_completion_date')}
                        className="form-control"
                        placeholderText={t('select_completion_date')}
                        dateFormat="yyyy-MM-dd"
                        minDate={formData.start_date}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="form-section">
                  <h4 className="section-title">
                    <FileText className="section-icon" size={20} />
                    {t('additional_notes')}
                  </h4>
                  
                  <div className="form-group">
                    <label htmlFor="notes" className="form-label">{t('project_notes')}</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className="form-control"
                      placeholder={t('project_notes_placeholder')}
                      rows="4"
                    />
                    <small className="form-help">{t('additional_information_help')}</small>
                  </div>
                </div>

                {/* Advanced Fields for Editing */}
                {isEditing && (
                  <>
                    <div className="form-section">
                      <h4 className="section-title">
                        <BarChart3 className="section-icon" size={20} />
                        {t('status')} & {t('progress_percentage')}
                      </h4>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="status" className="form-label">{t('status')}</label>
                          <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="form-control"
                          >
                            {Object.entries(getProjectStatuses(t)).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="progress_percentage" className="form-label">{t('progress_percentage')}</label>
                          <input
                            type="number"
                            id="progress_percentage"
                            name="progress_percentage"
                            value={formData.progress_percentage}
                            onChange={handleChange}
                            className={`form-control ${errors.progress_percentage ? 'error' : ''}`}
                            min="0"
                            max="100"
                          />
                          {errors.progress_percentage && <span className="error-text">{errors.progress_percentage}</span>}
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="last_update" className="form-label">{t('latest_update')}</label>
                        <textarea
                          id="last_update"
                          name="last_update"
                          value={formData.last_update}
                          onChange={handleChange}
                          className="form-control"
                          placeholder={t('status_update_placeholder')}
                          rows="2"
                        />
                      </div>
                    </div>

                    <div className="form-section">
                      <h4 className="section-title">
                        <CreditCard className="section-icon" size={20} />
                        {t('actual_cost_tracking')}
                      </h4>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="actual_cost" className="form-label">{t('actual_cost')} (€)</label>
                          <div className="input-group">
                            <span className="input-group-text">€</span>
                            <input
                              type="number"
                              id="actual_cost"
                              name="actual_cost"
                              value={formData.actual_cost}
                              onChange={handleChange}
                              className={`form-control ${errors.actual_cost ? 'error' : ''}`}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                            />
                          </div>
                          {errors.actual_cost && <span className="error-text">{errors.actual_cost}</span>}
                          <small className="form-help">{t('enter_actual_cost')}</small>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <div className="footer-left">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={onCancel}
                disabled={loading}
              >
                {t('cancel')}
              </button>
            </div>
            
            <div className="footer-center">
              {!isEditing && currentStep > 1 && (
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={prevStep}
                  disabled={loading}
                >
                  ← {t('previous')}
                </button>
              )}
            </div>
            
            <div className="footer-right">
              {!isEditing && currentStep < 2 ? (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={nextStep}
                  disabled={loading}
                >
                  {t('next')} →
                </button>
              ) : (
            <button 
              type="submit" 
              className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
            >
              {loading ? t('saving') : (isEditing ? t('update_project_btn') : t('create_project_btn'))}
            </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectForm;