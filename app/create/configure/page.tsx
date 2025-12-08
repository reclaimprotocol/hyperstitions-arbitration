'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { separatePublicPrivate } from '@/lib/curlParser';

export default function ConfigureZkFetch() {
  const router = useRouter();
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [publicParams, setPublicParams] = useState('');
  const [privateParams, setPrivateParams] = useState('');
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

    const data = JSON.parse(stored);
    setArbitrationData(data);

    // Pre-populate fields
    const fetchReq = data.fetchRequest;
    setMethod(fetchReq.method || 'GET');

    // Separate public and private parameters using the utility function
    const { publicParams: publicParts, privateParams: privateParts } = separatePublicPrivate(
      fetchReq,
      data.curlCommand
    );

    setPublicParams(JSON.stringify(publicParts, null, 2));
    setPrivateParams(JSON.stringify(privateParts, null, 2));
  }, [router]);

  const handleNext = async () => {
    setLoading(true);
    setError('');

    try {
      const publicParamsObj = JSON.parse(publicParams);
      const privateParamsObj = JSON.parse(privateParams);

      const response = await fetch('/api/validate-zkfetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          apiUrl: arbitrationData.fetchRequest.url,
          publicParams: publicParamsObj,
          privateParams: privateParamsObj,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to validate zkFetch request');
        setLoading(false);
        return;
      }

      // Update session storage
      const updatedData = {
        ...arbitrationData,
        apiUrl: arbitrationData.fetchRequest.url,
        zkFetchMethod: method,
        publicParams: publicParamsObj,
        privateParams: privateParamsObj,
      };
      sessionStorage.setItem('arbitrationData', JSON.stringify(updatedData));

      router.push('/create/prompt');
    } catch (err: any) {
      setError(err.message || 'Invalid JSON in parameters');
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
          Create New Arbitration - Step 2: Configure zkFetch
        </h1>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-zinc-200 dark:border-zinc-800 space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-black dark:text-white">
              HTTP Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as 'GET' | 'POST')}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-black dark:text-white">
              Public Parameters (Headers and Body)
            </label>
            <textarea
              value={publicParams}
              onChange={(e) => setPublicParams(e.target.value)}
              className="w-full h-48 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white font-mono text-sm"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              JSON format: {"{ headers: {...}, body: {...} }"}
            </p>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-black dark:text-white">
              Private Parameters (Headers and Body with variables)
            </label>
            <textarea
              value={privateParams}
              onChange={(e) => setPrivateParams(e.target.value)}
              className="w-full h-48 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white font-mono text-sm"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              JSON format: {"{ headers: {...}, body: {...} }"}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => router.push('/create')}
              className="px-6 py-3 bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            >
              Back
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
