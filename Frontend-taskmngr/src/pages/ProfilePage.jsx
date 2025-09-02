// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import useAuth from '../context/useAuth';
import { authApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import './Profile.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
function ProfilePage() {
    const { currentUser, accessToken, refreshCurrentUser } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useLanguage();

    const [firstName, setFirstName] = useState('');
    const [surname, setSurname] = useState('');
    const [birthday, setBirthday] = useState('');
    const [loadingUpdate, setLoadingUpdate] = useState(false);

    // State for file upload
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (currentUser) {
            setFirstName(currentUser.first_name || '');
            setSurname(currentUser.surname || '');
            setBirthday(currentUser.birthday ? new Date(currentUser.birthday).toISOString().split('T')[0] : '');
            setPreview(currentUser.profile_picture_url ? `${API_BASE_URL}${currentUser.profile_picture_url}` : null);
        }
    }, [currentUser]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handlePictureUpload = async () => {
        if (!selectedFile) {
            showNotification('Please select a file first.', 'warning');
            return;
        }
        setLoadingUpdate(true);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            await authApi.uploadProfilePicture(formData, accessToken);
            await refreshCurrentUser();
            showNotification('Profile picture updated successfully!', 'success');
            setSelectedFile(null);
        } catch (err) {
            showNotification(err.message || 'Failed to upload picture.', 'error');
        } finally {
            setLoadingUpdate(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- THIS IS THE FIX ---
        // Create a new object that only contains the fields the backend
        // schema (UserUpdate) expects: first_name, surname, and birthday.
        const updateData = {
            first_name: firstName,
            surname: surname,
            birthday: birthday || null // Send null if the date is cleared
        };
        // --- END OF FIX ---

        setLoadingUpdate(true);
        try {
            // Send ONLY the allowed data to the backend
            await authApi.updateUserMe(updateData, accessToken);
            await refreshCurrentUser(); // Refresh user data in the context
            showNotification(t('profile_updated_successfully') || 'Profile updated!', 'success');
        } catch (error) {
            showNotification(error.message || 'Failed to update profile.', 'error');
        } finally {
            setLoadingUpdate(false);
        }
    };

    return (
        <div className="profile-container">
            <h1>{t('my_profile')}</h1>

            <div className="profile-photo-section">
                <img
                    src={
                        preview ||
                        `https://ui-avatars.com/api/?name=${currentUser?.first_name || 'A'}+${currentUser?.surname || 'B'}&background=b8860b&color=fff&size=120`
                    }
                    alt="Avatar"
                    className="profile-avatar"
                />
                <input
                    type="file"
                    id="file-upload"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/gif"
                />
                <div className="profile-photo-buttons">
                    <label htmlFor="file-upload" className="custom-file-upload-button">
                        Change Picture
                    </label>
                    {selectedFile && (
                        <button onClick={handlePictureUpload} className="upload-button" disabled={loadingUpdate}>
                            {loadingUpdate ? 'Uploading...' : 'Upload'}
                        </button>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                    <label htmlFor="email">{t('email')}:</label>
                    <input type="email" id="email" value={currentUser?.email || ''} disabled />
                </div>
                <div className="form-group">
                    <label htmlFor="firstName">{t('first_name')}:</label>
                    <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="surname">{t('surname')}:</label>
                    <input type="text" id="surname" value={surname} onChange={(e) => setSurname(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="birthday">{t('birthday')}:</label>
                    <input type="date" id="birthday" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                </div>
                <button type="submit" disabled={loadingUpdate}>
                    {loadingUpdate ? t('updating') : t('update_profile')}
                </button>
            </form>
        </div>
    );
}

export default ProfilePage;