import React from 'react';
import Chat from '../components/ChatRealtime';
import api from '../api/client';

const Messages = () => {
  return (
    <div className="page" style={{ padding: 0, height: 'calc(100vh - 60px)' }}>
      <Chat api={api} />
    </div>
  );
};

export default Messages;
