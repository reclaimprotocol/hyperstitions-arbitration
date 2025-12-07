import { NextResponse } from 'next/server';
import { parseCurl } from '@/lib/curlParser';

export async function POST(request: Request) {
  try {
    const { curlCommand, envVariables } = await request.json();

    if (!curlCommand) {
      return NextResponse.json(
        { error: 'Curl command is required' },
        { status: 400 }
      );
    }

    // Parse curl to fetch request
    const fetchRequest = parseCurl(curlCommand, envVariables);

    // Test the request
    try {
      const response = await fetch(fetchRequest.url, {
        method: fetchRequest.method,
        headers: fetchRequest.headers,
        body: fetchRequest.body,
      });

      if (response.status >= 400) {
        return NextResponse.json(
          {
            error: `Request failed with status ${response.status}`,
            statusCode: response.status,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        fetchRequest,
      });
    } catch (fetchError: any) {
      return NextResponse.json(
        { error: `Request failed: ${fetchError.message}` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error validating curl:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate curl command' },
      { status: 500 }
    );
  }
}
