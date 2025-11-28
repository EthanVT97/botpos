import React from 'react';
import ChatEnhanced from '../components/ChatEnhanced';
import api from '../api/client';

const Messages = () => {
  return (
    <div className="page" style={{ padding: 0, height: 'calc(100vh - 60px)' }}>
      <ChatEnhanced api={api} />
    </div>
  );
};

export default Messages;
