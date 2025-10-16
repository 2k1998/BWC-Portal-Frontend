// src/components/MobileBottomNav.jsx - Mobile-first bottom navigation
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { hasPermission } from '../utils/permissions';
import { 
    BarChart3, 
    ClipboardList, 
    Building2, 
    Briefcase, 
    User, 
    UserCog 
} from 'lucide-react';
import './MobileBottomNav.css';

function MobileBottomNav() {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    
    // Use permission checking instead of hardcoded role checks
    const canSeeDashboard = hasPermission(currentUser, 'dashboard');
    const canSeeTasks = hasPermission(currentUser, 'tasks');
    const canSeeCompanies = hasPermission(currentUser, 'companies');
    const canSeeProjects = hasPermission(currentUser, 'projects');
    const canSeeUsers = hasPermission(currentUser, 'users');

    // Build navigation items based on permissions
    const navItems = [];
    
    if (canSeeDashboard) {
        navItems.push({
            to: "/dashboard",
            icon: BarChart3,
            label: t('dashboard'),
            ariaLabel: "Go to Dashboard"
        });
    }
    
    if (canSeeTasks) {
        navItems.push({
            to: "/tasks",
            icon: ClipboardList,
            label: t('tasks'),
            ariaLabel: "Go to Tasks"
        });
    }
    
    if (canSeeCompanies) {
        navItems.push({
            to: "/companies",
            icon: Building2,
            label: t('companies'),
            ariaLabel: "Go to Companies"
        });
    }
    
    if (canSeeProjects) {
        navItems.push({
            to: "/projects",
            icon: Briefcase,
            label: t('projects'),
            ariaLabel: "Go to Projects"
        });
    }
    
    if (canSeeUsers) {
        navItems.push({
            to: "/users",
            icon: UserCog,
            label: t('users'),
            ariaLabel: "Go to Users"
        });
    }
    
    // Profile is always visible (added last)
    navItems.push({
        to: "/profile",
        icon: User,
        label: t('profile'),
        ariaLabel: "Go to Profile"
    });

    return (
        <nav 
            className="mobile-bottom-nav" 
            role="navigation" 
            aria-label="Mobile navigation"
        >
            <div className="nav-items">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        aria-label={item.ariaLabel}
                    >
                        <item.icon className="nav-icon" aria-hidden="true" size={20} />
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}

export default MobileBottomNav;
