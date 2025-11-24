import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Check, X, AlertCircle, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { getBotConfig, setupTelegramBot, setupViberBot, setupMessengerBot, testBotToken, getWebhookStatus, deleteWebhook } from '../api/api';

const Settings = () => {
  const [settings, setSettings] = useState({
    store_name: '',
    store_name_mm: '',
    store_phone: '',
    store_address: '',
    tax_rate: '0',
    currency: 'MMK',
    low_stock_threshold: '10'
  });
  const [loading, setLoading] = useState(false);
  const [botStatus, setBotStatus] = useState({
    viber: false,
    telegram: false,
    messenger: false
  });

  // Bot configuration states
  const [showBotConfig, setShowBotConfig] = useState(null);
  const [botTokens, setBotTokens] = useState({
    telegram: '',
    viber: '',
    messenger_page: '',
    messenger_verify: ''
  });
  const [webhookDomain, setWebhookDomain] = useState('');
  const [testingToken, setTestingToken] = useState(false);
  const [setupStatus, setSetupStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    loadSettings();
    loadBotConfig();
    checkWebhookStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      if (res.data.success && res.data.data) {
        const settingsObj = {};
        res.data.data.forEach(item => {
          settingsObj[item.key] = item.value;
        });
        setSettings(prev => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadBotConfig = async () => {
    try {
      const res = await getBotConfig();
      if (res.data.success) {
        setWebhookDomain(res.data.data.webhook_domain || '');
      }
    } catch (error) {
      console.error('Error loading bot config:', error);
    }
  };

  const checkWebhookStatus = async () => {
    try {
      const res = await getWebhookStatus();
      if (res.data.success) {
        setBotStatus(res.data.data);
      }
    } catch (error) {
      console.error('Error checking webhook status:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await axios.put(`/api/settings/${key}`, { value });
      }
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestToken = async (platform) => {
    setTestingToken(true);
    setSetupStatus({ type: '', message: '' });
    
    try {
      let token = '';
      if (platform === 'telegram') token = botTokens.telegram;
      else if (platform === 'viber') token = botTokens.viber;
      else if (platform === 'messenger') token = botTokens.messenger_page;

      const res = await testBotToken(platform, token);
      
      if (res.data.success) {
        setSetupStatus({ 
          type: 'success', 
          message: `✓ Token is valid! Bot: ${res.data.bot_info?.username || res.data.bot_info?.name || 'Connected'}` 
        });
      } else {
        setSetupStatus({ type: 'error', message: res.data.error });
      }
    } catch (error) {
      setSetupStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'Invalid token' 
      });
    } finally {
      setTestingToken(false);
    }
  };

  const handleSetupBot = async (platform) => {
    if (!webhookDomain) {
      setSetupStatus({ type: 'error', message: 'Please enter your domain first' });
      return;
    }

    setLoading(true);
    setSetupStatus({ type: '', message: '' });

    try {
      let res;
      
      if (platform === 'telegram') {
        res = await setupTelegramBot({ 
          token: botTokens.telegram, 
          domain: webhookDomain 
        });
      } else if (platform === 'viber') {
        res = await setupViberBot({ 
          token: botTokens.viber, 
          domain: webhookDomain 
        });
      } else if (platform === 'messenger') {
        res = await setupMessengerBot({ 
          pageAccessToken: botTokens.messenger_page,
          verifyToken: botTokens.messenger_verify,
          domain: webhookDomain 
        });
      }

      if (res.data.success) {
        setSetupStatus({ 
          type: 'success', 
          message: res.data.message,
          instructions: res.data.instructions,
          webhook_url: res.data.webhook_url
        });
        setBotTokens({ telegram: '', viber: '', messenger_page: '', messenger_verify: '' });
        checkWebhookStatus();
      } else {
        setSetupStatus({ type: 'error', message: res.data.error });
      }
    } catch (error) {
      setSetupStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'Setup failed' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async (platform) => {
    if (!window.confirm(`Are you sure you want to remove ${platform} webhook?`)) {
      return;
    }

    try {
      await deleteWebhook(platform);
      alert('Webhook removed successfully');
      checkWebhookStatus();
    } catch (error) {
      alert('Failed to remove webhook');
    }
  };

  const renderBotConfigModal = () => {
    if (!showBotConfig) return null;

    const platform = showBotConfig;
    const isConnected = botStatus[platform];

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div className="card" style={{ 
          width: '90%', 
          maxWidth: '600px', 
          maxHeight: '90vh', 
          overflow: 'auto' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', textTransform: 'capitalize' }}>
              {platform} Bot Configuration
            </h3>
            <button 
              onClick={() => {
                setShowBotConfig(null);
                setSetupStatus({ type: '', message: '' });
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}
            >
              ×
            </button>
          </div>

          {isConnected && (
            <div style={{ 
              padding: '12px', 
              background: '#d1fae5', 
              border: '1px solid #10b981',
              borderRadius: '6px', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Check size={18} color="#10b981" />
              <span style={{ color: '#065f46' }}>Bot is currently connected</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Webhook Domain</label>
            <input 
              className="input"
              value={webhookDomain}
              onChange={(e) => setWebhookDomain(e.target.value)}
              placeholder="https://your-domain.com"
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Your public domain where the bot will receive messages
            </p>
          </div>

          {platform === 'telegram' && (
            <>
              <div className="form-group">
                <label className="form-label">Bot Token</label>
                <input 
                  className="input"
                  type="password"
                  value={botTokens.telegram}
                  onChange={(e) => setBotTokens({...botTokens, telegram: e.target.value})}
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Get token from <a href="https://t.me/botfather" target="_blank" rel="noopener noreferrer">@BotFather</a>
                </p>
              </div>
              <button 
                className="btn btn-secondary"
                onClick={() => handleTestToken('telegram')}
                disabled={!botTokens.telegram || testingToken}
                style={{ marginBottom: '12px' }}
              >
                {testingToken ? 'Testing...' : 'Test Token'}
              </button>
            </>
          )}

          {platform === 'viber' && (
            <>
              <div className="form-group">
                <label className="form-label">Bot Token</label>
                <input 
                  className="input"
                  type="password"
                  value={botTokens.viber}
                  onChange={(e) => setBotTokens({...botTokens, viber: e.target.value})}
                  placeholder="Your Viber bot token"
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Get token from <a href="https://partners.viber.com" target="_blank" rel="noopener noreferrer">Viber Partners</a>
                </p>
              </div>
              <button 
                className="btn btn-secondary"
                onClick={() => handleTestToken('viber')}
                disabled={!botTokens.viber || testingToken}
                style={{ marginBottom: '12px' }}
              >
                {testingToken ? 'Testing...' : 'Test Token'}
              </button>
            </>
          )}

          {platform === 'messenger' && (
            <>
              <div className="form-group">
                <label className="form-label">Page Access Token</label>
                <input 
                  className="input"
                  type="password"
                  value={botTokens.messenger_page}
                  onChange={(e) => setBotTokens({...botTokens, messenger_page: e.target.value})}
                  placeholder="Your page access token"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Verify Token</label>
                <input 
                  className="input"
                  value={botTokens.messenger_verify}
                  onChange={(e) => setBotTokens({...botTokens, messenger_verify: e.target.value})}
                  placeholder="Create a custom verify token"
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Create any random string (e.g., "my_verify_token_123")
                </p>
              </div>
              <button 
                className="btn btn-secondary"
                onClick={() => handleTestToken('messenger')}
                disabled={!botTokens.messenger_page || testingToken}
                style={{ marginBottom: '12px' }}
              >
                {testingToken ? 'Testing...' : 'Test Token'}
              </button>
            </>
          )}

          {setupStatus.message && (
            <div style={{ 
              padding: '12px', 
              background: setupStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
              border: `1px solid ${setupStatus.type === 'success' ? '#10b981' : '#ef4444'}`,
              borderRadius: '6px', 
              marginBottom: '16px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '8px',
                color: setupStatus.type === 'success' ? '#065f46' : '#991b1b'
              }}>
                {setupStatus.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0 }}>{setupStatus.message}</p>
                  {setupStatus.webhook_url && (
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                      Webhook URL: <code>{setupStatus.webhook_url}</code>
                    </p>
                  )}
                  {setupStatus.instructions && (
                    <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '12px' }}>
                      {setupStatus.instructions.map((inst, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{inst}</li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-primary"
              onClick={() => handleSetupBot(platform)}
              disabled={loading || !webhookDomain || 
                (platform === 'telegram' && !botTokens.telegram) ||
                (platform === 'viber' && !botTokens.viber) ||
                (platform === 'messenger' && (!botTokens.messenger_page || !botTokens.messenger_verify))
              }
              style={{ flex: 1 }}
            >
              {loading ? 'Setting up...' : 'Setup Webhook'}
            </button>
            {isConnected && (
              <button 
                className="btn btn-secondary"
                onClick={() => handleDeleteWebhook(platform)}
                style={{ background: '#ef4444', color: 'white' }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Settings / ဆက်တင်များ</h1>
        <p className="page-subtitle">Configure your POS system</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div>
          <div className="card">
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Store Information / ဆိုင်အချက်အလက်
            </h3>
            
            <div className="form-group">
              <label className="form-label">Store Name</label>
              <input 
                className="input" 
                value={settings.store_name}
                onChange={(e) => setSettings({...settings, store_name: e.target.value})}
                placeholder="My Store"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Store Name (Myanmar)</label>
              <input 
                className="input" 
                value={settings.store_name_mm}
                onChange={(e) => setSettings({...settings, store_name_mm: e.target.value})}
                placeholder="ကျွန်ုပ်တို့ဆိုင်"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                className="input" 
                value={settings.store_phone}
                onChange={(e) => setSettings({...settings, store_phone: e.target.value})}
                placeholder="+95 9 123 456 789"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea 
                className="input" 
                rows="3"
                value={settings.store_address}
                onChange={(e) => setSettings({...settings, store_address: e.target.value})}
                placeholder="Store address"
              />
            </div>

            <h3 style={{ marginTop: '32px', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Business Settings / စီးပွားရေးဆက်တင်များ
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Tax Rate (%)</label>
                <input 
                  type="number" 
                  className="input" 
                  value={settings.tax_rate}
                  onChange={(e) => setSettings({...settings, tax_rate: e.target.value})}
                  placeholder="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Currency</label>
                <select 
                  className="input"
                  value={settings.currency}
                  onChange={(e) => setSettings({...settings, currency: e.target.value})}
                >
                  <option value="MMK">MMK (Kyat)</option>
                  <option value="USD">USD (Dollar)</option>
                  <option value="THB">THB (Baht)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Low Stock Threshold</label>
              <input 
                type="number" 
                className="input" 
                value={settings.low_stock_threshold}
                onChange={(e) => setSettings({...settings, low_stock_threshold: e.target.value})}
                placeholder="10"
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Alert when product stock falls below this number
              </p>
            </div>

            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={loading}
              style={{ marginTop: '16px' }}
            >
              {loading ? <RefreshCw size={18} style={{ marginRight: '8px', display: 'inline' }} /> : <Save size={18} style={{ marginRight: '8px', display: 'inline' }} />}
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        <div>
          <div className="card">
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Bot Configuration / Bot ဆက်တင်
            </h3>
            
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Viber Bot</label>
                <span className={`badge ${botStatus.viber ? 'badge-success' : 'badge-danger'}`}>
                  {botStatus.viber ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowBotConfig('viber')}
                style={{ width: '100%' }}
              >
                {botStatus.viber ? 'Manage' : 'Setup'} Viber Bot
              </button>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Telegram Bot</label>
                <span className={`badge ${botStatus.telegram ? 'badge-success' : 'badge-danger'}`}>
                  {botStatus.telegram ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowBotConfig('telegram')}
                style={{ width: '100%' }}
              >
                {botStatus.telegram ? 'Manage' : 'Setup'} Telegram Bot
              </button>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Messenger Bot</label>
                <span className={`badge ${botStatus.messenger ? 'badge-success' : 'badge-danger'}`}>
                  {botStatus.messenger ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowBotConfig('messenger')}
                style={{ width: '100%' }}
              >
                {botStatus.messenger ? 'Manage' : 'Setup'} Messenger Bot
              </button>
            </div>

            <button 
              className="btn btn-secondary" 
              onClick={checkWebhookStatus}
              style={{ width: '100%', marginTop: '8px' }}
            >
              <RefreshCw size={16} style={{ marginRight: '8px', display: 'inline' }} />
              Refresh Status
            </button>
          </div>

          <div className="card" style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              System Info
            </h3>
            
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <p style={{ marginBottom: '8px', fontSize: '14px' }}><strong>Version:</strong> 1.0.0</p>
              <p style={{ marginBottom: '8px', fontSize: '14px' }}><strong>Database:</strong> PostgreSQL (Render)</p>
              <p style={{ fontSize: '14px' }}><strong>Backend:</strong> Node.js + Express</p>
            </div>
          </div>
        </div>
      </div>

      {renderBotConfigModal()}
    </div>
  );
};

export default Settings;
