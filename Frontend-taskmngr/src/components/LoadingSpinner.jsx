import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  text = 'Loading...', 
  overlay = false, 
  className = '',
  ariaLabel = 'Loading content',
  showProgress = false,
  progress = 0
}) => {
  const sizeClass = `spinner-${size}`;
  const overlayClass = overlay ? 'spinner-overlay' : '';
  
  return (
    <div 
      className={`loading-spinner ${sizeClass} ${overlayClass} ${className}`}
      role="status" 
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <div className="spinner" aria-hidden="true">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {text && (
        <span className="spinner-text" id="loading-text">
          {text}
        </span>
      )}
      {showProgress && (
        <div className="spinner-progress" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          <span className="progress-text">{progress}%</span>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
