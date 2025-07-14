import React, { useState } from 'react';

interface MessageInputProps {
  onSend: (text: string) => void;
}

const ChatInput: React.FC<MessageInputProps> = ({ onSend }) => {
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (input.trim()) {
      onSend(input);

      setInput('');
    }
  };

  return (
    <div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
};

export default ChatInput;