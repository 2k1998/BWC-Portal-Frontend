// frontend/Frontend-taskmngr/src/components/TaskFilterMenu.jsx
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { companyApi, authApi } from '../api/apiService';

const TaskFilterMenu = ({ token, value = {}, onChange }) => {
  const { t } = useLanguage();
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);

  // Load dropdown data once
  useEffect(() => {
    (async () => {
      try {
        const cs = await (companyApi.getAll?.(token) || companyApi.list?.(token));
        setCompanies(Array.isArray(cs) ? cs : (cs?.results || cs?.items || cs?.data || []));
      } catch {}
      try {
        const us = await (authApi.listBasicUsers?.(token) || authApi.getAll?.(token));
        setUsers(Array.isArray(us) ? us : (us?.results || us?.items || us?.data || []));
      } catch {}
    })();
  }, [token]);

  // helper to update a single key without causing loops
  const update = (patch) => {
    const next = {
      importance: value.importance || undefined,
      company_id: value.company_id || undefined,
      user_id: value.user_id || undefined,
      user_name: value.user_name || undefined,
      ...patch,
    };
    // normalize blanks → undefined
    if (!next.importance) delete next.importance;
    if (!next.company_id) delete next.company_id;
    if (!next.user_id) delete next.user_id;
    if (!next.user_name) delete next.user_name;

    // only emit if changed (shallow compare)
    const same =
      (value.importance || undefined) === next.importance &&
      (value.company_id || undefined) === next.company_id &&
      (value.user_id || undefined) === next.user_id &&
      (value.user_name || undefined) === next.user_name;

    if (!same) onChange?.(next);
  };

  return (
    <div className="filter-menu card p-3 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        {/* Importance */}
        <div className="form-group">
          <label className="block text-xs font-semibold uppercase">{t('importance') || 'Importance'}</label>
          <select
            value={value.importance || ''}
            onChange={(e) => update({ importance: e.target.value || undefined })}
          >
            <option value="">{t('all') || 'All'}</option>
            <option value="urgent">{t('urgent') || 'Urgent'}</option>
            <option value="important">{t('important') || 'Important'}</option>
            <option value="urgent_important">{t('urgent_important') || 'Urgent & Important'}</option>
            <option value="none">{t('none') || 'Not urgent & not important'}</option>
          </select>
        </div>

        {/* Company */}
        <div className="form-group">
          <label className="block text-xs font-semibold uppercase">{t('company') || 'Company'}</label>
          <select
            value={value.company_id || ''}
            onChange={(e) => update({ company_id: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">{t('all') || 'All'}</option>
            {companies.map((c) => (
              <option key={c.id ?? c.company_id} value={c.id ?? c.company_id}>
                {c.name ?? c.company_name}
              </option>
            ))}
          </select>
        </div>

        {/* User (dropdown) */}
        <div className="form-group">
          <label className="block text-xs font-semibold uppercase">{t('user') || 'User'}</label>
          <select
            value={value.user_id || ''}
            onChange={(e) => update({ user_id: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">{t('all') || 'All'}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username || `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()}
              </option>
            ))}
          </select>
        </div>

        {/* Free-text name contains */}
        <div className="form-group">
          <label className="block text-xs font-semibold uppercase">{t('user_name_contains') || 'User name contains'}</label>
          <input
            type="text"
            value={value.user_name || ''}
            placeholder={t('type_to_filter') || 'Type to filter'}
            onChange={(e) => update({ user_name: e.target.value || undefined })}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskFilterMenu;
