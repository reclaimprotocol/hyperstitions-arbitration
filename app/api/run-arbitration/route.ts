import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Arbitration from '@/models/Arbitration';
import Session from '@/models/Session';
import { ReclaimClient } from '@reclaimprotocol/zk-fetch';

// Placeholder for zkFetch - in production, use the actual Reclaim Protocol SDK
// or run this in a separate service that supports native modules
async function zkFetch(url: string, publicOptions: any, privateOptions: any) {
  // Make the actual fetch request
  console.log('Making zkFetch request to:', url, 'with options:', publicOptions, privateOptions);
  const client = new ReclaimClient(process.env.RECLAIMPROTOCOL_APP_ID || "", process.env.RECLAIMPROTOCOL_APP_SECRET || "");
  const response = await client.zkFetch(url, publicOptions, privateOptions);
  console.log('zkFetch response:', response);

  // In production, this would return a cryptographic proof
  // For now, we return the data with a simulated proof structure
  return {
    proof: response
  };
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const { arbitrationId } = await request.json();

    // Fetch arbitration
    const arbitration = await Arbitration.findById(arbitrationId);
    if (!arbitration) {
      return NextResponse.json(
        { error: 'Arbitration not found' },
        { status: 404 }
      );
    }

    // Get API URL from arbitration
    let apiUrl = arbitration.apiUrl;

    // Convert Mongoose Maps to plain objects
    const publicHeaders = arbitration.publicParams.headers instanceof Map
      ? Object.fromEntries(arbitration.publicParams.headers)
      : arbitration.publicParams.headers || {};

    // Execute first zkFetch (API call with proof)
    let apiProofResponse;
    try {
      // Convert Mongoose Map to plain object
      const envVars = arbitration.environmentVariables instanceof Map
        ? Object.fromEntries(arbitration.environmentVariables)
        : arbitration.environmentVariables;

      // Replace environment variables in URL, headers and body
      apiUrl = replaceEnvVariables(apiUrl, envVars);

      const processedPrivateHeaders = replaceEnvVariables(
        arbitration.privateParams.headers,
        envVars
      );

      const processedPrivateBody = replaceEnvVariables(
        arbitration.privateParams.body,
        envVars
      );

      const privateHeadersProcessed = processedPrivateHeaders instanceof Map
        ? Object.fromEntries(processedPrivateHeaders)
        : processedPrivateHeaders || {};

      const publicOptions : {
        method: string, headers: Record<string, string>, body?: string
      } = {
        method: arbitration.zkFetchMethod,
        headers: publicHeaders,
        body : JSON.stringify(arbitration.publicParams.body)

      }

      const privateOptions : {
        headers: Record<string, string>, body?: string
      } = {
        headers: privateHeadersProcessed,
        body: JSON.stringify(processedPrivateBody)
      }

      if (arbitration.zkFetchMethod === 'POST') {
        publicOptions.body = JSON.stringify(arbitration.publicParams.body);
        privateOptions.body = JSON.stringify(processedPrivateBody);
      }

      apiProofResponse = await zkFetch(apiUrl, publicOptions, privateOptions);
    } catch (error: any) {
      console.error('API zkFetch error:', error);
      return NextResponse.json(
        { error: 'Failed to execute API zkFetch: ' + error.message },
        { status: 500 }
      );
    }

    // Get Claude API key from environment variables
    const claudeApiKey = arbitration.environmentVariables['CLAUDE_API_KEY'] ||
                         process.env.CLAUDE_API_KEY;

    if (!claudeApiKey) {
      return NextResponse.json(
        { error: 'CLAUDE_API_KEY not found in environment variables' },
        { status: 400 }
      );
    }

    // Execute second zkFetch (Claude API call with proof)
    let claudeProofResponse;
    try {
      const claudeMessages = [
        {
          role: 'user',
          content: `${arbitration.prompt}\n\nAPI Response Data: ${JSON.stringify(apiProofResponse)}`,
        },
      ];

      const claudePublicOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages: claudeMessages,
        }),

      };
      
      const claudePrivateOptions = {
        headers: {
          'x-api-key': claudeApiKey,
        },
      }

      claudeProofResponse = await zkFetch(
        'https://api.anthropic.com/v1/messages',
        claudePublicOptions, 
        claudePrivateOptions
      );
    } catch (error: any) {
      console.error('Claude zkFetch error:', error);
      return NextResponse.json(
        { error: 'Failed to execute Claude zkFetch: ' + error.message },
        { status: 500 }
      );
    }

    // Extract private param keys
    const privateHeadersForKeys = arbitration.privateParams.headers instanceof Map
      ? Object.fromEntries(arbitration.privateParams.headers)
      : arbitration.privateParams.headers || {};

    const privateBodyForKeys = arbitration.privateParams.body instanceof Map
      ? Object.fromEntries(arbitration.privateParams.body)
      : arbitration.privateParams.body || {};

    const privateParamKeys = {
      headers: Object.keys(privateHeadersForKeys),
      body: Object.keys(privateBodyForKeys),
    };

    // Convert publicParams Maps to plain objects before saving
    const publicParamsClean = {
      headers: arbitration.publicParams.headers instanceof Map
        ? Object.fromEntries(arbitration.publicParams.headers)
        : arbitration.publicParams.headers || {},
      body: arbitration.publicParams.body instanceof Map
        ? Object.fromEntries(arbitration.publicParams.body)
        : arbitration.publicParams.body || {},
    };

    // Save session
    const session = await Session.create({
      arbitrationId: arbitration._id,
      zkFetchMethod: arbitration.zkFetchMethod,
      publicParams: publicParamsClean,
      privateParamKeys,
      prompt: arbitration.prompt,
      apiProofResponse,
      claudeProofResponse,
    });

    return NextResponse.json({
      success: true,
      sessionId: session._id,
    });
  } catch (error: any) {
    console.error('Error running arbitration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run arbitration' },
      { status: 500 }
    );
  }
}

function replaceEnvVariables(obj: any, envVars: Record<string, string>): any {
  if (typeof obj === 'string') {
    let result = obj;
    for (const [key, value] of Object.entries(envVars)) {
      const regex = new RegExp(`\\$${key}\\b|\\$\\{${key}\\}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  if (typeof obj === 'object' && obj !== null) {
    // Handle Mongoose Map objects
    if (obj instanceof Map) {
      const result: any = {};
      for (const [key, value] of obj.entries()) {
        result[key] = replaceEnvVariables(value, envVars);
      }
      return result;
    }

    // Handle arrays and plain objects
    const result: any = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceEnvVariables(value, envVars);
    }
    return result;
  }

  return obj;
}
