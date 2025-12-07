'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Session {
  _id: string;
  createdAt: string;
  claudeProofResponse: any;
}

interface Arbitration {
  _id: string;
  name: string;
  zkFetchMethod: 'GET' | 'POST';
  publicParams: {
    headers?: Record<string, string>;
    body?: any;
  };
  privateParams: {
    headers?: Record<string, string>;
    body?: any;
  };
  environmentVariables: Record<string, string>;
  prompt: string;
  hyperstitionLink: string;
  createdAt: string;
  sessions: Session[];
}

export default function ArbitrationDetail() {
  const params = useParams();
  const router = useRouter();
  const [arbitration, setArbitration] = useState<Arbitration | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchArbitration(params.id as string);
    }
  }, [params.id]);

  const fetchArbitration = async (id: string) => {
    try {
      const response = await fetch(`/api/arbitrations/${id}`);
      const data = await response.json();
      console.log("data fetcheD", data)
      setArbitration(data);
    } catch (error) {
      console.error('Failed to fetch arbitration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunArbitration = async () => {
    if (!arbitration) return;

    setRunning(true);
    try {
      const response = await fetch('/api/run-arbitration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          arbitrationId: arbitration._id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to session view
        router.push(`/session/${data.sessionId}`);
      } else {
        alert(data.error || 'Failed to run arbitration');
      }
    } catch (error) {
      console.error('Failed to run arbitration:', error);
      alert('An error occurred while running the arbitration');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">Loading...</div>
      </div>
    );
  }

  if (!arbitration) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">Arbitration not found</div>
      </div>
    );
  }

  const getPrivateParamKeys = () => {
    const keys: { headers: string[], body: string[] } = { headers: [], body: [] };
    console.log("private params", arbitration.privateParams);
    if (arbitration.privateParams.headers) {
      keys.headers = Object.keys(arbitration.privateParams.headers);
    }

    if (arbitration.privateParams.body && typeof arbitration.privateParams.body === 'object') {
      keys.body = Object.keys(arbitration.privateParams.body);
    }

    return keys;
  };

  const privateKeys = getPrivateParamKeys();

  const getElapsedTime = (createdAt: string) => {
    const now = new Date().getTime();
    const created = new Date(createdAt).getTime();
    const diff = now - created;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Arbitrations
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-zinc-200 dark:border-zinc-800 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
              {arbitration.name}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Created: {new Date(arbitration.createdAt).toLocaleString()}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
              Hyperstition Link
            </h2>
            <a
              href={arbitration.hyperstitionLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {arbitration.hyperstitionLink}
            </a>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
              Method
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">{arbitration.zkFetchMethod}</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
              Public Parameters
            </h2>
            <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(arbitration.publicParams, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
              Private Parameters 
            </h2>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              {privateKeys.headers.length > 0 && (
                <div className="mb-2">
                  <p className="font-medium text-black dark:text-white mb-1">Headers:</p>
                  <ul className="list-disc list-inside text-sm text-zinc-700 dark:text-zinc-300">
                    {privateKeys.headers.map(key => (
                      <li key={key}>{key}: ***</li>
                    ))}
                  </ul>
                </div>
              )}
              {privateKeys.body.length > 0 && (
                <div>
                  <p className="font-medium text-black dark:text-white mb-1">Body:</p>
                  <ul className="list-disc list-inside text-sm text-zinc-700 dark:text-zinc-300">
                    {privateKeys.body.map(key => (
                      <li key={key}>{key}: ***</li>
                    ))}
                  </ul>
                </div>
              )}
              {privateKeys.headers.length === 0 && privateKeys.body.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No private parameters</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
              Prompt
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {arbitration.prompt}
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={handleRunArbitration}
              disabled={running}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {running ? 'Running Arbitration...' : 'Run Arbitration'}
            </button>
          </div>

          {arbitration.sessions && arbitration.sessions.length > 0 && (
            <div className="pt-6">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
                Previous Sessions
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-800">
                      <th className="text-left p-3 text-sm font-semibold text-black dark:text-white border-b border-zinc-200 dark:border-zinc-700">
                        Time Elapsed
                      </th>
                      <th className="text-left p-3 text-sm font-semibold text-black dark:text-white border-b border-zinc-200 dark:border-zinc-700">
                        Claude Response
                      </th>
                      <th className="text-left p-3 text-sm font-semibold text-black dark:text-white border-b border-zinc-200 dark:border-zinc-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {arbitration.sessions.filter(session=> {
                      console.log(session.claudeProofResponse.proof.extractedParameterValues)
                      return session.claudeProofResponse.proof.extractedParameterValues
                    }).map((session) => (
                      <tr
                        key={session._id}
                        className="border-b border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      >
                        <td className="p-3 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          {getElapsedTime(session.createdAt)}
                        </td>
                        <td className="p-3 text-sm text-zinc-700 dark:text-zinc-300">
                          <div className="max-w-md overflow-hidden text-ellipsis">
                              {JSON.stringify(JSON.parse(session.claudeProofResponse.proof.extractedParameterValues.data).content[0].text).slice(0, 200)}{JSON.parse(session.claudeProofResponse.proof.extractedParameterValues.data).content[0].text.length > 200 ? '...' : ''}
                          </div>
                        </td>
                        <td className="p-3 text-sm">
                          <button
                            onClick={() => router.push(`/session/${session._id}`)}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
