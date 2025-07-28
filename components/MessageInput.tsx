import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { SendIcon, StopIcon } from './icons';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onStopProcessing: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onStopProcessing, isLoading, isDisabled }) => {
  const [text, setText] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading && !isDisabled) {
      onSendMessage(text.trim());
      setText('');
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const placeholderText = isDisabled 
    ? "Please provide TestRail credentials in settings above..." 
    : "Ask about test executions for a project...";

  return (
    <div className="bg-gray-800/50 p-4 border-t border-gray-700/50 backdrop-blur-sm sticky bottom-0">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-end space-x-3">
        <textarea
          ref={textAreaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          rows={1}
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-3 resize-none text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200 max-h-48 disabled:cursor-not-allowed"
          disabled={isLoading || isDisabled}
        />
        {isLoading ? (
          <button
            type="button"
            onClick={onStopProcessing}
            className="bg-red-600 text-white rounded-full p-3 hover:bg-red-500 transition-colors duration-200 flex-shrink-0"
            title="Stop processing"
          >
            <StopIcon className="w-6 h-6" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isDisabled || !text.trim()}
            className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
            title="Send message"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        )}
      </form>
    </div>
  );
};

export default MessageInput;
