'use client';
import React, { useState } from 'react';

import Chat from './Chat';
import ChatInput from './ChatInput';
import { callAgent } from '@/app/api/agent/crud';

const ChatSlot: React.FC = () => {
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);

  const handleSend = async (text: string) => {
    const newMessage = { text, sender: 'You' };
    await callAgent(text);
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  return (
    <div>
      <h1>Chat</h1>
      <div>
        {messages.map((msg, index) => (
          <Chat key={index} text={msg.text} sender={msg.sender} />
        ))}
      </div>
      <ChatInput onSend={handleSend} />
    </div>
  );
};

export default ChatSlot;