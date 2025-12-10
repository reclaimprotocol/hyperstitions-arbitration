'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Session {
  _id: string;
  arbitrationId: string;
  zkFetchMethod: 'GET' | 'POST';
  publicParams: {
    headers?: Record<string, string>;
    body?: any;
  };
  privateParamKeys: {
    headers?: string[];
    body?: string[];
  };
  prompt: string;
  apiProofResponse: any;
  claudeProofResponse: any;
  createdAt: string;
}

export default function SessionView() {
  const params = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchSession(params.id as string);
    }
  }, [params.id]);

  const fetchSession = async (id: string) => {
    try {
      const response = await fetch(`/api/sessions/${id}`);
      const data = await response.json();
      console.log('private params', data.privateParams);
      setSession(data);
    } catch (error) {
      console.error('Failed to fetch session:', error);
    } finally {
      setLoading(false);
    }
  };

  const safeJsonParse = (data: any) => {
    if (!data) return null;
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      console.error('JSON parse error:', e);
      return data;
    }
  };

  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">Session not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Arbitration Session
          </h1>
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
        </div>

        <div className="space-y-6">
          {/* Session Info */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
              Session Information
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <td className="py-2 pr-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Session ID</td>
                    <td className="py-2 text-sm text-zinc-700 dark:text-zinc-300">{session._id}</td>
                  </tr>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <td className="py-2 pr-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Arbitration ID</td>
                    <td className="py-2 text-sm">
                      <a
                        href={`/arbitration/${session.arbitrationId}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {session.arbitrationId}
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <td className="py-2 pr-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Created</td>
                    <td className="py-2 text-sm text-zinc-700 dark:text-zinc-300">{new Date(session.createdAt).toLocaleString()}</td>
                  </tr>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <td className="py-2 pr-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Method</td>
                    <td className="py-2 text-sm text-zinc-700 dark:text-zinc-300">{session.zkFetchMethod}</td>
                  </tr>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <td className="py-2 pr-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">URL</td>
                    <td className="py-2 text-sm text-zinc-700 dark:text-zinc-300 break-all">
                      {safeJsonParse(session.apiProofResponse?.proof?.claimData?.parameters)?.url || 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Prompt Used</td>
                    <td className="py-2 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                      {session.prompt}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Claude Response */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
              Claude Response
            </h2>
            <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
              {JSON.stringify(safeJsonParse(session.claudeProofResponse?.proof?.extractedParameterValues?.data)?.content?.[0]?.text || 'N/A', null, 2)}
            </pre>
          </div>

          {/* API Proof Response */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
              API zkFetch Proof Response
            </h2>

            <h3 className="text-lg font-semibold text-black dark:text-white mb-2 mt-4">Request</h3>
            <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
              {JSON.stringify(safeJsonParse(session.apiProofResponse?.proof?.claimData?.parameters) || {}, null, 2)}
            </pre>

            <h3 className="text-lg font-semibold text-black dark:text-white mb-2 mt-6">Response</h3>
            <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
              {JSON.stringify(safeJsonParse(session.apiProofResponse?.proof?.extractedParameterValues?.data) || {}, null, 2)}
            </pre>

            <h3 className="text-lg font-semibold text-black dark:text-white mb-2 mt-6">Full Proof</h3>
            <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
              {JSON.stringify(session.apiProofResponse, null, 2)}
            </pre>
          </div>

          {/* Claude Proof Response */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
              Claude API zkFetch Proof Response
            </h2>

            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Full Proof</h3>
            <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
              {JSON.stringify(session.claudeProofResponse, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
