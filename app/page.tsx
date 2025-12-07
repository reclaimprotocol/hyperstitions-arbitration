'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Arbitration {
  _id: string;
  name: string;
  hyperstitionLink: string;
  createdAt: string;
}

export default function Home() {
  const [arbitrations, setArbitrations] = useState<Arbitration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArbitrations();
  }, []);

  const fetchArbitrations = async () => {
    try {
      const response = await fetch('/api/arbitrations');
      const data = await response.json();
      setArbitrations(data);
    } catch (error) {
      console.error('Failed to fetch arbitrations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Hyperstitions Arbitration
          </h1>
          <Link
            href="/create"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Arbitration
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-600 dark:text-zinc-400">
            Loading arbitrations...
          </div>
        ) : arbitrations.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 dark:text-zinc-400">
            No arbitrations yet. Create your first one!
          </div>
        ) : (
          <div className="grid gap-4">
            {arbitrations.map((arbitration) => (
              <Link
                key={arbitration._id}
                href={`/arbitration/${arbitration._id}`}
                className="block p-6 bg-white dark:bg-zinc-900 rounded-lg shadow hover:shadow-lg transition-shadow border border-zinc-200 dark:border-zinc-800"
              >
                <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
                  {arbitration.name}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                  {arbitration.hyperstitionLink}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  Created: {new Date(arbitration.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
