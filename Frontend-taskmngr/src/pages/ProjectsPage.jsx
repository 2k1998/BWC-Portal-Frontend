import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext'; // ADD THIS IMPORT
import { projectApi, companyApi, authApi } from '../api/apiService';
import ProjectCard from '../components/ProjectCard';
import ProjectForm from '../components/ProjectForm';
import { ClipboardList } from 'lucide-react';
import './Projects.css';

function ProjectsPage() {
  const { currentUser, accessToken } = useAuth();
  const { showNotification } = useNotification();
  const { t } = useLanguage(); // ADD THIS

  const [projects, setProjects] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const canManageProjects = ['admin', 'Manager', 'Head'].includes(currentUser?.role);

  // Use translated project types and statuses
  const PROJECT_TYPES = {
    new_store: t('project_type_new_store'),
    renovation: t('project_type_renovation'),
    maintenance: t('project_type_maintenance'),
    expansion: t('project_type_expansion'),
    other: t('project_type_other')
  };

  const PROJECT_STATUSES = {
    planning: t('status_planning'),
    in_progress: t('status_in_progress'),
    completed: t('status_completed'),
    on_hold: t('status_on_hold'),
    cancelled: t('status_cancelled')
  };

  const fetchProjects = useCallback(async () => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const params = {
        skip: 0,
        limit: 100,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      if (statusFilter !== 'all') params.status_filter = statusFilter;
      if (typeFilter !== 'all') params.project_type_filter = typeFilter;
      if (companyFilter !== 'all') params.company_id = companyFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const [projectsData, statsData] = await Promise.all([
        projectApi.getAll(accessToken, params),
        projectApi.getStats(accessToken)
      ]);

      setProjects(projectsData);
      setStats(statsData);
    } catch (error) {
      showNotification(error.message || t('failed_to_fetch_projects'), 'error');
    } finally {
      setLoading(false);
    }
  }, [accessToken, statusFilter, typeFilter, companyFilter, searchTerm, sortBy, sortOrder, showNotification, t]);

  const fetchCompaniesAndUsers = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      const [companiesData, usersData] = await Promise.all([
        companyApi.getAll(accessToken),
        authApi.listAllUsers(accessToken)
      ]);
      
      setCompanies(companiesData);
      setUsers(usersData);
    } catch (error) {
      showNotification(error.message || t('failed_to_fetch_companies_users'), 'error');
    }
  }, [accessToken, showNotification, t]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchCompaniesAndUsers();
  }, [fetchCompaniesAndUsers]);

  const handleCreateProject = async (projectData) => {
    try {
      await projectApi.create(projectData, accessToken);
      showNotification(t('project_created_success'), 'success');
      setShowCreateForm(false);
      fetchProjects();
    } catch (error) {
      showNotification(error.message || t('failed_to_create_project'), 'error');
    }
  };

  const handleUpdateProject = async (projectData) => {
    try {
      await projectApi.update(editingProject.id, projectData, accessToken);
      showNotification(t('project_updated_success'), 'success');
      setEditingProject(null);
      fetchProjects();
    } catch (error) {
      showNotification(error.message || t('failed_to_update_project'), 'error');
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (!window.confirm(t('confirm_delete_project', { name: projectName }))) return;
    
    try {
      await projectApi.delete(projectId, accessToken);
      showNotification(t('project_deleted_success'), 'success');
      fetchProjects();
    } catch (error) {
      showNotification(error.message || t('failed_to_delete_project'), 'error');
    }
  };

  const handleStatusUpdate = async (projectId, statusData) => {
    try {
      await projectApi.updateStatus(projectId, statusData, accessToken);
      showNotification(t('project_status_updated_success'), 'success');
      fetchProjects();
    } catch (error) {
      showNotification(error.message || t('failed_to_update_project_status'), 'error');
    }
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setCompanyFilter('all');
    setSearchTerm('');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  if (loading && projects.length === 0) {
    return <div className="loading-spinner">{t('loading_projects')}</div>;
  }

  return (
    <div className="projects-container">
      {/* Header */}
      <div className="projects-header">
        <div className="header-left">
          <h1>{t('projects')}</h1>
          {stats && (
            <div className="projects-stats">
              <div className="stat-item">
                <span className="stat-number">{stats.total_projects}</span>
                <span className="stat-label">{t('total')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.active_projects}</span>
                <span className="stat-label">{t('active')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.completion_rate}%</span>
                <span className="stat-label">{t('completed')}</span>
              </div>
            </div>
          )}
        </div>
        
        {canManageProjects && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            <span className="btn-icon">+</span>
            {t('new_project')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="projects-filters">
        <div className="filters-row">
          <div className="filter-group">
            <input
              type="text"
              placeholder={t('search_projects')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('all_statuses')}</option>
              {Object.entries(PROJECT_STATUSES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('all_types')}</option>
              {Object.entries(PROJECT_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select 
              value={companyFilter} 
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('all_companies')}</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select 
              value={`${sortBy}-${sortOrder}`} 
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="filter-select"
            >
              <option value="created_at-desc">{t('newest_first')}</option>
              <option value="created_at-asc">{t('oldest_first')}</option>
              <option value="name-asc">{t('name_a_z')}</option>
              <option value="name-desc">{t('name_z_a')}</option>
              <option value="expected_completion_date-asc">{t('due_date')}</option>
              <option value="progress_percentage-desc">{t('progress')}</option>
            </select>
          </div>

          <button onClick={resetFilters} className="btn btn-outline">
            {t('clear_filters')}
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="projects-content">
        {projects.length === 0 ? (
          <div className="empty-state">
            <ClipboardList className="empty-icon" size={48} />
            <h3>{t('no_projects_found')}</h3>
            <p>
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || companyFilter !== 'all'
                ? t('try_adjusting_filters')
                : canManageProjects 
                  ? t('get_started_create_project')
                  : t('no_projects_created_yet')
              }
            </p>
            {canManageProjects && (
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                {t('create_first_project')}
              </button>
            )}
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                companies={companies}
                users={users}
                canManage={canManageProjects}
                onEdit={(project) => setEditingProject(project)}
                onDelete={handleDeleteProject}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingProject) && (
        <ProjectForm
          project={editingProject}
          companies={companies}
          users={users}
          onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
}

export default ProjectsPage;