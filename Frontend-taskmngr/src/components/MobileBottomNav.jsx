// src/components/MobileBottomNav.jsx - Mobile-first bottom navigation
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
    
    const userRole = currentUser?.role;
    const isAdmin = userRole === "admin";
    const canSeeContacts = ['Pillar', 'Manager', 'Head', 'admin'].includes(userRole);
    const canManageProjects = ['admin', 'Manager', 'Head'].includes(userRole);

    const navItems = [
        {
            to: "/dashboard",
            icon: BarChart3,
            label: t('dashboard'),
            ariaLabel: "Go to Dashboard"
        },
        {
            to: "/tasks",
            icon: ClipboardList,
            label: t('tasks'),
            ariaLabel: "Go to Tasks"
        },
        {
            to: "/companies",
            icon: Building2,
            label: t('companies'),
            ariaLabel: "Go to Companies"
        },
        ...(canManageProjects ? [{
            to: "/projects",
            icon: Briefcase,
            label: t('projects'),
            ariaLabel: "Go to Projects"
        }] : []),
        {
            to: "/profile",
            icon: User,
            label: t('profile'),
            ariaLabel: "Go to Profile"
        }
    ];

    // Add admin-only items if user is admin
    if (isAdmin) {
        navItems.splice(-1, 0, {
            to: "/users",
            icon: UserCog,
            label: t('users'),
            ariaLabel: "Go to Users"
        });
    }

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
