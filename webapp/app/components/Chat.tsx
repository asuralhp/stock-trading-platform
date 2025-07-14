import React from 'react';

interface MessageProps {
  text: string;
  sender: string;
}

const Message: React.FC<MessageProps> = ({ text, sender }) => {
  return (
    <div>
      <strong>{sender}: </strong>
      <span>{text}</span>
    </div>
  );
};

export default Message;