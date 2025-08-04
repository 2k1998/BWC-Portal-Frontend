import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '20px',
                    margin: '20px',
                    background: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '8px',
                    fontFamily: 'Arial, sans-serif'
                }}>
                    <h2 style={{ color: '#c33', marginBottom: '10px' }}>
                        🚨 Something went wrong
                    </h2>
                    <p style={{ marginBottom: '15px' }}>
                        The application encountered an error and couldn't recover. 
                        Please refresh the page or contact support if the problem persists.
                    </p>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <button 
                            onClick={() => window.location.reload()}
                            style={{
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                padding: '10px 15px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginRight: '10px'
                            }}
                        >
                            🔄 Refresh Page
                        </button>
                        
                        <button 
                            onClick={() => {
                                localStorage.clear();
                                window.location.href = '/login';
                            }}
                            style={{
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                padding: '10px 15px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            🏠 Reset & Go to Login
                        </button>
                    </div>

                    {process.env.NODE_ENV === 'development' && (
                        <details style={{ 
                            background: '#f8f9fa', 
                            padding: '10px', 
                            borderRadius: '4px',
                            fontSize: '12px'
                        }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                                Show Error Details (Development Mode)
                            </summary>
                            <pre style={{ 
                                marginTop: '10px', 
                                overflow: 'auto', 
                                maxHeight: '200px',
                                color: '#721c24'
                            }}>
                                {this.state.error && this.state.error.toString()}
                                {this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
