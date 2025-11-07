import React from 'react';
import { ChatMessage as ChatMessageType } from '../types.ts';
import { UserIcon, BotIcon } from './icons.tsx';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  if (message.role === 'system') {
    return (
      <div className="text-center my-4">
        <p className="text-sm text-red-400 italic bg-slate-800/50 px-3 py-1 rounded-full inline-block">
          {message.text}
        </p>
      </div>
    );
  }
  
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center">
          <BotIcon className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={`max-w-xl p-4 rounded-2xl whitespace-pre-wrap ${
          isUser
            ? 'bg-sky-600 rounded-br-none'
            : 'bg-slate-700 rounded-bl-none'
        }`}
      >
        <p className="text-slate-50">{message.text}</p>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
