
import React, { useState, useEffect, useCallback } from 'react';
import { Message, Role, TestRailSettings } from './common/types';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import Settings from './components/Settings';

const SERVER_URL = 'http://localhost:3001';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: Role.Model,
      text: "Hello! I'm your expert assistant for TestRail. Please provide your TestRail credentials in the settings to get started.",
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<TestRailSettings | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(true);

  const handleSendMessage = useCallback(async (inputText: string) => {
    if (isLoading || !inputText.trim() || !settings) return;

    setIsLoading(true);
    setError(null);
    
    const userMessage: Message = { role: Role.User, text: inputText };
    const currentHistory = [...messages, userMessage];
    setMessages(currentHistory);
    
    // Add a placeholder for the model's response
    setMessages(prev => [...prev, { role: Role.Model, text: '' }]);

    try {
      const response = await fetch(`${SERVER_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputText,
          history: currentHistory.slice(0, -1), // Exclude the placeholder
          settings: settings,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server responded with an error: ${response.status} ${errText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader.");
      }

      const decoder = new TextDecoder();
      let finalResponseText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
            try {
                const parsed = JSON.parse(line) as Message;
                if (parsed.role === Role.System) {
                    // Temporarily add system message, it will be cleaned up later
                    setMessages(prev => [...prev.slice(0, -1), parsed, { role: Role.Model, text: '' }]);
                } else if (parsed.role === Role.Model) {
                    finalResponseText += parsed.text;
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];
                        if (lastMessage && lastMessage.role === Role.Model) {
                             lastMessage.text = finalResponseText;
                        }
                        return newMessages;
                    });
                }
            } catch (e) {
                console.error("Failed to parse chunk:", line, e);
            }
        }
      }

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Error: ${errorMessage}`);
      setMessages(prev => [...prev, { role: Role.Model, text: `Sorry, I've run into an issue: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
      // Clean up system messages
      setMessages(prev => prev.filter(m => m.role !== Role.System));
    }
  }, [isLoading, messages, settings]);


  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <Header onToggleSettings={() => setShowSettings(s => !s)} />
      {showSettings && <Settings onSave={setSettings} onDone={() => setShowSettings(false)} />}
      <ChatWindow messages={messages} />
      <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} isDisabled={!settings} />
      {error && (
        <div className="bg-red-500/20 text-red-300 p-2 text-center text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default App;