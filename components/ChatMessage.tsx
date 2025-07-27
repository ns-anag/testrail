import React from 'react';
import { Message, Role } from '../types';
import { UserIcon, BotIcon, CogIcon } from './icons';

interface ChatMessageProps {
  message: Message;
}

const LoadingDots: React.FC = () => (
  <div className="flex space-x-1 items-center">
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
  </div>
);

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  if (message.role === Role.System) {
    return (
      <div className="flex justify-center items-center gap-2 text-sm text-gray-400">
        <CogIcon className="w-4 h-4 animate-spin [animation-duration:3s]" />
        <span>{message.text}</span>
      </div>
    );
  }

  const isModel = message.role === Role.Model;

  const wrapperClasses = `flex items-start gap-3 ${isModel ? 'justify-start' : 'justify-end'}`;
  const bubbleClasses = `max-w-3xl p-4 rounded-2xl shadow-md whitespace-pre-wrap ${
    isModel
      ? 'bg-gray-700 text-gray-200 rounded-tl-none'
      : 'bg-blue-600 text-white rounded-br-none'
  }`;

  const Avatar = isModel ? (
    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-600 flex-shrink-0">
        <BotIcon className="w-5 h-5 text-cyan-400" />
    </div>
  ) : (
    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-600 flex-shrink-0">
        <UserIcon className="w-5 h-5 text-indigo-400" />
    </div>
  );
  
  const content = message.text === "" && isModel ? <LoadingDots /> : message.text;

  return (
    <div className={wrapperClasses}>
      {isModel && Avatar}
      <div className={bubbleClasses}>
        {content}
      </div>
      {!isModel && Avatar}
    </div>
  );
};

export default ChatMessage;
