import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px'
            }}>
              ⚠️
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1a1a1a',
              marginBottom: '12px'
            }}>
              Something went wrong
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#666',
              marginBottom: '24px'
            }}>
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <p style={{
              fontSize: '14px',
              color: '#999',
              marginBottom: '24px'
            }}>
              တစ်ခုခု မှားယွင်းနေပါသည်။ စာမျက်နှာကို ပြန်လည်စတင်ကြည့်ပါ။
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '14px',
                color: '#dc2626'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '8px' }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: '12px',
                  marginTop: '8px'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '24px',
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
