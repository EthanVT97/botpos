import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ArrowLeft, AlertCircle } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(10);
  const [autoRedirect, setAutoRedirect] = useState(true);

  useEffect(() => {
    if (!autoRedirect) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, autoRedirect]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{
        fontSize: '120px',
        fontWeight: 'bold',
        color: '#6366f1',
        marginBottom: '20px',
        lineHeight: '1'
      }}>
        404
      </div>
      
      <h1 style={{
        fontSize: '32px',
        fontWeight: '600',
        marginBottom: '10px',
        color: '#1f2937'
      }}>
        Page Not Found
      </h1>
      
      <h2 style={{
        fontSize: '24px',
        fontWeight: '400',
        marginBottom: '20px',
        color: '#6b7280'
      }}>
        စာမျက်နှာ မတွေ့ပါ
      </h2>
      
      <p style={{
        fontSize: '16px',
        color: '#6b7280',
        marginBottom: '30px',
        maxWidth: '500px'
      }}>
        The page you're looking for doesn't exist or has been moved.
        <br />
        သင်ရှာနေသော စာမျက်နှာမရှိပါ သို့မဟုတ် ရွှေ့ထားပါသည်။
      </p>

      <div style={{
        padding: '15px 25px',
        backgroundColor: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
        color: '#92400e',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        maxWidth: '500px'
      }}>
        <AlertCircle size={20} color="#f59e0b" />
        <div>
          <strong>Path not found:</strong> {location.pathname}
        </div>
      </div>

      {autoRedirect && (
        <div style={{
          padding: '15px 25px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Redirecting to home in <strong style={{ color: '#6366f1', fontSize: '18px' }}>{countdown}</strong> seconds...
          <button
            onClick={() => setAutoRedirect(false)}
            style={{
              marginLeft: '15px',
              padding: '4px 12px',
              fontSize: '12px',
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/')}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            fontSize: '16px'
          }}
        >
          <Home size={20} />
          Go to Home
        </button>
        
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            fontSize: '16px'
          }}
        >
          <ArrowLeft size={20} />
          Go Back
        </button>
      </div>

      <div style={{
        marginTop: '50px',
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        maxWidth: '600px'
      }}>
        <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#374151' }}>
          Quick Links / လင့်ခ်များ
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '10px'
        }}>
          <button onClick={() => navigate('/pos')} className="btn btn-secondary" style={{ fontSize: '14px' }}>
            POS
          </button>
          <button onClick={() => navigate('/products')} className="btn btn-secondary" style={{ fontSize: '14px' }}>
            Products
          </button>
          <button onClick={() => navigate('/orders')} className="btn btn-secondary" style={{ fontSize: '14px' }}>
            Orders
          </button>
          <button onClick={() => navigate('/customers')} className="btn btn-secondary" style={{ fontSize: '14px' }}>
            Customers
          </button>
          <button onClick={() => navigate('/reports')} className="btn btn-secondary" style={{ fontSize: '14px' }}>
            Reports
          </button>
          <button onClick={() => navigate('/settings')} className="btn btn-secondary" style={{ fontSize: '14px' }}>
            Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
