
import React, { useState } from 'react';

interface SettingsProps {
  onSave: (settings: { url: string; email: string; apiKey: string }) => void;
  onDone: () => void;
}

const SERVER_URL = 'http://localhost:3001';

const Settings: React.FC<SettingsProps> = ({ onSave, onDone }) => {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !email.trim() || !apiKey.trim()) {
      setError('All fields are required.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
        let validatedUrl;
        try {
            validatedUrl = new URL(url.trim());
             if(validatedUrl.pathname.endsWith('/')){
                validatedUrl.pathname = validatedUrl.pathname.slice(0, -1);
            }
        } catch (_) {
             throw new Error('Please enter a valid URL (e.g., https://your-company.testrail.com).');
        }
        
        const settingsToVerify = {
            url: validatedUrl.origin,
            email: email.trim(),
            apiKey: apiKey.trim()
        };

        const testResponse = await fetch(`${SERVER_URL}/api/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsToVerify)
        });

        if (!testResponse.ok) {
            const errorBody = await testResponse.json();
            throw new Error(errorBody.error || 'Verification failed with an unknown error.');
        }

        onSave(settingsToVerify);
        onDone();

    } catch(e) {
        const err = e as Error;
        let errorMessage = err.message;
        
        if (errorMessage.includes('Failed to fetch')) {
            errorMessage = 'Failed to connect to the local server. Is it running?';
        }

        setError(errorMessage);
    } finally {
        setIsVerifying(false);
    }
  };

  return (
    <div className="bg-gray-800 p-4 border-b border-gray-700/50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">TestRail Connection Settings</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="testrail-url" className="block text-sm font-medium text-gray-300 mb-1">TestRail URL</label>
            <input
              type="text"
              id="testrail-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-company.testrail.com"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={isVerifying}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your TestRail email address"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={isVerifying}
            />
          </div>
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-1">API Key</label>
            <input
              type="password"
              id="api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Find this in TestRail under My Settings > API Keys"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={isVerifying}
            />
          </div>
          {error && <p className="text-red-400 text-sm whitespace-pre-wrap">{error}</p>}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
                Your credentials are sent to a local server proxy and not stored permanently.
            </p>
            <button
              type="submit"
              className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-500 disabled:bg-gray-500 disabled:cursor-wait transition-colors w-36 text-center"
              disabled={isVerifying}
            >
              {isVerifying ? 'Connecting...' : 'Save & Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
