'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PublishPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [hyperstitionLink, setHyperstitionLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [arbitrationData, setArbitrationData] = useState<any>(null);

  useEffect(() => {
    // Load data from session storage
    const stored = sessionStorage.getItem('arbitrationData');
    if (!stored) {
      router.push('/create');
      return;
    }

    setArbitrationData(JSON.parse(stored));
  }, [router]);

  const handlePublish = async () => {
    if (!name.trim()) {
      setError('Please enter a name for the arbitration');
      return;
    }

    if (!hyperstitionLink.trim()) {
      setError('Please enter the hyperstition market link');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/arbitrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          apiUrl: arbitrationData.apiUrl,
          zkFetchMethod: arbitrationData.zkFetchMethod,
          publicParams: arbitrationData.publicParams,
          privateParams: arbitrationData.privateParams,
          environmentVariables: arbitrationData.envVariables,
          prompt: arbitrationData.prompt,
          hyperstitionLink,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to publish arbitration');
        setLoading(false);
        return;
      }

      // Clear session storage
      sessionStorage.removeItem('arbitrationData');

      // Redirect to home page
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred while publishing');
      setLoading(false);
    }
  };

  if (!arbitrationData) {
    return <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-black dark:text-white mb-8">
          Create New Arbitration - Step 4: Publish
        </h1>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-zinc-200 dark:border-zinc-800 space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-black dark:text-white">
              Arbitration Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this arbitration"
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-black dark:text-white">
              Hyperstition Market Link
            </label>
            <input
              type="text"
              value={hyperstitionLink}
              onChange={(e) => setHyperstitionLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white"
            />
          </div>

          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <h3 className="font-semibold text-black dark:text-white mb-2">Summary</h3>
            <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              <p><strong>Method:</strong> {arbitrationData.zkFetchMethod}</p>
              <p><strong>Environment Variables:</strong> {Object.keys(arbitrationData.envVariables).length} configured</p>
              <p><strong>Prompt:</strong> {arbitrationData.prompt.substring(0, 100)}...</p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => router.push('/create/prompt')}
              className="px-6 py-3 bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handlePublish}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Publishing...' : 'Publish Arbitration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
