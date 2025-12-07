'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PromptPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
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

  const handleNext = () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    // Update session storage
    const updatedData = {
      ...arbitrationData,
      prompt,
    };
    sessionStorage.setItem('arbitrationData', JSON.stringify(updatedData));
    router.push('/create/publish');
  };

  if (!arbitrationData) {
    return <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-black dark:text-white mb-8">
          Create New Arbitration - Step 3: Enter Prompt
        </h1>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-zinc-200 dark:border-zinc-800">
          <label className="block mb-2 text-sm font-medium text-black dark:text-white">
            Prompt for Claude AI
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter the prompt that will be used with the API response data..."
            className="w-full h-64 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white"
          />
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            This prompt will be used with Claude AI to analyze the data from the zkFetch request.
          </p>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => router.push('/create/configure')}
              className="px-6 py-3 bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
