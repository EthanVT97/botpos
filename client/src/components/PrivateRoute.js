import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ children, requiredPermission }) => {
  const { user, loading, canAccess } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required permission
  if (requiredPermission && !canAccess(requiredPermission)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '64px',
          marginBottom: '20px'
        }}>
          🔒
        </div>
        <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>
          Access Denied
        </h1>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '8px' }}>
          You don't have permission to access this page
        </p>
        <p style={{ fontSize: '16px', color: '#999' }}>
          သင့်တွင် ဤစာမျက်နှာကို ဝင်ရောက်ခွင့် မရှိပါ
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;
