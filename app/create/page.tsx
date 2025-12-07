'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateCurl() {
  const router = useRouter();
  const [curlCommand, setCurlCommand] = useState('');
  const [envVariables, setEnvVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Extract variable names from curl command
    const variablePattern = /\$([A-Z_][A-Z0-9_]*)/g;
    const matches = curlCommand.matchAll(variablePattern);
    const variables: Record<string, string> = {};

    for (const match of matches) {
      const varName = match[1];
      if (!variables[varName]) {
        variables[varName] = envVariables[varName] || '';
      }
    }

    // Only update if variables have changed
    const existingKeys = Object.keys(envVariables).sort().join(',');
    const newKeys = Object.keys(variables).sort().join(',');
    if (existingKeys !== newKeys) {
      setEnvVariables(variables);
    }
  }, [curlCommand]);

  const handleEnvChange = (key: string, value: string) => {
    setEnvVariables(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = async () => {
    if (!curlCommand.trim()) {
      setError('Please enter a curl command');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/validate-curl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curlCommand,
          envVariables,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to validate curl request');
        setLoading(false);
        return;
      }

      // Store data in session storage and navigate
      sessionStorage.setItem('arbitrationData', JSON.stringify({
        curlCommand,
        envVariables,
        fetchRequest: data.fetchRequest,
      }));

      router.push('/create/configure');
    } catch (err) {
      setError('An error occurred while validating the request');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-black dark:text-white mb-8">
          Create New Arbitration - Step 1: Enter cURL Request
        </h1>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-zinc-200 dark:border-zinc-800">
          <label className="block mb-2 text-sm font-medium text-black dark:text-white">
            cURL Command
          </label>
          <textarea
            value={curlCommand}
            onChange={(e) => setCurlCommand(e.target.value)}
            placeholder={`curl -X POST https://api.example.com/endpoint -H 'Authorization: Bearer $API_KEY' -d '{"param": "$VALUE"}'`}
            className="w-full h-48 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white font-mono text-sm"
          />

          {Object.keys(envVariables).length == 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
                Hide sensitive credentials
              </h2>
              <p>
                You can set sensitive credentials like API keys, Auth tokens etc by using an environment variable. 
                To use an environment variable, simply use $VARIABLE_NAME in your curl request. These credentials will NOT be exposed in the Proof that gets generated.
              </p>
            </div>

          )}

          {Object.keys(envVariables).length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
                Environment Variables
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-100 dark:bg-zinc-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-white">
                        Variable Name
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-white">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(envVariables).map(([key, value]) => (
                      <tr key={key} className="border-t border-zinc-200 dark:border-zinc-700">
                        <td className="px-4 py-2 text-sm text-black dark:text-white font-mono">
                          ${key}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleEnvChange(key, e.target.value)}
                            className="w-full px-3 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-black dark:text-white text-sm"
                            placeholder={`Enter value for ${key}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Validating...' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
